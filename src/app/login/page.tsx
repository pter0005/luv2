
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
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';
import Link from 'next/link';
import { createSession } from '@/app/auth-actions';
import { useTranslation } from '@/lib/i18n';
import DevAuthDomainHelper from '@/components/layout/DevAuthDomainHelper';

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t } = useTranslation();
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
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        const user = userCredential.user;
        const userRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          await setDoc(userRef, {
            id: user.uid,
            email: user.email,
            name: user.email?.split('@')[0] || 'Usuário',
            createdAt: serverTimestamp()
          }, { merge: true });
        }

        toast({ title: t('login.toast.success.register'), description: t('login.toast.redirect') });
        await handleAuthSuccess(user);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
        toast({ title: t('login.toast.success.login'), description: t('login.toast.redirect') });
        await handleAuthSuccess(userCredential.user);
      }
    } catch (error) {
        const firebaseError = error as FirebaseError;
        console.error(`Firebase Email Auth Error:`, firebaseError.code, firebaseError.message);
        
        const errorKey = `login.auth.${firebaseError.code.replace('auth/', '')}` as any;
        const errorMessage = t(errorKey) || t('login.auth.generic');
        
        toast({
            variant: 'destructive',
            title: t('login.toast.fail'),
            description: (
              <div>
                <p>{errorMessage}</p>
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
            photoURL: user.photoURL,
            createdAt: serverTimestamp()
        }, { merge: true });
      }

      toast({ title: t('login.toast.success.login'), description: t('login.toast.redirect') });
      
      await handleAuthSuccess(result.user);

    } catch (error) {
        const firebaseError = error as FirebaseError;
        console.error(`Firebase Google Auth Error:`, firebaseError.code, firebaseError.message);
        
        if (firebaseError.code === 'auth/popup-closed-by-user' || firebaseError.code === 'auth/cancelled-popup-request') {
          setGoogleLoading(false);
          return;
        }

        const errorKey = `login.auth.google.${firebaseError.code.replace('auth/', '')}` as any;
        const errorMessage = t(errorKey) || t('login.auth.google.generic');
        
        toast({
            variant: 'destructive',
            title: t('login.toast.google.fail'),
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

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">{t('login.loading')}</p>
      </div>
    );
  }

  return (
    <div className="container flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('login.title')}</CardTitle>
          <CardDescription>{t('login.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
                {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.5 173.5 58.5l-65.2 64.2c-28.5-22.5-64.6-36.5-108.3-36.5-84.3 0-152.3 67-152.3 150s68 150 152.3 150c95.7 0 132.3-72.3 137-108.3H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>}
                {t('login.google')}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{t('login.separator')}</span>
              </div>
            </div>

            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login.email')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('login.email.placeholder')} {...field} />
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
                      <FormLabel>{t('login.password')}</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder={t('login.password.placeholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-2 gap-4">
                    <Button onClick={form.handleSubmit((values) => handleEmailAuth(values, false))} disabled={isLoading || isGoogleLoading} className='w-full'>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('login.login')}
                    </Button>
                    <Button onClick={form.handleSubmit((values) => handleEmailAuth(values, true))} variant="secondary" disabled={isLoading || isGoogleLoading} className='w-full'>
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('login.register')}
                    </Button>
                </div>
              </form>
            </Form>
          </div>
            <p className="px-8 text-center text-sm text-muted-foreground mt-6">
                {t('login.terms.prefix')}{" "}
                <Link href="/termos" className="underline underline-offset-4 hover:text-primary">
                    {t('login.terms.link')}
                </Link>{" "}
                {t('login.terms.separator')}{" "}
                <Link href="/privacidade" className="underline underline-offset-4 hover:text-primary">
                    {t('login.privacy.link')}
                </Link>
                .
            </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  return (
    <>
      <DevAuthDomainHelper />
      <Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-4 text-muted-foreground">{t('login.loading')}</p></div>}>
        <LoginContent />
      </Suspense>
    </>
  );
}
