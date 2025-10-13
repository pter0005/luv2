import CreatePageForm from "./CreatePageForm";

export default function DoItYourselfPage() {
  return (
    <div className="relative min-h-screen">
      <div className="container py-12 md:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 font-headline">
              Dê vida à sua <span className="gradient-text">Declaração</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Preencha os campos abaixo e veja a mágica acontecer.
            </p>
          </div>
          <CreatePageForm />
        </div>
      </div>
    </div>
  );
}
