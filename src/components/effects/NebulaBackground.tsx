'use client';

export default function NebulaBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#05010a] z-0">
      {/* Mancha Roxa Principal */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] rounded-full opacity-30 blur-[120px] animate-[nebula-scale-1_20s_ease-in-out_infinite]"
        style={{ background: 'radial-gradient(circle, #5c1d8f 0%, transparent 70%)' }}
      />
      {/* Mancha Rosa Vibrante */}
      <div
        className="absolute -bottom-[10%] -right-[10%] w-[70%] h-[70%] rounded-full opacity-20 blur-[100px] animate-[nebula-scale-2_15s_ease-in-out_infinite]"
        style={{ background: 'radial-gradient(circle, #D14D72 0%, transparent 70%)' }}
      />
      {/* Brilho Central Azulado/Violeta */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full blur-[150px] animate-[nebula-opacity_10s_ease-in-out_infinite]"
        style={{ background: 'radial-gradient(circle, #A855F7 0%, transparent 60%)' }}
      />
      {/* Camada de Ruído (Efeito de poeira estelar) */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none" 
           style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/stardust.png')` }}></div>
    </div>
  );
}
