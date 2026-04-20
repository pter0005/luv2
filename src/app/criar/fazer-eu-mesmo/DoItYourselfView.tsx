"use client";

import CreatePageWizard from './CreatePageWizard';

export default function DoItYourselfView() {
  return (
    <div className="flex-grow flex flex-col">
      <div className="container pt-8 md:pt-12 text-center">
        <h1 className="text-4xl font-semibold text-foreground">
          Crie uma página de amor <br />
          <span className="text-4xl md:text-6xl font-bold mt-1 leading-none gradient-text">
            Totalmente Personalizada
          </span>
        </h1>
        <p className="text-muted-foreground text-lg mt-4">
          Use o assistente passo a passo para montar cada detalhe.
        </p>
      </div>
      <div className="flex-grow">
        <CreatePageWizard />
      </div>
    </div>
  );
}
