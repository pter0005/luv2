import CreatePageForm from "./CreatePageForm";
import FallingHearts from "@/components/effects/FallingHearts";

export default function DoItYourselfPage() {
  return (
    <div className="relative min-h-screen">
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="mystic-fog-1"></div>
        <div className="mystic-fog-2"></div>
      </div>
       <FallingHearts />
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
