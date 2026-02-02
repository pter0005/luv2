'use client';

import { useEffect, useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useFirebase, useUser } from '@/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';
import Link from 'next/link';
import { createSession } from '@/app/auth-actions';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const emailErrorMessages: { [key: string]: { title: string; description: string } } = {
    "auth/invalid-credential": { 
        title: "Credenciais Inválidas",
        description: "O e-mail ou a senha que você digitou estão incorretos. Verifique os dados e tente novamente."
    },
    "auth/user-not-found": {
        title: "Usuário Não Encontrado",
        description: "Nenhuma conta foi encontrada com este e-mail. Considere se cadastrar."
    },
    "auth/wrong-password": {
        title: "Senha Incorreta",
        description: "A senha está incorreta. Por favor, tente novamente."
    },
    "auth/email-already-in-use": {
        title: "E-mail Já em Uso",
        description: "Este e-mail já foi usado para criar uma conta. Tente fazer login ou use outro e-mail."
    },
    "auth/weak-password": {
        title: "Senha Fraca",
        description: "A senha precisa ter pelo menos 6 caracteres."
    },
    "auth/invalid-email": {
        title: "E-mail Inválido",
        description: "O formato do e-mail digitado não é válido."
    },
    "auth/operation-not-allowed": {
        title: "Operação não Permitida",
        description: "O login por e-mail e senha não está habilitado neste projeto. Contate o suporte."
    },
    "auth/too-many-requests": {
        title: "Muitas Tentativas",
        description: "O acesso a esta conta foi bloqueado temporariamente devido a muitas tentativas de login. Tente novamente mais tarde."
    },
    "auth/network-request-failed": {
        title: "Erro de Rede",
        description: "Não foi possível conectar ao servidor de autenticação. Verifique sua conexão com a internet."
    }
};

const googleErrorMessages: { [key: string]: string } = {
    "auth/account-exists-with-different-credential": "Já existe uma conta com este e-mail. Faça login com o método que você usou originalmente.",
    "auth/invalid-credential": "A credencial de autenticação fornecida está malformada ou expirou.",
    "auth/operation-not-allowed": "Login com Google não está habilitado.",
    "auth/popup-blocked": "O pop-up de login foi bloqueado pelo navegador. Por favor, habilite os pop-ups para este site.",
    "auth/popup-closed-by-user": "O pop-up de login foi fechado antes da conclusão.",
    "auth/unauthorized-domain": "Este domínio não está autorizado para operações OAuth."
};


function LoginContent() {
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setGoogleLoading] = useState(false);
  const redirectUrl = searchParams.get('redirect') || '/minhas-paginas';

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleAuthSuccess = async (authedUser: User) => {
    // Chama a server action que cria o cookie e faz o redirect no servidor.
    await createSession(authedUser.uid, redirectUrl);
  };

  const handleEmailAuth = async (values: LoginFormValues, isRegister: boolean) => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    try {
        let userCredential;
        if (isRegister) {
            userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const user = userCredential.user;
            const userRef = doc(firestore, "users", user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
              await setDoc(userRef, {
                  id: user.uid,
                  email: user.email,
                  name: user.email?.split('@')[0] || 'Usuário'
              }, { merge: true });
            }

            toast({ title: 'Conta criada com sucesso!', description: 'Você será redirecionado em breve.' });
        } else {
            userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
            toast({ title: 'Login bem-sucedido!', description: 'Você será redirecionado em breve.' });
        }
        
        await handleAuthSuccess(userCredential.user);

    } catch (error) {
        const firebaseError = error as FirebaseError;
        console.error(`Firebase Email Auth Error:`, firebaseError.code, firebaseError.message);
        
        const errorInfo = emailErrorMessages[firebaseError.code] || {
            title: "Erro Inesperado na Autenticação",
            description: "Ocorreu um problema não catalogado. Verifique o console para mais detalhes."
        };
        
        toast({
            variant: 'destructive',
            title: `Falha na Autenticação: ${errorInfo.title}`,
            description: (
              <div>
                <p>{errorInfo.description}</p>
                <p className="font-mono text-xs mt-2 opacity-80">CMD_LOG: {firebaseError.code}</p>
              </div>
            ),
            duration: 9000,
        });
    } finally {
        setIsLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) return;
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        await setDoc(userRef, {
            id: user.uid,
            email: user.email,
            name: user.displayName,
            photoURL: user.photoURL
        }, { merge: true });
      }

      toast({ title: 'Login com Google bem-sucedido!', description: 'Você será redirecionado em breve.' });
      
      await handleAuthSuccess(result.user);

    } catch (error) {
        const firebaseError = error as FirebaseError;
        console.error(`Firebase Google Auth Error:`, firebaseError.code, firebaseError.message);
        
        if (firebaseError.code === 'auth/popup-closed-by-user' || firebaseError.code === 'auth/cancelled-popup-request') {
          setGoogleLoading(false);
          return;
        }

        const errorMessage = googleErrorMessages[firebaseError.code] || 'Ocorreu um erro durante o login com o Google. Tente novamente.';
        toast({
            variant: 'destructive',
            title: 'Falha no Login com Google',
            description: (
                 <div>
                    <p>{errorMessage}</p>
                    <p className="font-mono text-xs mt-2 opacity-80">CMD_LOG: {firebaseError.code}</p>
                 </div>
            ),
            duration: 9000,
        });
    } finally {
        setGoogleLoading(false);
    }
  };

  // Se a página carregar, o middleware já garantiu que não há usuário logado.
  // Apenas mostramos o loader enquanto o cliente Firebase inicializa.
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Acesse sua Conta</CardTitle>
          <CardDescription>Entre ou crie uma conta para salvar e gerenciar suas páginas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
                {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.5 173.5 58.5l-65.2 64.2c-28.5-22.5-64.6-36.5-108.3-36.5-84.3 0-152.3 67-152.3 150s68 150 152.3 150c95.7 0 132.3-72.3 137-108.3H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>}
                Continuar com Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
              </div>
            </div>

            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Sua senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-2 gap-4">
                    <Button onClick={form.handleSubmit((values) => handleEmailAuth(values, false))} disabled={isLoading || isGoogleLoading} className='w-full'>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Entrar
                    </Button>
                    <Button onClick={form.handleSubmit((values) => handleEmailAuth(values, true))} variant="secondary" disabled={isLoading || isGoogleLoading} className='w-full'>
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Cadastrar
                    </Button>
                </div>
              </form>
            </Form>
          </div>
            <p className="px-8 text-center text-sm text-muted-foreground mt-6">
                Ao continuar, você concorda com nossos{" "}
                <Link href="/termos" className="underline underline-offset-4 hover:text-primary">
                    Termos de Serviço
                </Link>{" "}
                e{" "}
                <Link href="/privacidade" className="underline underline-offset-4 hover:text-primary">
                    Política de Privacidade
                </Link>
                .
            </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
