'use client';
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

const translations = {
  pt: {
    // Nav (existing)
    'nav.recursos': 'Recursos',
    'nav.planos': 'Planos',
    'nav.avaliacoes': 'Avaliações',
    'nav.comoFunciona': 'Como Funciona',
    'user.myAccount': 'Minha Conta',
    'user.myPages': 'Minhas Páginas',
    'user.signOut': 'Sair',
    'lang.change': 'Mudar idioma',
    'lang.pt': 'Português (BR)',
    'lang.en': 'English',
    'lang.es': 'Español',
    'profile.greeting': 'Olá',

    // Home Page
    'home.hero.title': 'Declare seu amor',
    'home.hero.subtitle.part1': 'para alguém especial!',
    'home.hero.subtitle.part2': 'de forma única!',
    'home.hero.subtitle.part3': 'para quem merece!',
    'home.hero.description': 'Transforme seus sentimentos em uma obra de arte digital. Uma experiência exclusiva, criada para celebrar momentos que merecem ser eternos.',
    'home.hero.cta': 'Criar minha página',

    'home.howitworks.title': 'Crie um presente inesquecível em 4 passos simples',
    'home.howitworks.description': 'Nossa plataforma torna fácil criar uma experiência digital e personalizada que vai emocionar quem você ama.',
    'home.howitworks.step1.title': 'Conte a sua história de amor',
    'home.howitworks.step1.description': 'Preencha os dados do seu relacionamento e escolha elementos únicos para surpreender sua pessoa amada.',
    'home.howitworks.step2.title': 'Personalize cada detalhe',
    'home.howitworks.step2.description': 'Escolha suas fotos, adicione a música de vocês e escreva uma mensagem especial. É aqui que a mágica acontece!',
    'home.howitworks.step3.title': 'Receba seu QR Code',
    'home.howitworks.step3.description': 'Após a finalização, você receberá o QR Code de acesso ao presente personalizado em poucos instantes.',
    'home.howitworks.step4.title': 'Surpreenda com amor',
    'home.howitworks.step4.description': 'Compartilhe o QR Code e veja a emoção ao descobrir um presente que fala diretamente ao coração.',
    
    'home.features.title': 'Crie uma página de amor',
    'home.features.subtitle': 'Totalmente Personalizada',
    'home.features.description': 'Use o assistente passo a passo para montar cada detalhe.',
    
    'featuresCarousel.slide1.title': 'Linha do Tempo',
    'featuresCarousel.slide1.description': 'Reviva sua jornada com uma linha do tempo animada e elegante.',
    'featuresCarousel.slide2.title': 'Quebra-cabeça',
    'featuresCarousel.slide2.description': 'Comece com um jogo! A pessoa amada monta uma foto especial para revelar a surpresa.',
    'featuresCarousel.slide3.title': 'Contador de Tempo',
    'featuresCarousel.slide3.description': 'Mostre o tempo exato que vocês compartilham, desde anos até segundos.',
    'featuresCarousel.cta': 'Criar meu presente',

    'home.video_demo.title': 'Veja a Magia Acontecer',
    'home.video_demo.subtitle': 'Uma Experiência Única',
    'home.video_demo.description': 'Assista a um exemplo de como sua declaração pode se transformar em um presente inesquecível.',

    'home.testimonials.title': 'Histórias que Inspiram',
    'home.testimonials.description': 'Veja o que casais apaixonados estão dizendo sobre Amore Pages.',
    'home.testimonials.t1.name': 'Juliana S.',
    'home.testimonials.t1.text': 'Criei uma página para nosso aniversário de 5 anos e meu marido chorou de emoção. Foi o presente mais lindo que já dei!',
    'home.testimonials.t2.name': 'Ricardo M.',
    'home.testimonials.t2.text': 'A ferramenta de IA me ajudou a encontrar as palavras certas. Simplesmente incrível e muito fácil de usar.',
    'home.testimonials.t3.name': 'Fernanda L.',
    'home.testimonials.t3.text': 'Fiz uma surpresa e enviei o link para ele no trabalho. A reação foi a melhor possível! Recomendo a todos os românticos.',
    
    'home.plans.title': 'Escolha seu plano para testar',
    'home.plans.description': 'Temos a opção ideal para eternizar seu momento, com a flexibilidade que você precisa.',
    'home.plans.recommended': 'RECOMENDADO',
    'home.plans.avancado.title': 'Plano Avançado',
    'home.plans.avancado.description': 'Todos os recursos liberados.',
    'home.plans.feature.gallery_advanced': 'Galeria de fotos (até 6)',
    'home.plans.feature.music': 'Música de fundo',
    'home.plans.feature.puzzle': 'Quebra-cabeça Interativo',
    'home.plans.feature.timeline_advanced': 'Linha do Tempo 3D (até 20 momentos)',
    'home.plans.avancado.cta': 'Testar Plano Avançado',
    'home.plans.basico.title': 'Plano Básico',
    'home.plans.basico.description': 'Uma opção mais simples para começar.',
    'home.plans.feature.gallery_basic': 'Galeria de fotos (até 2)',
    'home.plans.feature.timeline_basic': 'Linha do Tempo 3D (até 5 momentos)',
    'home.plans.basico.cta': 'Testar Plano Básico',

    // Footer
    'footer.copyright': '© {year} Amore Pages. Todos os direitos reservados.',
    'footer.terms': 'Termos de uso',
    'footer.privacy': 'Política de privacidade',
  },
  en: {
    // Nav (existing)
    'nav.recursos': 'Features',
    'nav.planos': 'Plans',
    'nav.avaliacoes': 'Reviews',
    'nav.comoFunciona': 'How it Works',
    'user.myAccount': 'My Account',
    'user.myPages': 'My Pages',
    'user.signOut': 'Sign Out',
    'lang.change': 'Change language',
    'lang.pt': 'Português (BR)',
    'lang.en': 'English',
    'lang.es': 'Español',
    'profile.greeting': 'Hello',

    // Home Page
    'home.hero.title': 'Declare your love',
    'home.hero.subtitle.part1': 'for someone special!',
    'home.hero.subtitle.part2': 'in a unique way!',
    'home.hero.subtitle.part3': 'for who deserves it!',
    'home.hero.description': 'Transform your feelings into a digital work of art. An exclusive experience, created to celebrate moments that deserve to be eternal.',
    'home.hero.cta': 'Create my page',

    'home.howitworks.title': 'Create an unforgettable gift in 4 simple steps',
    'home.howitworks.description': 'Our platform makes it easy to create a digital and personalized experience that will thrill the one you love.',
    'home.howitworks.step1.title': 'Tell your love story',
    'home.howitworks.step1.description': 'Fill in your relationship details and choose unique elements to surprise your loved one.',
    'home.howitworks.step2.title': 'Customize every detail',
    'home.howitworks.step2.description': 'Choose your photos, add your song, and write a special message. This is where the magic happens!',
    'home.howitworks.step3.title': 'Receive your QR Code',
    'home.howitworks.step3.description': 'After finishing, you will receive the QR Code to access the personalized gift in a few moments.',
    'home.howitworks.step4.title': 'Surprise with love',
    'home.howitworks.step4.description': 'Share the QR Code and see the emotion of discovering a gift that speaks directly to the heart.',

    'home.features.title': 'Create a love page',
    'home.features.subtitle': 'Fully Personalized',
    'home.features.description': 'Use the step-by-step wizard to assemble every detail.',
    
    'featuresCarousel.slide1.title': 'Timeline',
    'featuresCarousel.slide1.description': 'Relive your journey with an animated and elegant timeline.',
    'featuresCarousel.slide2.title': 'Puzzle',
    'featuresCarousel.slide2.description': 'Start with a game! Your loved one assembles a special photo to reveal the surprise.',
    'featuresCarousel.slide3.title': 'Time Counter',
    'featuresCarousel.slide3.description': 'Show the exact time you share, from years to seconds.',
    'featuresCarousel.cta': 'Create my gift',

    'home.video_demo.title': 'See the Magic Happen',
    'home.video_demo.subtitle': 'A Unique Experience',
    'home.video_demo.description': 'Watch an example of how your declaration can turn into an unforgettable gift.',
    
    'home.testimonials.title': 'Inspiring Stories',
    'home.testimonials.description': 'See what loving couples are saying about Amore Pages.',
    'home.testimonials.t1.name': 'Juliana S.',
    'home.testimonials.t1.text': 'I created a page for our 5th anniversary and my husband cried with emotion. It was the most beautiful gift I have ever given!',
    'home.testimonials.t2.name': 'Ricardo M.',
    'home.testimonials.t2.text': 'The AI tool helped me find the right words. Simply incredible and very easy to use.',
    'home.testimonials.t3.name': 'Fernanda L.',
    'home.testimonials.t3.text': 'I made a surprise and sent the link to him at work. The reaction was the best possible! I recommend it to all romantics.',

    'home.plans.title': 'Choose your plan to test',
    'home.plans.description': 'We have the ideal option to eternalize your moment, with the flexibility you need.',
    'home.plans.recommended': 'RECOMMENDED',
    'home.plans.avancado.title': 'Advanced Plan',
    'home.plans.avancado.description': 'All features unlocked.',
    'home.plans.feature.gallery_advanced': 'Photo gallery (up to 6)',
    'home.plans.feature.music': 'Background music',
    'home.plans.feature.puzzle': 'Interactive Puzzle',
    'home.plans.feature.timeline_advanced': '3D Timeline (up to 20 moments)',
    'home.plans.avancado.cta': 'Test Advanced Plan',
    'home.plans.basico.title': 'Basic Plan',
    'home.plans.basico.description': 'A simpler option to get started.',
    'home.plans.feature.gallery_basic': 'Photo gallery (up to 2)',
    'home.plans.feature.timeline_basic': '3D Timeline (up to 5 moments)',
    'home.plans.basico.cta': 'Test Basic Plan',

    // Footer
    'footer.copyright': '© {year} Amore Pages. All rights reserved.',
    'footer.terms': 'Terms of use',
    'footer.privacy': 'Privacy policy',
  },
  es: {
    // Nav (existing)
    'nav.recursos': 'Recursos',
    'nav.planos': 'Planes',
    'nav.avaliacoes': 'Reseñas',
    'nav.comoFunciona': 'Cómo funciona',
    'user.myAccount': 'Mi Cuenta',
    'user.myPages': 'Mis Páginas',
    'user.signOut': 'Cerrar Sesión',
    'lang.change': 'Cambiar idioma',
    'lang.pt': 'Português (BR)',
    'lang.en': 'English',
    'lang.es': 'Español',
    'profile.greeting': 'Hola',
    
    // Home Page
    'home.hero.title': 'Declara tu amor',
    'home.hero.subtitle.part1': '¡para alguien especial!',
    'home.hero.subtitle.part2': '¡de una manera única!',
    'home.hero.subtitle.part3': '¡para quien se lo merece!',
    'home.hero.description': 'Transforma tus sentimientos en una obra de arte digital. Una experiencia exclusiva, creada para celebrar momentos que merecen ser eternos.',
    'home.hero.cta': 'Crear mi página',
    
    'home.howitworks.title': 'Crea un regalo inolvidable en 4 sencillos pasos',
    'home.howitworks.description': 'Nuestra plataforma facilita la creación de una experiencia digital y personalizada que emocionará a quien amas.',
    'home.howitworks.step1.title': 'Cuenta tu historia de amor',
    'home.howitworks.step1.description': 'Completa los datos de tu relación y elige elementos únicos para sorprender a tu ser querido.',
    'home.howitworks.step2.title': 'Personaliza cada detalle',
    'home.howitworks.step2.description': 'Elige tus fotos, añade vuestra canción y escribe un mensaje especial. ¡Aquí es donde ocurre la magia!',
    'home.howitworks.step3.title': 'Recibe tu Código QR',
    'home.howitworks.step3.description': 'Al finalizar, recibirás el Código QR para acceder al regalo personalizado en pocos instantes.',
    'home.howitworks.step4.title': 'Sorprende con amor',
    'home.howitworks.step4.description': 'Comparte el Código QR y observa la emoción al descubrir un regalo que habla directamente al corazón.',
    
    'home.features.title': 'Crea una página de amor',
    'home.features.subtitle': 'Totalmente Personalizada',
    'home.features.description': 'Usa el asistente paso a paso para montar cada detalle.',

    'featuresCarousel.slide1.title': 'Línea de Tiempo',
    'featuresCarousel.slide1.description': 'Revive vuestro viaje con una línea de tiempo animada y elegante.',
    'featuresCarousel.slide2.title': 'Rompecabezas',
    'featuresCarousel.slide2.description': '¡Empieza con un juego! Tu ser querido arma una foto especial para revelar la sorpresa.',
    'featuresCarousel.slide3.title': 'Contador de Tiempo',
    'featuresCarousel.slide3.description': 'Muestra el tiempo exacto que comparten, desde años hasta segundos.',
    'featuresCarousel.cta': 'Crear mi regalo',

    'home.video_demo.title': 'Mira la Magia Suceder',
    'home.video_demo.subtitle': 'Una Experiencia Única',
    'home.video_demo.description': 'Mira un ejemplo de cómo tu declaración puede convertirse en un regalo inolvidable.',
    
    'home.testimonials.title': 'Historias que Inspiran',
    'home.testimonials.description': 'Vea lo que dicen las parejas enamoradas sobre Amore Pages.',
    'home.testimonials.t1.name': 'Juliana S.',
    'home.testimonials.t1.text': 'Creé una página para nuestro 5º aniversario y mi marido lloró de emoción. ¡Fue el regalo más bonito que he dado!',
    'home.testimonials.t2.name': 'Ricardo M.',
    'home.testimonials.t2.text': 'La herramienta de IA me ayudó a encontrar las palabras adecuadas. Simplemente increíble y muy fácil de usar.',
    'home.testimonials.t3.name': 'Fernanda L.',
    'home.testimonials.t3.text': 'Le di una sorpresa y le envié el enlace al trabajo. ¡La reacción fue la mejor posible! Se lo recomiendo a todos los románticos.',
    
    'home.plans.title': 'Elige tu plan para probar',
    'home.plans.description': 'Tenemos la opción ideal para eternizar tu momento, con la flexibilidad que necesitas.',
    'home.plans.recommended': 'RECOMENDADO',
    'home.plans.avancado.title': 'Plan Avanzado',
    'home.plans.avancado.description': 'Todas las funciones desbloqueadas.',
    'home.plans.feature.gallery_advanced': 'Galería de fotos (hasta 6)',
    'home.plans.feature.music': 'Música de fondo',
    'home.plans.feature.puzzle': 'Rompecabezas Interactivo',
    'home.plans.feature.timeline_advanced': 'Línea de Tiempo 3D (hasta 20 momentos)',
    'home.plans.avancado.cta': 'Probar Plan Avanzado',
    'home.plans.basico.title': 'Plan Básico',
    'home.plans.basico.description': 'Una opción más sencilla para empezar.',
    'home.plans.feature.gallery_basic': 'Galería de fotos (hasta 2)',
    'home.plans.feature.timeline_basic': 'Línea de Tiempo 3D (hasta 5 momentos)',
    'home.plans.basico.cta': 'Probar Plan Básico',

    // Footer
    'footer.copyright': '© {year} Amore Pages. Todos los derechos reservados.',
    'footer.terms': 'Términos de uso',
    'footer.privacy': 'Política de privacidad',
  },
};

type Locale = keyof typeof translations;
type TranslationKey = keyof typeof translations.pt;

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('pt');

  const t = useCallback((key: TranslationKey, vars?: Record<string, string | number>) => {
    let translation = translations[locale][key] || key;
    if (vars) {
      Object.keys(vars).forEach(varKey => {
        const regex = new RegExp(`\\{${varKey}\\}`, 'g');
        translation = translation.replace(regex, String(vars[varKey]));
      });
    }
    return translation;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
