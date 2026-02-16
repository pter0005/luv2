'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// --- VISUAL CONFIGURATION (Converted from CSS variables) ---
const COLORS = {
  dark: '#05000a',
  purpleDark: '#240046',
  purpleMid: '#5a189a',
  purpleLight: '#9d4edd',
  purpleNeon: '#e0aaff',
  stem: '#3c096c',
  grass: '#10002b',
  glow: '#ff007f',
};

// --- Sparkle Particle Component ---
const Sparkle = React.memo(({ index }: { index: number }) => {
  const duration = useMemo(() => Math.random() * 3 + 4, []);
  const delay = useMemo(() => Math.random() * 5, []);
  const left = useMemo(() => Math.random() * 100, []);
  const size = useMemo(() => Math.random() * 3 + 2, []);

  return (
    <motion.div
      className="absolute top-[-10px]"
      style={{
        left: `${left}%`,
        width: size,
        height: size,
        backgroundColor: Math.random() > 0.5 ? '#fff' : COLORS.purpleNeon,
        borderRadius: '50%',
        boxShadow: `0 0 ${Math.random() * 5 + 2}px ${Math.random() > 0.5 ? '#fff' : COLORS.purpleNeon}`,
      }}
      initial={{ y: '-10vh', scale: 0, opacity: 0 }}
      animate={{ y: '110vh', opacity: [0, 1, 0] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
});
Sparkle.displayName = 'Sparkle';


// --- Main Flower Component ---
const Flower = ({ flowerClass, height, leafsDelay, lineDelay }: { flowerClass: string, height: number, leafsDelay: number, lineDelay: number }) => {
  return (
    <motion.div
      className={`flower ${flowerClass}`}
      animate={{
        rotate: flowerClass === 'flower--1' ? [2, -2] : (flowerClass === 'flower--2' ? [18, 14] : [-18, -20]),
      }}
      transition={{ duration: 4, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
    >
        <motion.div
          className={`flower__leafs flower__leafs--${flowerClass.slice(-1)}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, delay: leafsDelay, type: 'spring', bounce: 0.4 }}
        >
            <div className="flower__leaf flower__leaf--1" />
            <div className="flower__leaf flower__leaf--2" />
            <div className="flower__leaf flower__leaf--3" />
            <div className="flower__leaf flower__leaf--4" />
            <div className="flower__white-circle" />
            {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                    key={i}
                    className={`flower__light flower__light--${i+1}`}
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ y: -30, opacity: [0, 1, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: lineDelay + i * 0.5, ease: "easeInOut" }}
                />
            ))}
        </motion.div>
        
        <motion.div
            className="flower__line"
            initial={{ height: 0, borderRadius: '1vmin' }}
            animate={{ height: `${height}vmin` }}
            transition={{ duration: 4, delay: lineDelay, ease: "easeOut" }}
        >
          {[1, 2, 3, 4, 5, 6].map(i => (
             <motion.div 
                key={i} 
                className={`flower__line__leaf flower__line__leaf--${i}`}
                initial={{scale:0}} 
                animate={{scale:1}} 
                transition={{duration:0.8, delay: lineDelay + 1 + i*0.2}}
              />
          ))}
        </motion.div>
    </motion.div>
  );
};


const Grass = ({ className, animationDelay } : { className: string, animationDelay: number }) => (
    <motion.div
      className="growing-grass"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 2, delay: animationDelay }}
    >
      <div className={`flower__grass ${className}`}>
        <div className="flower__grass--top"></div>
        <div className="flower__grass--bottom"></div>
        {Array.from({ length: 8 }).map((_, i) => (
           <motion.div key={i} className={`flower__grass__leaf flower__grass__leaf--${i+1}`}
                initial={{scale: 0}}
                animate={{scale: 1}}
                transition={{duration: 2, delay: animationDelay + 0.2 + i*0.1}}
           />
        ))}
      </div>
    </motion.div>
);

const LongGrass = ({ className, d }: { className: string, d: number }) => (
    <div className={`long-g ${className}`}>
        <motion.div className="grow-ans" initial={{scale:0}} animate={{scale:1}} transition={{duration:3, delay:d}}><div className="leaf leaf--0"></div></motion.div>
        <motion.div className="grow-ans" initial={{scale:0}} animate={{scale:1}} transition={{duration:3.2, delay:d}}><div className="leaf leaf--1"></div></motion.div>
        <motion.div className="grow-ans" initial={{scale:0}} animate={{scale:1}} transition={{duration:3.4, delay:d}}><div className="leaf leaf--2"></div></motion.div>
    </div>
);


export default function MysticFlowers() {
  return (
    <>
    <style jsx global>{`
      :root {
        --dark-color: #05000a;
        --purple-dark: #240046;
        --purple-mid: #5a189a;
        --purple-light: #9d4edd;
        --purple-neon: #e0aaff;
        --stem-color: #3c096c;
        --grass-color: #10002b;
        --glow-color: #ff007f;
      }

      .night {
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle at center bottom, #2a003b 0%, #0d001a 60%, #000000 100%);
        z-index: -1;
      }
      .rain-container {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        pointer-events: none;
        z-index: 100;
      }
      .flowers {
        position: relative;
        transform: scale(0.9);
      }

      .flower {
        position: absolute;
        bottom: 10vmin;
        transform-origin: bottom center;
        z-index: 10;
        --fl-speed: 0.8s;
      }

      .flower--1 { animation: moving-flower-1 4s linear infinite; }
      .flower--2 { left: 50%; transform: rotate(20deg); animation: moving-flower-2 4s linear infinite; }
      .flower--3 { left: 50%; transform: rotate(-15deg); animation: moving-flower-3 4s linear infinite; }

      .flower__leafs {
        position: relative;
        animation-delay: 1.1s;
      }
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
        background-color: var(--purple-neon);
        filter: blur(10vmin);
        opacity: 0.5;
      }

      .flower__leaf {
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 8vmin;
        height: 11vmin;
        border-radius: 51% 49% 47% 53%/44% 45% 55% 69%;
        background-color: var(--purple-light);
        background-image: linear-gradient(to top, var(--purple-mid), var(--purple-neon));
        transform-origin: bottom center;
        opacity: 0.9;
        box-shadow: inset 0 0 2vmin rgba(255, 255, 255, 0.2);
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
        background-image: linear-gradient(to top, var(--purple-dark), var(--purple-light));
        z-index: 1;
        opacity: 0.8;
      }

      .flower__white-circle {
        position: absolute;
        left: -3.5vmin;
        top: -3vmin;
        width: 9vmin;
        height: 4vmin;
        border-radius: 50%;
        background-color: #fff;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
      }
      .flower__white-circle::after {
        content: "";
        position: absolute;
        left: 50%;
        top: 45%;
        transform: translate(-50%, -50%);
        width: 60%;
        height: 60%;
        border-radius: inherit;
        background-image: repeating-linear-gradient(135deg, rgba(0,0,0,0.03) 0px, transparent 2px), linear-gradient(90deg, #ffd700, #ff8c00);
      }

      .flower__line {
        width: 1.5vmin;
        background-image: linear-gradient(to left, rgba(0,0,0,0.5), transparent, rgba(255,255,255,0.1)), 
                          linear-gradient(to top, transparent 10%, var(--dark-color), var(--stem-color));
        box-shadow: inset 0 0 2px rgba(0,0,0,0.5);
      }
      
      .flower__line__leaf {
        --w: 7vmin;
        --h: calc(var(--w) + 2vmin);
        position: absolute;
        top: 20%;
        left: 90%;
        width: var(--w);
        height: var(--h);
        border-top-right-radius: var(--h);
        border-bottom-left-radius: var(--h);
        background-image: linear-gradient(to top, var(--purple-dark), var(--purple-mid));
        box-shadow: inset 0 0 5px rgba(0,0,0,0.3);
      }
      
      .flower__line__leaf--1 { transform: rotate(70deg) rotateY(30deg); }
      .flower__line__leaf--2 { top: 45%; transform: rotate(70deg) rotateY(30deg); }
      .flower__line__leaf--3 { 
        border-radius: var(--h) 0 var(--h) 0;
        left: -460%; top: 12%; transform: rotate(-70deg) rotateY(30deg); 
      }
      .flower__line__leaf--4 { 
        border-radius: var(--h) 0 var(--h) 0;
        left: -460%; top: 40%; transform: rotate(-70deg) rotateY(30deg);
      }
      .flower__line__leaf--5 { top: 0; transform: rotate(70deg) rotateY(30deg) scale(0.6); }
      .flower__line__leaf--6 { top: -2%; left: -450%; transform: rotate(-70deg) rotateY(30deg) scale(0.6); border-radius: var(--h) 0 var(--h) 0; }

      .flower__light {
        position: absolute;
        bottom: 0vmin;
        width: 1vmin;
        height: 1vmin;
        background-color: #fff;
        border-radius: 50%;
        filter: blur(0.2vmin);
        box-shadow: 0 0 5px var(--purple-neon);
      }
      .flower__light:nth-child(odd) { background-color: var(--purple-neon); }
      
      .flower__grass {
        --c: var(--grass-color);
        --line-w: 1.5vmin;
        position: absolute;
        bottom: 12vmin;
        left: -7vmin;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        z-index: 20;
        transform-origin: bottom center;
        transform: rotate(-48deg) rotateY(40deg);
      }
      
      .flower__grass--1 { animation: moving-grass 2s linear infinite; }
      .flower__grass--2 { left: 2vmin; bottom: 10vmin; transform: scale(0.5) rotate(75deg) rotateX(10deg) rotateY(-200deg); opacity: 0.8; z-index: 0; animation: moving-grass--2 1.5s linear infinite; }

      .flower__grass--top {
        width: 7vmin;
        height: 10vmin;
        border-top-right-radius: 100%;
        border-right: var(--line-w) solid var(--purple-dark);
        transform-origin: bottom center;
        transform: rotate(-2deg);
      }
      .flower__grass--bottom {
        margin-top: -2px;
        width: var(--line-w);
        height: 25vmin;
        background-image: linear-gradient(to top, transparent, var(--purple-dark));
      }
      
      .flower__grass__leaf {
        --size: 10vmin;
        position: absolute;
        width: calc(var(--size) * 2.1);
        height: var(--size);
        border-top-left-radius: var(--size);
        border-top-right-radius: var(--size);
        background-image: linear-gradient(to top, transparent, transparent 30%, var(--purple-dark));
        z-index: 100;
      }
      
      .flower__grass__leaf--1 { top: -6%; left: 30%; --size: 6vmin; transform: rotate(-20deg); }
      .flower__grass__leaf--2 { top: -5%; left: -110%; --size: 6vmin; transform: rotate(10deg); }
      .flower__grass__leaf--3 { top: 5%; left: 60%; transform: rotate(-18deg); }
      .flower__grass__leaf--4 { top: 6%; left: -135%; transform: rotate(2deg); }

      .long-g {
        position: absolute;
        bottom: 25vmin;
        left: -42vmin;
        transform-origin: bottom left;
      }
      
      .long-g .leaf {
        --w: 15vmin;
        --h: 40vmin;
        --c: #1a0025;
        position: absolute;
        bottom: 0;
        width: var(--w);
        height: var(--h);
        border-top-left-radius: 100%;
        border-left: 2vmin solid var(--c);
        background: linear-gradient(to bottom, transparent, var(--dark-color));
        -webkit-mask-image: linear-gradient(to top, transparent 10%, var(--purple-dark));
        mask-image: linear-gradient(to top, transparent 10%, var(--purple-dark));
        transform-origin: bottom center;
      }

      .long-g--0 { left: -50vmin; transform: scale(0.8); }
      .long-g--1 { left: -42vmin; transform: scale(1) rotate(-5deg); }
      .long-g--2 { left: -15vmin; transform: scale(0.6); z-index: -1; }
      .long-g--3 { left: 0vmin; transform: scale(0.7); z-index: -2; filter: blur(1px); }
      .long-g--4 { left: 25vmin; transform: scale(0.6); z-index: -1; }
      .long-g--5 { left: 42vmin; transform: scale(0.8) rotate(5deg); }
      .long-g--6 { left: 55vmin; transform: scale(0.9); }
      .long-g--7 { left: 10vmin; bottom: 5vmin; transform: scale(1.1); z-index: 50; filter: blur(2px); opacity: 0.5; }

      @keyframes moving-flower-1 { 0%, 100% { transform: rotate(2deg); } 50% { transform: rotate(-2deg); } }
      @keyframes moving-flower-2 { 0%, 100% { transform: rotate(18deg); } 50% { transform: rotate(14deg); } }
      @keyframes moving-flower-3 { 0%, 100% { transform: rotate(-18deg); } 50% { transform: rotate(-20deg) rotateY(-10deg); } }
      @keyframes moving-grass { 0%, 100% { transform: rotate(-48deg) rotateY(40deg); } 50% { transform: rotate(-50deg) rotateY(40deg); } }
      @keyframes moving-grass--2 { 0%, 100% { transform: rotate(75deg) rotateX(10deg) rotateY(-200deg); } 50% { transform: rotate(70deg) rotateX(10deg) rotateY(-200deg); } }
    `}</style>
    <div className="relative w-full h-full overflow-hidden">
        <div className="night" />
        <div className="rain-container">
            {Array.from({ length: 40 }).map((_, i) => (
                <Sparkle key={i} index={i} />
            ))}
        </div>
        <div className="flowers">
            <Flower flowerClass="flower--1" height={70} leafsDelay={1.1} lineDelay={0.3} />
            <Flower flowerClass="flower--2" height={60} leafsDelay={1.4} lineDelay={0.6} />
            <Flower flowerClass="flower--3" height={55} leafsDelay={1.7} lineDelay={0.9} />

            <Grass className="flower__grass--1" animationDelay={2} />
            <Grass className="flower__grass--2" animationDelay={2} />
            
            <LongGrass className="long-g--0" d={3}/>
            <LongGrass className="long-g--1" d={3.2}/>
            <LongGrass className="long-g--2" d={3.4}/>
            <LongGrass className="long-g--3" d={3.6}/>
            <LongGrass className="long-g--4" d={3.8}/>
            <LongGrass className="long-g--5" d={4}/>
            <LongGrass className="long-g--6" d={4.2}/>
            <LongGrass className="long-g--7" d={4.4}/>
        </div>
    </div>
    </>
  );
}
