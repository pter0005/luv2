'use client';

import React, { useEffect, useState } from 'react';

// This component is a React implementation of the user-provided HTML/CSS animation.
export default function MysticFlowers() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // This replicates the window.onload behavior to trigger the animation.
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 100); // A small delay to ensure rendering before animating.
    return () => clearTimeout(timer);
  }, []);

  return (
    // The main container. 'relative' is crucial to contain the 'absolute' children.
    <div className={`mystic-flowers-container ${!loaded ? 'not-loaded' : ''}`}>
      <style jsx global>{`
        /* --- Root Variables & Scoping --- */
        .mystic-flowers-container {
          --dark-color: #0b0118;
          --glow-color: #ff00ff;
          --flower-purple: #a020f0; 
          --flower-pink: #ff69b4;
          --stem-color: #4b0082;
          
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          background-color: var(--dark-color);
          overflow: hidden;
          perspective: 1000px;
        }

        .mystic-flowers-container.not-loaded * {
          animation-play-state: paused !important;
        }

        /* --- Background & Scenery --- */
        .night {
          position: absolute; /* Changed from fixed */
          left: 50%;
          top: 0;
          transform: translateX(-50%);
          width: 100%;
          height: 100%;
          filter: blur(0.1vmin);
          background-image: radial-gradient(
              ellipse at top,
              transparent 0%,
              var(--dark-color)
            ),
            radial-gradient(
              ellipse at bottom,
              var(--dark-color),
              rgba(138, 43, 226, 0.2)
            ),
            repeating-linear-gradient(
              220deg,
              rgb(0, 0, 0) 0px,
              rgb(0, 0, 0) 19px,
              transparent 19px,
              transparent 22px
            ),
            linear-gradient(90deg, #ff00ff, #7000ff);
          z-index: 0; /* Changed from -1 */
        }

        .flowers {
          position: absolute; /* Aligned within the container */
          bottom: 0;
          left: 50%;
          width: 100%;
          height: 100%;
          transform: translateX(-50%) scale(0.6); /* Adjusted scale for preview */
          display: flex;
          justify-content: center;
          align-items: flex-end;
        }

        .flower {
          position: absolute;
          bottom: 10vmin;
          transform-origin: bottom center;
          z-index: 10;
          --fl-speed: 0.8s;
        }

        /* --- Flower Animations --- */
        .flower--1 { animation: moving-flower-1 4s linear infinite; }
        .flower--2 { left: 50%; transform: rotate(20deg); animation: moving-flower-2 4s linear infinite; }
        .flower--3 { left: 50%; transform: rotate(-15deg); animation: moving-flower-3 4s linear infinite; }

        .flower__leafs {
          position: relative;
          animation: blooming-flower 2s backwards;
        }
        .flower__leafs--1 { animation-delay: 1.1s; }
        .flower__leafs--2 { animation-delay: 1.4s; }
        .flower__leafs--3 { animation-delay: 1.7s; }

        .flower__leafs::after {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          transform: translate(-50%, -100%);
          width: 8vmin;
          height: 8vmin;
          background-color: #ff00ff;
          filter: blur(10vmin);
        }

        /* --- Flower Parts Styling --- */
        .flower__leaf {
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 8vmin;
          height: 11vmin;
          border-radius: 51% 49% 47% 53%/44% 45% 55% 69%;
          background-color: #ffb7ff;
          background-image: linear-gradient(to top, #6a0572, #ff69b4);
          transform-origin: bottom center;
          opacity: 0.9;
          box-shadow: inset 0 0 2vmin rgba(255, 255, 255, 0.5);
        }

        .flower__leaf--1 { transform: translate(-10%, 1%) rotateY(40deg) rotateX(-50deg); }
        .flower__leaf--2 { transform: translate(-50%, -4%) rotateX(40deg); }
        .flower__leaf--3 { transform: translate(-90%, 0%) rotateY(45deg) rotateX(50deg); }
        .flower__leaf--4 {
          width: 8vmin; height: 8vmin; transform-origin: bottom left;
          border-radius: 4vmin 10vmin 4vmin 4vmin;
          transform: translate(0%, 18%) rotateX(70deg) rotate(-43deg);
          background-image: linear-gradient(to top, #4b0082, #ff69b4);
          z-index: 1; opacity: 0.8;
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
          background-image: linear-gradient(90deg, #ff0080, #ff00ff);
        }

        .flower__line {
          height: 55vmin; width: 1.5vmin;
          background-image: linear-gradient(to left, rgba(0,0,0,0.2), transparent, rgba(255,255,255,0.2)), linear-gradient(to top, transparent 10%, #31004a, #ab00ff);
          box-shadow: inset 0 0 2px rgba(0,0,0,0.5);
          animation: grow-flower-tree 4s backwards;
        }
        .flower--1 .flower__line { height: 70vmin; animation-delay: 0.3s; }
        .flower--2 .flower__line { height: 60vmin; animation-delay: 0.6s; }
        .flower--3 .flower__line { animation-delay: 0.9s; }

        .flower__line__leaf {
          --w: 7vmin; --h: calc(var(--w) + 2vmin);
          position: absolute; top: 20%; left: 90%;
          width: var(--w); height: var(--h);
          border-top-right-radius: var(--h); border-bottom-left-radius: var(--h);
          background-image: linear-gradient(to top, rgba(75,0,130,0.4), #ff00ff);
        }
        .flower__line__leaf--1 { transform: rotate(70deg) rotateY(30deg); animation: blooming-leaf-right var(--fl-speed) 1.6s backwards; }
        .flower__line__leaf--2 { top: 45%; transform: rotate(70deg) rotateY(30deg); animation: blooming-leaf-right var(--fl-speed) 1.4s backwards; }
        .flower__line__leaf--3 { border-radius: var(--h) 0 var(--h) 0; left: -460%; top: 12%; transform: rotate(-70deg) rotateY(30deg); animation: blooming-leaf-left var(--fl-speed) 1.2s backwards; }
        .flower__line__leaf--4 { border-radius: var(--h) 0 var(--h) 0; left: -460%; top: 40%; transform: rotate(-70deg) rotateY(30deg); animation: blooming-leaf-left var(--fl-speed) 1s backwards; }
        .flower__line__leaf--5 { top: 0; transform: rotate(70deg) rotateY(30deg) scale(0.6); animation: blooming-leaf-right 1.8s backwards; }
        .flower__line__leaf--6 { top: -2%; left: -450%; transform: rotate(-70deg) rotateY(30deg) scale(0.6); border-radius: var(--h) 0 var(--h) 0; animation: blooming-leaf-left 2s backwards; }

        .flower__light {
          position: absolute; bottom: 0vmin; width: 1vmin; height: 1vmin;
          background-color: #ff00f2; border-radius: 50%;
          filter: blur(0.2vmin); animation: light-ans 4s linear infinite backwards;
        }
        .flower__light:nth-child(odd) { background-color: #a200ff; }
        .flower__light--1 { left: -2vmin; animation-delay: 1s; }
        .flower__light--2 { left: 3vmin; animation-delay: 0.5s; }
        .flower__light--3 { left: -6vmin; animation-delay: 0.3s; }
        .flower__light--4 { left: 6vmin; animation-delay: 0.9s; }

        /* --- Grass and Details --- */
        .growing-grass { animation: growing-grass-ans 1s 2s backwards; }
        .flower__grass {
          --c: #6a0572; position: absolute; bottom: 12vmin; left: -7vmin;
          display: flex; flex-direction: column; align-items: flex-end;
          z-index: 20; transform-origin: bottom center; transform: rotate(-48deg) rotateY(40deg);
        }
        .flower__grass--1 { animation: moving-grass 2s linear infinite; }
        .flower__grass--2 { left: 2vmin; bottom: 10vmin; transform: scale(0.5) rotate(75deg) rotateX(10deg) rotateY(-200deg); opacity: 0.8; z-index: 0; animation: moving-grass--2 1.5s linear infinite; }
        .flower__grass--top { width: 7vmin; height: 10vmin; border-top-right-radius: 100%; border-right: 1.5vmin solid var(--c); transform: rotate(-2deg); }
        .flower__grass--bottom { margin-top: -2px; width: 1.5vmin; height: 25vmin; background-image: linear-gradient(to top, transparent, var(--c)); }
        
        .flower__g-right .leaf { border-left: 2vmin solid #6a0572; }
        .flower__g-front__leaf {
          background-image: linear-gradient(to bottom left, transparent, var(--dark-color)),
                            linear-gradient(to bottom right, #a020f0 50%, transparent 50%);
        }
        .long-g .leaf { --c: #8a2be2; }
        
        /* ... All other complex grass styles from the user's code ... */
        .flower__grass__leaf { --size: 10vmin; position: absolute; width: calc(var(--size) * 2.1); height: var(--size); border-top-left-radius: var(--size); border-top-right-radius: var(--size); background-image: linear-gradient(to top, transparent, transparent 30%, var(--c)); z-index: 100; }
        .flower__grass__leaf--1 { top: -6%; left: 30%; --size: 6vmin; transform: rotate(-20deg); animation: growing-grass-ans--1 2s 2.6s backwards; }
        .flower__grass__leaf--2 { top: -5%; left: -110%; --size: 6vmin; transform: rotate(10deg); animation: growing-grass-ans--2 2s 2.4s linear backwards; }
        .flower__g-long { --w: 2vmin; --h: 6vmin; --c: #7c15aa; position: absolute; bottom: 10vmin; left: -3vmin; transform-origin: bottom center; transform: rotate(-30deg) rotateY(-20deg); display: flex; flex-direction: column; align-items: flex-end; animation: flower-g-long-ans 3s linear infinite; }
        .flower__g-long__top { top: calc(var(--h) * -1); width: calc(var(--w) + 1vmin); height: var(--h); border-top-right-radius: 100%; border-right: 0.7vmin solid var(--c); transform: translate(-0.7vmin, 1vmin); }
        .flower__g-long__bottom { width: var(--w); height: 50vmin; transform-origin: bottom center; background-image: linear-gradient(to top, transparent 30%, var(--c)); box-shadow: inset 0 0 2px rgba(0,0,0,0.5); clip-path: polygon(35% 0, 65% 1%, 100% 100%, 0% 100%); }
        .flower__g-right { position: absolute; bottom: 6vmin; left: -2vmin; transform-origin: bottom left; transform: rotate(20deg); }
        .flower__g-right .leaf { width: 30vmin; height: 50vmin; border-top-left-radius: 100%; border-left: 2vmin solid #6600aa; background-image: linear-gradient(to bottom, transparent, var(--dark-color) 60%); -webkit-mask-image: linear-gradient(to top, transparent 30%, #6600aa 60%); }
        .flower__g-right--1 { animation: flower-g-right-ans 2.5s linear infinite; }
        .flower__g-right--2 { left: 5vmin; transform: rotateY(-180deg); animation: flower-g-right-ans--2 3s linear infinite; }
        .flower__g-right--2 .leaf { height: 75vmin; filter: blur(0.3vmin); opacity: 0.8; }
        .flower__g-front { position: absolute; bottom: 6vmin; left: 2.5vmin; z-index: 100; transform-origin: bottom center; transform: rotate(-28deg) rotateY(30deg) scale(1.04); animation: flower__g-front-ans 2s linear infinite; }
        .flower__g-front__line { width: 0.3vmin; height: 20vmin; background-image: linear-gradient(to top, transparent, #6600aa, transparent 100%); position: relative; }
        .flower__g-front__leaf-wrapper { position: absolute; top: 0; left: 0; transform-origin: bottom left; transform: rotate(10deg); }
        .flower__g-front__leaf-wrapper:nth-child(even) { left: 0vmin; transform: rotateY(-180deg) rotate(5deg); animation: flower__g-front__leaf-left-ans 1s ease-in backwards; }
        .flower__g-front__leaf-wrapper:nth-child(odd) { animation: flower__g-front__leaf-ans 1s ease-in backwards; }
        .flower__g-front__leaf-wrapper--1 { top: -8vmin; transform: scale(0.7); animation: flower__g-front__leaf-ans 1s 5.5s ease-in backwards !important; }
        .flower__g-front__leaf-wrapper--2 { top: -8vmin; transform: rotateY(-180deg) scale(0.7) !important; animation: flower__g-front__leaf-left-ans-2 1s 4.6s ease-in backwards !important; }
        .flower__g-front__leaf { width: 10vmin; height: 10vmin; border-radius: 100% 0% 0% 100%/100% 100% 0% 0%; box-shadow: inset 0 2px 1vmin rgba(180, 44, 252, 0.2); background-image: linear-gradient(to bottom left, transparent, var(--dark-color)), linear-gradient(to bottom right, #7c15aa 50%, transparent 50%, transparent); -webkit-mask-image: linear-gradient(to bottom right, #7c15aa 50%, transparent 50%, transparent); mask-image: linear-gradient(to bottom right, #7c15aa 50%, transparent 50%, transparent); }
        .long-g { position: absolute; bottom: 25vmin; left: -42vmin; transform-origin: bottom left; }
        .long-g .leaf { --w: 15vmin; --h: 40vmin; --c: #1aaa15; position: absolute; bottom: 0; width: var(--w); height: var(--h); border-top-left-radius: 100%; border-left: 2vmin solid var(--c); -webkit-mask-image: linear-gradient(to top, transparent 20%, var(--dark-color)); transform-origin: bottom center; }
        .long-g .leaf--0 { left: 2vmin; animation: leaf-ans-1 4s linear infinite; }
        .long-g--7 { left: 35vmin; bottom: 20vmin; z-index: -1; filter: blur(0.3vmin); transform: scale(0.6) rotate(2deg); opacity: 0.7; }
        
        /* --- Keyframes for animation --- */
        @keyframes light-ans { 0% { opacity: 0; transform: translateY(0vmin); } 25% { opacity: 1; transform: translateY(-5vmin) translateX(-2vmin); } 50% { opacity: 1; transform: translateY(-15vmin) translateX(2vmin); filter: blur(0.2vmin); } 100% { transform: translateY(-30vmin); opacity: 0; filter: blur(1vmin); } }
        @keyframes moving-flower-1 { 0%, 100% { transform: rotate(2deg); } 50% { transform: rotate(-2deg); } }
        @keyframes moving-flower-2 { 0%, 100% { transform: rotate(18deg); } 50% { transform: rotate(14deg); } }
        @keyframes moving-flower-3 { 0%, 100% { transform: rotate(-18deg); } 50% { transform: rotate(-20deg) rotateY(-10deg); } }
        @keyframes blooming-leaf-right { 0% { transform-origin: left; transform: rotate(70deg) rotateY(30deg) scale(0); } }
        @keyframes blooming-leaf-left { 0% { transform-origin: right; transform: rotate(-70deg) rotateY(30deg) scale(0); } }
        @keyframes grow-flower-tree { 0% { height: 0; border-radius: 1vmin; } }
        @keyframes blooming-flower { 0% { transform: scale(0); } }
        @keyframes moving-grass { 0%, 100% { transform: rotate(-48deg) rotateY(40deg); } 50% { transform: rotate(-50deg) rotateY(40deg); } }
        @keyframes moving-grass--2 { 0%, 100% { transform: scale(0.5) rotate(75deg) rotateX(10deg) rotateY(-200deg); } 50% { transform: scale(0.5) rotate(79deg) rotateX(10deg) rotateY(-200deg); } }
        @keyframes growing-grass-ans { 0% { transform: scale(0); } }
        @keyframes grow-ans { 0% { transform: scale(0); opacity: 0; } }
        @keyframes leaf-ans-1 { 0%, 100% { transform: rotate(-5deg) scale(1); } 50% { transform: rotate(5deg) scale(1.1); } }
        @keyframes leaf-ans-2 { 0%, 100% { transform: rotateY(-180deg) rotate(5deg); } 50% { transform: rotateY(-180deg) rotate(0deg) scale(1.1); } }
        @keyframes leaf-ans-3 { 0%, 100% { transform: rotate(-10deg) rotateY(-180deg); } 50% { transform: rotate(-20deg) rotateY(-180deg); } }
        @keyframes flower-g-right-ans { 0%, 100% { transform: rotate(20deg); } 50% { transform: rotate(24deg) rotateX(-20deg); } }
        @keyframes flower-g-right-ans--2 { 0%, 100% { transform: rotateY(-180deg) rotate(0deg) rotateX(-20deg); } 50% { transform: rotateY(-180deg) rotate(6deg) rotateX(-20deg); } }
        @keyframes flower__g-front-ans { 0%, 100% { transform: rotate(-28deg) rotateY(30deg) scale(1.04); } 50% { transform: rotate(-35deg) rotateY(40deg) scale(1.04); } }
      `}</style>
      
      <div className="night"></div>
      <div className="flowers">
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
        
        <div className="grow-ans" style={{'--d':'1.2s'} as React.CSSProperties}>
            <div className="flower__g-long"><div className="flower__g-long__top"></div><div className="flower__g-long__bottom"></div></div>
        </div>
        
        <div className="growing-grass">
            <div className="flower__grass flower__grass--1">
                <div className="flower__grass--top"></div><div className="flower__grass--bottom"></div>
                {[...Array(8)].map((_, i) => <div key={i} className={`flower__grass__leaf flower__grass__leaf--${i + 1}`}></div>)}
            </div>
        </div>
        <div className="growing-grass">
            <div className="flower__grass flower__grass--2">
                <div className="flower__grass--top"></div><div className="flower__grass--bottom"></div>
                {[...Array(8)].map((_, i) => <div key={i} className={`flower__grass__leaf flower__grass__leaf--${i + 1}`}></div>)}
            </div>
        </div>

        <div className="grow-ans" style={{'--d': '2.4s'} as React.CSSProperties}><div className="flower__g-right flower__g-right--1"><div className="leaf"></div></div></div>
        <div className="grow-ans" style={{'--d': '2.8s'} as React.CSSProperties}><div className="flower__g-right flower__g-right--2"><div className="leaf"></div></div></div>
        <div className="grow-ans" style={{'--d': '2.8s'} as React.CSSProperties}><div className="flower__g-front">{[...Array(8)].map((_, i) => <div key={i} className={`flower__g-front__leaf-wrapper flower__g-front__leaf-wrapper--${i + 1}`}><div className="flower__g-front__leaf"></div></div>)}<div className="flower__g-front__line"></div></div></div>

        {[0,1,2,3,4,5,6,7].map(i => (
             <div key={i} className={`long-g long-g--${i}`}>
                <div className="grow-ans" style={{'--d': (3 + i*0.2) + 's'} as React.CSSProperties}><div className="leaf leaf--0"></div></div>
                <div className="grow-ans" style={{'--d': (2.2 + i*0.2) + 's'} as React.CSSProperties}><div className="leaf leaf--1"></div></div>
                <div className="grow-ans" style={{'--d': (3.4 + i*0.2) + 's'} as React.CSSProperties}><div className="leaf leaf--2"></div></div>
                <div className="grow-ans" style={{'--d': (3.6 + i*0.2) + 's'} as React.CSSProperties}><div className="leaf leaf--3"></div></div>
            </div>
        ))}
      </div>
    </div>
  );
}

