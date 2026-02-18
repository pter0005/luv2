'use client';

import React, { useEffect, useState } from 'react';

export default function MysticFlowers() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Simula o window.onload para iniciar a animação
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    // Wrapper para isolar o CSS do resto do seu site
    <div className={`flower-wrapper ${!loaded ? 'not-loaded' : ''}`}>
      <style jsx>{`
        /* --- CONFIGURAÇÕES DO CONTAINER (Substitui o body) --- */
        .flower-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          background-color: #000; /* Fundo preto/roxo */
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          perspective: 1000px;
          --flower-purple-dark: #4a0072;
          --flower-purple-mid: #7c15aa;
          --flower-purple-light: #e0aaff;
          --leaf-purple: #3c096c;
        }

        .not-loaded * {
          animation-play-state: paused !important;
        }

        /* --- FUNDO NOTURNO ROXO --- */
        .night {
          position: absolute;
          left: 50%;
          top: 0;
          transform: translateX(-50%);
          width: 100%;
          height: 100%;
          filter: blur(0.1vmin);
          background-image: 
            radial-gradient(ellipse at top, transparent 0%, #000), 
            radial-gradient(ellipse at bottom, #000, rgba(74, 0, 114, 0.2)), 
            repeating-linear-gradient(220deg, black 0px, black 19px, transparent 19px, transparent 22px), 
            repeating-linear-gradient(189deg, black 0px, black 19px, transparent 19px, transparent 22px), 
            repeating-linear-gradient(148deg, black 0px, black 19px, transparent 19px, transparent 22px), 
            linear-gradient(90deg, #240046, #000);
        }

        .flowers {
          position: relative;
          transform: scale(0.8); /* Ajuste de escala para caber no card */
          bottom: 5%;
        }

        .flower {
          position: absolute;
          bottom: 10vmin;
          transform-origin: bottom center;
          z-index: 10;
          --fl-speed: 0.8s;
        }

        /* --- PÉTALAS (Aqui mudamos a cor para ROXO) --- */
        .flower__leaf {
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 8vmin;
          height: 11vmin;
          border-radius: 51% 49% 47% 53%/44% 45% 55% 69%;
          background-color: var(--flower-purple-light);
          background-image: linear-gradient(to top, var(--flower-purple-mid), var(--flower-purple-light));
          transform-origin: bottom center;
          opacity: 0.9;
          box-shadow: inset 0 0 2vmin rgba(255, 255, 255, 0.5);
        }

        .flower__leaf--1 { transform: translate(-10%, 1%) rotateY(40deg) rotateX(-50deg); }
        .flower__leaf--2 { transform: translate(-50%, -4%) rotateX(40deg); }
        .flower__leaf--3 { transform: translate(-90%, 0%) rotateY(45deg) rotateX(50deg); }
        
        .flower__leaf--4 {
          width: 8vmin;
          height: 8vmin;
          transform-origin: bottom left;
          border-radius: 4vmin 10vmin 4vmin 4vmin;
          transform: translate(0%, 18%) rotateX(70deg) rotate(-43deg);
          background-image: linear-gradient(to top, var(--leaf-purple), var(--flower-purple-light));
          z-index: 1;
          opacity: 0.8;
        }

        .flower__white-circle {
          position: absolute; left: -3.5vmin; top: -3vmin;
          width: 9vmin; height: 4vmin; border-radius: 50%;
          background-color: #fff;
        }
        .flower__white-circle::after {
          content: ""; position: absolute; left: 50%; top: 45%;
          transform: translate(-50%, -50%); width: 60%; height: 60%;
          border-radius: inherit;
          background-image: repeating-linear-gradient(135deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 12px), 
          linear-gradient(90deg, #ffeb12, #ffce00);
        }

        /* --- CAULES (Roxos escuros) --- */
        .flower__line {
          height: 55vmin; width: 1.5vmin;
          background-image: linear-gradient(to left, rgba(0,0,0,0.2), transparent, rgba(255,255,255,0.2)), 
                            linear-gradient(to top, transparent 10%, #240046, #7b2cbf);
          box-shadow: inset 0 0 2px rgba(0,0,0,0.5);
          animation: grow-flower-tree 4s backwards;
        }

        .flower__line__leaf {
          --w: 7vmin; --h: calc(var(--w) + 2vmin);
          position: absolute; top: 20%; left: 90%;
          width: var(--w); height: var(--h);
          border-top-right-radius: var(--h); border-bottom-left-radius: var(--h);
          background-image: linear-gradient(to top, rgba(36, 0, 70, 0.4), #7b2cbf);
        }

        /* Ajustes de posição das folhas do caule */
        .flower__line__leaf--1 { transform: rotate(70deg) rotateY(30deg); animation: blooming-leaf-right 0.8s 1.6s backwards; }
        .flower__line__leaf--2 { top: 45%; transform: rotate(70deg) rotateY(30deg); animation: blooming-leaf-right 0.8s 1.4s backwards;}
        .flower__line__leaf--3, .flower__line__leaf--4, .flower__line__leaf--6 {
          border-top-right-radius: 0; border-bottom-left-radius: 0;
          border-top-left-radius: var(--h); border-bottom-right-radius: var(--h);
          left: -460%; top: 12%; transform: rotate(-70deg) rotateY(30deg);
        }
         .flower__line__leaf--3 { animation: blooming-leaf-left 0.8s 1.2s backwards;}
        .flower__line__leaf--4 { top: 40%; animation: blooming-leaf-left 0.8s 1s backwards; }
        .flower__line__leaf--5 { top: 0; transform-origin: left; transform: rotate(70deg) rotateY(30deg) scale(0.6); animation: blooming-leaf-right 0.8s 1.8s backwards;}
        .flower__line__leaf--6 { top: -2%; left: -450%; transform-origin: right; transform: rotate(-70deg) rotateY(30deg) scale(0.6); animation: blooming-leaf-left 0.8s 2s backwards;}

        /* --- LUZES --- */
        .flower__light {
          position: absolute; bottom: 0vmin; width: 1vmin; height: 1vmin;
          background-color: #fffb00; border-radius: 50%;
          filter: blur(0.2vmin); animation: light-ans 4s linear infinite backwards;
        }
        .flower__light:nth-child(odd) { background-color: #d0a1ff; }

        .flower__light--1 { left: -2vmin; animation-delay: 1s; }
        .flower__light--2 { left: 3vmin; animation-delay: 0.5s; }
        .flower__light--3 { left: -6vmin; animation-delay: 0.3s; }
        .flower__light--4 { left: 6vmin; animation-delay: 0.9s; }
        .flower__light--5 { left: -1vmin; animation-delay: 1.5s; }
        .flower__light--6 { left: -4vmin; animation-delay: 3s; }
        .flower__light--7 { left: 3vmin; animation-delay: 2s; }
        .flower__light--8 { left: -6vmin; animation-delay: 3.5s; }

        /* --- ANIMAÇÕES (Copiadas exatamente do CSS original) --- */
        .flower--1 { animation: moving-flower-1 4s linear infinite; }
        .flower--1 .flower__line { height: 70vmin; animation-delay: 0.3s; }
        .flower--2 { left: 50%; transform: rotate(20deg); animation: moving-flower-2 4s linear infinite; }
        .flower--2 .flower__line { height: 60vmin; animation-delay: 0.6s; }
        .flower--3 { left: 50%; transform: rotate(-15deg); animation: moving-flower-3 4s linear infinite; }
         .flower--3 .flower__line { animation-delay: 0.9s; }


        .flower__leafs { position: relative; animation: blooming-flower 2s backwards; }
        .flower__leafs--1 { animation-delay: 1.1s; }
        .flower__leafs--2 { animation-delay: 1.4s; }
        .flower__leafs--3 { animation-delay: 1.7s; }
        .flower__leafs::after {
          content: ""; position: absolute; left: 0; top: 0;
          transform: translate(-50%, -100%); width: 8vmin; height: 8vmin;
          background-color: rgba(160, 32, 240, 0.4); filter: blur(10vmin);
        }

        /* --- GRAMA --- */
        .flower__grass {
          --c: #3c096c; --line-w: 1.5vmin;
          position: absolute; bottom: 12vmin; left: -7vmin;
          display: flex; flex-direction: column; align-items: flex-end;
          z-index: 20; transform-origin: bottom center;
          transform: rotate(-48deg) rotateY(40deg);
        }
        .flower__grass--1 { animation: moving-grass 2s linear infinite; }
        .flower__grass--2 { left: 2vmin; bottom: 10vmin; transform: scale(0.5) rotate(75deg) rotateX(10deg) rotateY(-200deg); opacity: 0.8; z-index: 0; animation: moving-grass--2 1.5s linear infinite; }
        .flower__grass--top { width: 7vmin; height: 10vmin; border-top-right-radius: 100%; border-right: var(--line-w) solid var(--c); transform: rotate(-2deg); }
        .flower__grass--bottom { margin-top: -2px; width: var(--line-w); height: 25vmin; background-image: linear-gradient(to top, transparent, var(--c)); }
        .flower__grass__leaf {
          --size: 10vmin; position: absolute; width: calc(var(--size) * 2.1); height: var(--size);
          border-top-left-radius: var(--size); border-top-right-radius: var(--size);
          background-image: linear-gradient(to top, transparent, transparent 30%, var(--c)); z-index: 100;
        }

        /* Keyframes essenciais */
        @keyframes moving-flower-1 { 0%, 100% { transform: rotate(2deg); } 50% { transform: rotate(-2deg); } }
        @keyframes moving-flower-2 { 0%, 100% { transform: rotate(18deg); } 50% { transform: rotate(14deg); } }
        @keyframes moving-flower-3 { 0%, 100% { transform: rotate(-18deg); } 50% { transform: rotate(-20deg) rotateY(-10deg); } }
        @keyframes blooming-flower { 0% { transform: scale(0); } }
        @keyframes grow-flower-tree { 0% { height: 0; border-radius: 1vmin; } }
        @keyframes light-ans { 0% { opacity: 0; transform: translateY(0vmin); } 25% { opacity: 1; transform: translateY(-5vmin) translateX(-2vmin); } 50% { opacity: 1; transform: translateY(-15vmin) translateX(2vmin); filter: blur(0.2vmin); } 100% { transform: translateY(-30vmin); opacity: 0; filter: blur(1vmin); } }
        @keyframes moving-grass { 0%, 100% { transform: rotate(-48deg) rotateY(40deg); } 50% { transform: rotate(-50deg) rotateY(40deg); } }
        @keyframes moving-grass--2 { 0%, 100% { transform: scale(0.5) rotate(75deg) rotateX(10deg) rotateY(-200deg); } 50% { transform: scale(0.5) rotate(79deg) rotateX(10deg) rotateY(-200deg); } }
        
        .growing-grass { animation: growing-grass-ans 1s 2s backwards; }
        @keyframes growing-grass-ans { 0% { transform: scale(0); } }
        @keyframes blooming-leaf-right { 0% { transform-origin: left; transform: rotate(70deg) rotateY(30deg) scale(0); } }
        @keyframes blooming-leaf-left { 0% { transform-origin: right; transform: rotate(-70deg) rotateY(30deg) scale(0); } }
        
        /* Folhas extras (Grama longa) */
        .long-g { position: absolute; bottom: 25vmin; left: -42vmin; transform-origin: bottom left; }
        .long-g .leaf {
            --w: 15vmin; --h: 40vmin; --c: #240046;
            position: absolute; bottom: 0; width: var(--w); height: var(--h);
            border-top-left-radius: 100%; border-left: 2vmin solid var(--c);
            -webkit-mask-image: linear-gradient(to top, transparent 20%, #000);
            transform-origin: bottom center;
        }
        .grow-ans { animation: grow-ans 2s var(--d) backwards; }
        @keyframes grow-ans { 0% { transform: scale(0); opacity: 0; } }
        @keyframes leaf-ans-1 { 0%, 100% { transform: rotate(-5deg) scale(1); } 50% { transform: rotate(5deg) scale(1.1); } }
      `}</style>

      <div className="night"></div>
      
      <div className="flowers">
        {/* FLOR 1 */}
        <div className="flower flower--1">
          <div className="flower__leafs flower__leafs--1">
            <div className="flower__leaf flower__leaf--1"></div>
            <div className="flower__leaf flower__leaf--2"></div>
            <div className="flower__leaf flower__leaf--3"></div>
            <div className="flower__leaf flower__leaf--4"></div>
            <div className="flower__white-circle"></div>
            {[...Array(8)].map((_, i) => <div key={i} className={`flower__light flower__light--${i + 1}`}></div>)}
          </div>
          <div className="flower__line">
            {[...Array(6)].map((_, i) => <div key={i} className={`flower__line__leaf flower__line__leaf--${i + 1}`}></div>)}
          </div>
        </div>

        {/* FLOR 2 */}
        <div className="flower flower--2">
          <div className="flower__leafs flower__leafs--2">
            <div className="flower__leaf flower__leaf--1"></div>
            <div className="flower__leaf flower__leaf--2"></div>
            <div className="flower__leaf flower__leaf--3"></div>
            <div className="flower__leaf flower__leaf--4"></div>
            <div className="flower__white-circle"></div>
            {[...Array(8)].map((_, i) => <div key={i} className={`flower__light flower__light--${i + 1}`}></div>)}
          </div>
          <div className="flower__line">
            {[...Array(4)].map((_, i) => <div key={i} className={`flower__line__leaf flower__line__leaf--${i + 1}`}></div>)}
          </div>
        </div>

        {/* FLOR 3 */}
        <div className="flower flower--3">
          <div className="flower__leafs flower__leafs--3">
            <div className="flower__leaf flower__leaf--1"></div>
            <div className="flower__leaf flower__leaf--2"></div>
            <div className="flower__leaf flower__leaf--3"></div>
            <div className="flower__leaf flower__leaf--4"></div>
            <div className="flower__white-circle"></div>
            {[...Array(8)].map((_, i) => <div key={i} className={`flower__light flower__light--${i + 1}`}></div>)}
          </div>
          <div className="flower__line">
            {[...Array(4)].map((_, i) => <div key={i} className={`flower__line__leaf flower__line__leaf--${i + 1}`}></div>)}
          </div>
        </div>

        {/* GRAMAS */}
        <div className="growing-grass">
          <div className="flower__grass flower__grass--1">
            <div className="flower__grass--top"></div>
            <div className="flower__grass--bottom"></div>
            {[...Array(8)].map((_, i) => <div key={i} className={`flower__grass__leaf flower__grass__leaf--${i + 1}`} style={{
                top: `${-6 + (i*5)}%`, 
                left: i % 2 === 0 ? '30%' : '-110%',
                transform: `rotate(${i % 2 === 0 ? '-20deg' : '10deg'})`
            }}></div>)}
          </div>
        </div>

        <div className="growing-grass">
          <div className="flower__grass flower__grass--2">
            <div className="flower__grass--top"></div>
            <div className="flower__grass--bottom"></div>
            {[...Array(8)].map((_, i) => <div key={i} className={`flower__grass__leaf flower__grass__leaf--${i + 1}`} style={{
                top: `${-6 + (i*5)}%`, 
                left: i % 2 === 0 ? '30%' : '-110%',
                transform: `rotate(${i % 2 === 0 ? '-20deg' : '10deg'})`
            }}></div>)}
          </div>
        </div>

        {/* GRAMA LONGA (FUNDO) */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
             <div key={i} className={`long-g long-g--${i}`} style={{ left: `${-42 + (i * 15)}vmin` }}>
                <div className="grow-ans" style={{'--d': `${3 + i * 0.2}s`} as React.CSSProperties}><div className="leaf leaf--0" style={{animation: `leaf-ans-1 ${4 + i*0.1}s linear infinite`}}></div></div>
            </div>
        ))}

      </div>
    </div>
  );
}
