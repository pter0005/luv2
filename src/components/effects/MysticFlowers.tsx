
'use client';

import React, { useEffect, useState } from 'react';

export default function MysticFlowers() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`fw ${!loaded ? 'not-loaded' : ''}`}>
      <style>{`
        .fw {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          background-color: #000;
          overflow: hidden;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          perspective: 1000px;
          --dark-color: #000;
          transform: translateZ(0); /* Fix: Create a new stacking context */
          z-index: 0;
          pointer-events: none;
        }
        .fw.not-loaded * { animation-play-state: paused !important; }

        .fw .night {
          position: absolute;
          left: 50%; top: 0;
          transform: translateX(-50%);
          width: 100%; height: 100%;
          filter: blur(0.1vmin);
          background-image:
            radial-gradient(ellipse at top, transparent 0%, #000),
            radial-gradient(ellipse at bottom, #000, rgba(180,100,255,0.2)),
            repeating-linear-gradient(220deg, black 0px, black 19px, transparent 19px, transparent 22px),
            repeating-linear-gradient(189deg, black 0px, black 19px, transparent 19px, transparent 22px),
            repeating-linear-gradient(148deg, black 0px, black 19px, transparent 19px, transparent 22px),
            linear-gradient(90deg, #a000ff, #f0f0f0);
        }

        .fw .flowers {
          position: relative;
          transform: scale(1.8);
          transform-origin: bottom center;
        }

        @media (min-width: 768px) {
            .fw .flowers {
                transform: scale(0.6);
            }
        }
        
        .fw .flower {
          position: absolute; bottom: 10vmin;
          transform-origin: bottom center;
          z-index: 1; --fl-speed: 0.8s;
        }
        .fw .flower--1 { animation: fw-moving-flower-1 4s linear infinite; }
        .fw .flower--1 .flower__line { height: 70vmin; animation-delay: 0.3s; }
        .fw .flower--1 .flower__line__leaf--1 { animation: fw-blooming-leaf-right var(--fl-speed) 1.6s backwards; }
        .fw .flower--1 .flower__line__leaf--2 { animation: fw-blooming-leaf-right var(--fl-speed) 1.4s backwards; }
        .fw .flower--1 .flower__line__leaf--3 { animation: fw-blooming-leaf-left  var(--fl-speed) 1.2s backwards; }
        .fw .flower--1 .flower__line__leaf--4 { animation: fw-blooming-leaf-left  var(--fl-speed) 1.0s backwards; }
        .fw .flower--1 .flower__line__leaf--5 { animation: fw-blooming-leaf-right var(--fl-speed) 1.8s backwards; }
        .fw .flower--1 .flower__line__leaf--6 { animation: fw-blooming-leaf-left  var(--fl-speed) 2.0s backwards; }
        .fw .flower--2 { left: 50%; transform: rotate(20deg); animation: fw-moving-flower-2 4s linear infinite; }
        .fw .flower--2 .flower__line { height: 60vmin; animation-delay: 0.6s; }
        .fw .flower--2 .flower__line__leaf--1 { animation: fw-blooming-leaf-right var(--fl-speed) 1.9s backwards; }
        .fw .flower--2 .flower__line__leaf--2 { animation: fw-blooming-leaf-right var(--fl-speed) 1.7s backwards; }
        .fw .flower--2 .flower__line__leaf--3 { animation: fw-blooming-leaf-left  var(--fl-speed) 1.5s backwards; }
        .fw .flower--2 .flower__line__leaf--4 { animation: fw-blooming-leaf-left  var(--fl-speed) 1.3s backwards; }
        .fw .flower--3 { left: 50%; transform: rotate(-15deg); animation: fw-moving-flower-3 4s linear infinite; }
        .fw .flower--3 .flower__line { animation-delay: 0.9s; }
        .fw .flower--3 .flower__line__leaf--1 { animation: fw-blooming-leaf-right var(--fl-speed) 2.5s backwards; }
        .fw .flower--3 .flower__line__leaf--2 { animation: fw-blooming-leaf-right var(--fl-speed) 2.3s backwards; }
        .fw .flower--3 .flower__line__leaf--3 { animation: fw-blooming-leaf-left  var(--fl-speed) 2.1s backwards; }
        .fw .flower--3 .flower__line__leaf--4 { animation: fw-blooming-leaf-left  var(--fl-speed) 1.9s backwards; }

        .fw .flower__leafs { position: relative; animation: fw-blooming-flower 2s backwards; }
        .fw .flower__leafs--1 { animation-delay: 1.1s; }
        .fw .flower__leafs--2 { animation-delay: 1.4s; }
        .fw .flower__leafs--3 { animation-delay: 1.7s; }
        .fw .flower__leafs::after {
          content: ""; position: absolute; left: 0; top: 0;
          transform: translate(-50%, -100%);
          width: 8vmin; height: 8vmin;
          background-color: #c06bff; filter: blur(10vmin);
        }
        .fw .flower__leaf {
          position: absolute; bottom: 0; left: 50%;
          width: 8vmin; height: 11vmin;
          border-radius: 51% 49% 47% 53%/44% 45% 55% 69%;
          background-color: #e8a7ff;
          background-image: linear-gradient(to top, #9354b8, #e8a7ff);
          transform-origin: bottom center; opacity: 0.9;
          box-shadow: inset 0 0 2vmin rgba(255,255,255,0.5);
        }
        .fw .flower__leaf--1 { transform: translate(-10%, 1%)  rotateY(40deg) rotateX(-50deg); }
        .fw .flower__leaf--2 { transform: translate(-50%, -4%) rotateX(40deg); }
        .fw .flower__leaf--3 { transform: translate(-90%, 0%)  rotateY(45deg) rotateX(50deg); }
        .fw .flower__leaf--4 {
          width: 8vmin; height: 8vmin; transform-origin: bottom left;
          border-radius: 4vmin 10vmin 4vmin 4vmin;
          transform: translate(0%, 18%) rotateX(70deg) rotate(-43deg);
          background-image: linear-gradient(to top, #6a22c4, #e8a7ff);
          z-index: 1; opacity: 0.8;
        }
        .fw .flower__white-circle {
          position: absolute; left: -3.5vmin; top: -3vmin;
          width: 9vmin; height: 4vmin; border-radius: 50%; background-color: #fff;
        }
        .fw .flower__white-circle::after {
          content: ""; position: absolute; left: 50%; top: 45%;
          transform: translate(-50%, -50%); width: 60%; height: 60%; border-radius: inherit;
          background-image:
            repeating-linear-gradient(135deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 12px),
            repeating-linear-gradient(45deg,  rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 1px, transparent 1px, transparent 12px),
            linear-gradient(90deg, #ffeb12, #ffce00);
        }
        .fw .flower__line {
          height: 55vmin; width: 1.5vmin;
          background-image:
            linear-gradient(to left, rgba(0,0,0,0.2), transparent, rgba(255,255,255,0.2)),
            linear-gradient(to top, transparent 10%, #4a1475, #8c39d6);
          box-shadow: inset 0 0 2px rgba(0,0,0,0.5);
          animation: fw-grow-flower-tree 4s backwards;
        }
        .fw .flower__line__leaf {
          --w: 7vmin; --h: calc(var(--w) + 2vmin);
          position: absolute; top: 20%; left: 90%;
          width: var(--w); height: var(--h);
          border-top-right-radius: var(--h); border-bottom-left-radius: var(--h);
          background-image: linear-gradient(to top, rgba(74,20,117,0.4), #8c39d6);
        }
        .fw .flower__line__leaf--1 { transform: rotate(70deg) rotateY(30deg); }
        .fw .flower__line__leaf--2 { top: 45%; transform: rotate(70deg) rotateY(30deg); }
        .fw .flower__line__leaf--3,.fw .flower__line__leaf--4,.fw .flower__line__leaf--6 {
          border-top-right-radius: 0; border-bottom-left-radius: 0;
          border-top-left-radius: var(--h); border-bottom-right-radius: var(--h);
          left: -460%; top: 12%; transform: rotate(-70deg) rotateY(30deg);
        }
        .fw .flower__line__leaf--4 { top: 40%; }
        .fw .flower__line__leaf--5 { top: 0; transform-origin: left; transform: rotate(70deg) rotateY(30deg) scale(0.6); }
        .fw .flower__line__leaf--6 { top: -2%; left: -450%; transform-origin: right; transform: rotate(-70deg) rotateY(30deg) scale(0.6); }
        .fw .flower__light {
          position: absolute; bottom: 0; width: 1vmin; height: 1vmin;
          background-color: #fffb00; border-radius: 50%; filter: blur(0.2vmin);
          animation: fw-light-ans 4s linear infinite backwards;
        }
        .fw .flower__light:nth-child(odd) { background-color: #cc00ff; }
        .fw .flower__light--1 { left:-2vmin; animation-delay:1.0s; }
        .fw .flower__light--2 { left: 3vmin; animation-delay:0.5s; }
        .fw .flower__light--3 { left:-6vmin; animation-delay:0.3s; }
        .fw .flower__light--4 { left: 6vmin; animation-delay:0.9s; }
        .fw .flower__light--5 { left:-1vmin; animation-delay:1.5s; }
        .fw .flower__light--6 { left:-4vmin; animation-delay:3.0s; }
        .fw .flower__light--7 { left: 3vmin; animation-delay:2.0s; }
        .fw .flower__light--8 { left:-6vmin; animation-delay:3.5s; }
        .fw .flower__grass {
          --c:#7c15aa; --line-w:1.5vmin;
          position:absolute; bottom:12vmin; left:-7vmin;
          display:flex; flex-direction:column; align-items:flex-end;
          z-index:2;
          transform-origin:bottom center;
          transform:rotate(-48deg) rotateY(40deg);
        }
        .fw .flower__grass--1 { animation: fw-moving-grass 2s linear infinite; }
        .fw .flower__grass--2 {
          left:2vmin; bottom:10vmin;
          transform:scale(0.5) rotate(75deg) rotateX(10deg) rotateY(-200deg);
          opacity:0.8; z-index:0; animation:fw-moving-grass--2 1.5s linear infinite;
        }
        .fw .flower__grass--top { width:7vmin; height:10vmin; border-top-right-radius:100%; border-right:var(--line-w) solid var(--c); transform:rotate(-2deg); }
        .fw .flower__grass--bottom { margin-top:-2px; width:var(--line-w); height:25vmin; background-image:linear-gradient(to top,transparent,var(--c)); }
        .fw .flower__grass__leaf {
          --size:10vmin; position:absolute;
          width:calc(var(--size)*2.1); height:var(--size);
          border-top-left-radius:var(--size); border-top-right-radius:var(--size);
          background-image:linear-gradient(to top,transparent,transparent 30%,var(--c)); z-index:100;
        }
        .fw .flower__grass__leaf--1{top:-6%;left:30%;--size:6vmin;transform:rotate(-20deg);animation:fw-gg1 2s 2.6s backwards;}
        .fw .flower__grass__leaf--2{top:-5%;left:-110%;--size:6vmin;transform:rotate(10deg);animation:fw-gg2 2s 2.4s linear backwards;}
        .fw .flower__grass__leaf--3{top:5%;left:60%;--size:8vmin;transform:rotate(-18deg) rotateX(-20deg);animation:fw-gg3 2s 2.2s linear backwards;}
        .fw .flower__grass__leaf--4{top:6%;left:-135%;--size:8vmin;transform:rotate(2deg);animation:fw-gg4 2s 2s linear backwards;}
        .fw .flower__grass__leaf--5{top:20%;left:60%;--size:10vmin;transform:rotate(-24deg) rotateX(-20deg);animation:fw-gg5 2s 1.8s linear backwards;}
        .fw .flower__grass__leaf--6{top:22%;left:-180%;--size:10vmin;transform:rotate(10deg);animation:fw-gg6 2s 1.6s linear backwards;}
        .fw .flower__grass__leaf--7{top:39%;left:70%;--size:10vmin;transform:rotate(-10deg);animation:fw-gg7 2s 1.4s linear backwards;}
        .fw .flower__grass__leaf--8{top:40%;left:-215%;--size:11vmin;transform:rotate(10deg);animation:fw-gg8 2s 1.2s linear backwards;}
        .fw .flower__grass__overlay { position:absolute; top:-10%; right:0%; width:100%; height:100%; background-color:rgba(0,0,0,0.6); filter:blur(1.5vmin); z-index:100; }
        .fw .flower__g-long {
          --w:2vmin;--h:6vmin;--c:#7c15aa;
          position:absolute; bottom:10vmin; left:-3vmin;
          transform-origin:bottom center; transform:rotate(-30deg) rotateY(-20deg);
          display:flex; flex-direction:column; align-items:flex-end;
          animation:fw-g-long 3s linear infinite;
        }
        .fw .flower__g-long__top { width:calc(var(--w)+1vmin);height:var(--h);border-top-right-radius:100%;border-right:0.7vmin solid var(--c);transform:translate(-0.7vmin,1vmin); }
        .fw .flower__g-long__bottom { width:var(--w);height:50vmin;transform-origin:bottom center;background-image:linear-gradient(to top,transparent 30%,var(--c));box-shadow:inset 0 0 2px rgba(0,0,0,0.5);clip-path:polygon(35% 0,65% 1%,100% 100%,0% 100%); }
        .fw .flower__g-right { position:absolute;bottom:6vmin;left:-2vmin;transform-origin:bottom left;transform:rotate(20deg); }
        .fw .flower__g-right .leaf { width:30vmin;height:50vmin;border-top-left-radius:100%;border-left:2vmin solid #6600aa;background-image:linear-gradient(to bottom,transparent,var(--dark-color) 60%);-webkit-mask-image:linear-gradient(to top,transparent 30%,#6600aa 60%); }
        .fw .flower__g-right--1 { animation:fw-g-right-1 2.5s linear infinite; }
        .fw .flower__g-right--2 { left:5vmin;transform:rotateY(-180deg);animation:fw-g-right-2 3s linear infinite; }
        .fw .flower__g-right--2 .leaf { height:75vmin;filter:blur(0.3vmin);opacity:0.8; }
        .fw .flower__g-front { position:absolute;bottom:6vmin;left:2.5vmin;z-index:100;transform-origin:bottom center;transform:rotate(-28deg) rotateY(30deg) scale(1.04);animation:fw-g-front 2s linear infinite; }
        .fw .flower__g-front__line { width:0.3vmin;height:20vmin;background-image:linear-gradient(to top,transparent,#6600aa,transparent 100%);position:relative; }
        .fw .flower__g-front__leaf-wrapper { position:absolute;top:0;left:0;transform-origin:bottom left;transform:rotate(10deg); }
        .fw .flower__g-front__leaf-wrapper:nth-child(even) { left:0;transform:rotateY(-180deg) rotate(5deg);animation:fw-gfl-left 1s ease-in backwards; }
        .fw .flower__g-front__leaf-wrapper:nth-child(odd) { animation:fw-gfl-right 1s ease-in backwards; }
        .fw .flower__g-front__leaf-wrapper--1{top:-8vmin;transform:scale(0.7);animation:fw-gfl-right 1s 5.5s ease-in backwards !important;}
        .fw .flower__g-front__leaf-wrapper--2{top:-8vmin;transform:rotateY(-180deg) scale(0.7) !important;animation:fw-gfl-left2 1s 5.2s ease-in backwards !important;}
        .fw .flower__g-front__leaf-wrapper--3{top:-3vmin;animation:fw-gfl-right 1s 4.9s ease-in backwards !important;}
        .fw .flower__g-front__leaf-wrapper--4{top:-3vmin;transform:rotateY(-180deg) scale(0.9) !important;animation:fw-gfl-left2 1s 4.6s ease-in backwards !important;}
        .fw .flower__g-front__leaf-wrapper--5,.fw .flower__g-front__leaf-wrapper--6{top:2vmin;}
        .fw .flower__g-front__leaf-wrapper--7,.fw .flower__g-front__leaf-wrapper--8{top:6.5vmin;}
        .fw .flower__g-front__leaf-wrapper--5{animation-delay:4.3s !important;}
        .fw .flower__g-front__leaf-wrapper--6{animation-delay:4.1s !important;}
        .fw .flower__g-front__leaf-wrapper--7{animation-delay:3.8s !important;}
        .fw .flower__g-front__leaf-wrapper--8{animation-delay:3.5s !important;}
        .fw .flower__g-front__leaf { width:10vmin;height:10vmin;border-radius:100% 0% 0% 100%/100% 100% 0% 0%;box-shadow:inset 0 2px 1vmin rgba(180,44,252,0.2);background-image:linear-gradient(to bottom left,transparent,var(--dark-color)),linear-gradient(to bottom right,#7c15aa 50%,transparent 50%);-webkit-mask-image:linear-gradient(135deg,#7c15aa 40%,transparent 50%);mask-image:linear-gradient(to bottom right,#7c15aa 50%,transparent 50%); }
        .fw .flower__g-fr { position:absolute;bottom:-4vmin;left:0;transform-origin:bottom left;z-index:10;animation:fw-g-fr 2s linear infinite; }
        .fw .flower__g-fr .leaf { width:30vmin;height:50vmin;border-top-left-radius:100%;border-left:2vmin solid #6600aa;-webkit-mask-image:linear-gradient(to top,transparent 25%,#6600aa 50%);position:relative;z-index:1; }
        .fw .flower__g-fr__leaf { position:absolute;top:0;left:0;width:10vmin;height:10vmin;border-radius:100% 0% 0% 100%/100% 100% 0% 0%;box-shadow:inset 0 2px 1vmin rgba(180,44,252,0.2);background-image:linear-gradient(to bottom left,transparent,var(--dark-color) 98%),linear-gradient(to bottom right,#cc00ff 45%,transparent 50%);-webkit-mask-image:linear-gradient(135deg,#7c15aa 40%,transparent 50%); }
        .fw .flower__g-fr__leaf--1{left:20vmin;transform:rotate(45deg);animation:fw-frl1 0.5s 5.2s linear backwards;}
        .fw .flower__g-fr__leaf--2{left:12vmin;top:-7vmin;transform:rotate(25deg) rotateY(-180deg);animation:fw-frl6 0.5s 5s linear backwards;}
        .fw .flower__g-fr__leaf--3{left:15vmin;top:6vmin;transform:rotate(55deg);animation:fw-frl5 0.5s 4.8s linear backwards;}
        .fw .flower__g-fr__leaf--4{left:6vmin;top:-2vmin;transform:rotate(25deg) rotateY(-180deg);animation:fw-frl6 0.5s 4.6s linear backwards;}
        .fw .flower__g-fr__leaf--5{left:10vmin;top:14vmin;transform:rotate(55deg);animation:fw-frl5 0.5s 4.4s linear backwards;}
        .fw .flower__g-fr__leaf--6{left:0;top:6vmin;transform:rotate(25deg) rotateY(-180deg);animation:fw-frl6 0.5s 4.2s linear backwards;}
        .fw .flower__g-fr__leaf--7{left:5vmin;top:22vmin;transform:rotate(45deg);animation:fw-frl7 0.5s 4s linear backwards;}
        .fw .flower__g-fr__leaf--8{left:-4vmin;top:15vmin;transform:rotate(15deg) rotateY(-180deg);animation:fw-frl8 0.5s 3.8s linear backwards;}
        .fw .long-g{position:absolute;bottom:25vmin;left:-42vmin;transform-origin:bottom left;}
        .fw .long-g--1{bottom:0;transform:scale(0.8) rotate(-5deg);}
        .fw .long-g--1 .leaf{-webkit-mask-image:linear-gradient(to top,transparent 40%,#6600aa 80%) !important;}
        .fw .long-g--1 .leaf--1{--w:5vmin;--h:60vmin;left:-2vmin;transform:rotate(3deg) rotateY(-180deg);}
        .fw .long-g--2,.fw .long-g--3{bottom:-3vmin;left:-35vmin;transform-origin:center;transform:scale(0.6) rotateX(60deg);}
        .fw .long-g--2 .leaf,.fw .long-g--3 .leaf{-webkit-mask-image:linear-gradient(to top,transparent 50%,#6600aa 80%) !important;}
        .fw .long-g--2 .leaf--1,.fw .long-g--3 .leaf--1{left:-1vmin;transform:rotateY(-180deg);}
        .fw .long-g--3{left:-17vmin;bottom:0;}
        .fw .long-g--3 .leaf{-webkit-mask-image:linear-gradient(to top,transparent 40%,#6600aa 80%) !important;}
        .fw .long-g--4{left:25vmin;bottom:-3vmin;transform-origin:center;transform:scale(0.6) rotateX(60deg);}
        .fw .long-g--4 .leaf{-webkit-mask-image:linear-gradient(to top,transparent 50%,#6600aa 80%) !important;}
        .fw .long-g--5{left:42vmin;bottom:0;transform:scale(0.8) rotate(2deg);}
        .fw .long-g--6{left:0;bottom:-20vmin;z-index:100;filter:blur(0.3vmin);transform:scale(0.8) rotate(2deg);}
        .fw .long-g--7{left:35vmin;bottom:20vmin;z-index:-1;filter:blur(0.3vmin);transform:scale(0.6) rotate(2deg);opacity:0.7;}
        .fw .long-g .leaf{--w:15vmin;--h:40vmin;--c:#1aaa15;position:absolute;bottom:0;width:var(--w);height:var(--h);border-top-left-radius:100%;border-left:2vmin solid var(--c);-webkit-mask-image:linear-gradient(to top,transparent 20%,var(--dark-color));transform-origin:bottom center;}
        .fw .long-g .leaf--0{left:2vmin;animation:fw-la1 4s linear infinite;}
        .fw .long-g .leaf--1{--w:5vmin;--h:60vmin;animation:fw-la1 4s linear infinite;}
        .fw .long-g .leaf--2{--w:10vmin;--h:40vmin;left:-0.5vmin;bottom:5vmin;transform-origin:bottom left;transform:rotateY(-180deg);animation:fw-la2 3s linear infinite;}
        .fw .long-g .leaf--3{--w:5vmin;--h:30vmin;left:-1vmin;bottom:3.2vmin;transform-origin:bottom left;transform:rotate(-10deg) rotateY(-180deg);animation:fw-la3 3s linear infinite;}
        .fw .grow-ans{animation:fw-grow-ans 2s var(--d) backwards;}
        .fw .growing-grass{animation:fw-gg-ans 1s 2s backwards;}

        @keyframes fw-moving-flower-1{0%,100%{transform:rotate(2deg)}50%{transform:rotate(-2deg)}}
        @keyframes fw-moving-flower-2{0%,100%{transform:rotate(18deg)}50%{transform:rotate(14deg)}}
        @keyframes fw-moving-flower-3{0%,100%{transform:rotate(-18deg)}50%{transform:rotate(-20deg) rotateY(-10deg)}}
        @keyframes fw-blooming-flower{0%{transform:scale(0)}}
        @keyframes fw-grow-flower-tree{0%{height:0;border-radius:1vmin}}
        @keyframes fw-blooming-leaf-right{0%{transform-origin:left;transform:rotate(70deg) rotateY(30deg) scale(0)}}
        @keyframes fw-blooming-leaf-left{0%{transform-origin:right;transform:rotate(-70deg) rotateY(30deg) scale(0)}}
        @keyframes fw-light-ans{0%{opacity:0;transform:translateY(0)}25%{opacity:1;transform:translateY(-5vmin) translateX(-2vmin)}50%{opacity:1;transform:translateY(-15vmin) translateX(2vmin);filter:blur(0.2vmin)}75%{transform:translateY(-20vmin) translateX(-2vmin);filter:blur(0.2vmin)}100%{transform:translateY(-30vmin);opacity:0;filter:blur(1vmin)}}
        @keyframes fw-moving-grass{0%,100%{transform:rotate(-48deg) rotateY(40deg)}50%{transform:rotate(-50deg) rotateY(40deg)}}
        @keyframes fw-moving-grass--2{0%,100%{transform:scale(0.5) rotate(75deg) rotateX(10deg) rotateY(-200deg)}50%{transform:scale(0.5) rotate(79deg) rotateX(10deg) rotateY(-200deg)}}
        @keyframes fw-gg-ans{0%{transform:scale(0)}}
        @keyframes fw-gg1{0%{transform-origin:bottom left;transform:rotate(-20deg) scale(0)}}
        @keyframes fw-gg2{0%{transform-origin:bottom right;transform:rotate(10deg) scale(0)}}
        @keyframes fw-gg3{0%{transform-origin:bottom left;transform:rotate(-18deg) rotateX(-20deg) scale(0)}}
        @keyframes fw-gg4{0%{transform-origin:bottom right;transform:rotate(2deg) scale(0)}}
        @keyframes fw-gg5{0%{transform-origin:bottom left;transform:rotate(-24deg) rotateX(-20deg) scale(0)}}
        @keyframes fw-gg6{0%{transform-origin:bottom right;transform:rotate(10deg) scale(0)}}
        @keyframes fw-gg7{0%{transform-origin:bottom left;transform:rotate(-10deg) scale(0)}}
        @keyframes fw-gg8{0%{transform-origin:bottom right;transform:rotate(10deg) scale(0)}}
        @keyframes fw-g-long{0%,100%{transform:rotate(-30deg) rotateY(-20deg)}50%{transform:rotate(-32deg) rotateY(-20deg)}}
        @keyframes fw-g-right-1{0%,100%{transform:rotate(20deg)}50%{transform:rotate(24deg) rotateX(-20deg)}}
        @keyframes fw-g-right-2{0%,100%{transform:rotateY(-180deg) rotate(0deg) rotateX(-20deg)}50%{transform:rotateY(-180deg) rotate(6deg) rotateX(-20deg)}}
        @keyframes fw-g-front{0%,100%{transform:rotate(-28deg) rotateY(30deg) scale(1.04)}50%{transform:rotate(-35deg) rotateY(40deg) scale(1.04)}}
        @keyframes fw-gfl-right{0%{transform:rotate(10deg) scale(0)}}
        @keyframes fw-gfl-left{0%{transform:rotateY(-180deg) rotate(5deg) scale(0)}}
        @keyframes fw-gfl-left2{0%{transform:rotateY(-180deg) scale(0)}}
        @keyframes fw-g-fr{0%,100%{transform:rotate(2deg)}50%{transform:rotate(4deg)}}
        @keyframes fw-frl1{0%{transform-origin:left;transform:rotate(45deg) scale(0)}}
        @keyframes fw-frl5{0%{transform-origin:left;transform:rotate(55deg) scale(0)}}
        @keyframes fw-frl6{0%{transform-origin:right;transform:rotate(25deg) rotateY(-180deg) scale(0)}}
        @keyframes fw-frl7{0%{transform-origin:left;transform:rotate(45deg) scale(0)}}
        @keyframes fw-frl8{0%{transform-origin:right;transform:rotate(15deg) rotateY(-180deg) scale(0)}}
        @keyframes fw-grow-ans{0%{transform:scale(0);opacity:0}}
        @keyframes fw-la1{0%,100%{transform:rotate(-5deg) scale(1)}50%{transform:rotate(5deg) scale(1.1)}}
        @keyframes fw-la2{0%,100%{transform:rotateY(-180deg) rotate(5deg)}50%{transform:rotateY(-180deg) rotate(0deg) scale(1.1)}}
        @keyframes fw-la3{0%,100%{transform:rotate(-10deg) rotateY(-180deg)}50%{transform:rotate(-20deg) rotateY(-180deg)}}
      `}</style>

      <div className="night" />
      <div className="flowers">
        <div className="flower flower--1">
          <div className="flower__leafs flower__leafs--1">
            {[1,2,3,4].map(n=><div key={n} className={`flower__leaf flower__leaf--${n}`}/>)}
            <div className="flower__white-circle"/>
            {[1,2,3,4,5,6,7,8].map(n=><div key={n} className={`flower__light flower__light--${n}`}/>)}
          </div>
          <div className="flower__line">
            {[1,2,3,4,5,6].map(n=><div key={n} className={`flower__line__leaf flower__line__leaf--${n}`}/>)}
          </div>
        </div>
        <div className="flower flower--2">
          <div className="flower__leafs flower__leafs--2">
            {[1,2,3,4].map(n=><div key={n} className={`flower__leaf flower__leaf--${n}`}/>)}
            <div className="flower__white-circle"/>
            {[1,2,3,4,5,6,7,8].map(n=><div key={n} className={`flower__light flower__light--${n}`}/>)}
          </div>
          <div className="flower__line">
            {[1,2,3,4].map(n=><div key={n} className={`flower__line__leaf flower__line__leaf--${n}`}/>)}
          </div>
        </div>
        <div className="flower flower--3">
          <div className="flower__leafs flower__leafs--3">
            {[1,2,3,4].map(n=><div key={n} className={`flower__leaf flower__leaf--${n}`}/>)}
            <div className="flower__white-circle"/>
            {[1,2,3,4,5,6,7,8].map(n=><div key={n} className={`flower__light flower__light--${n}`}/>)}
          </div>
          <div className="flower__line">
            {[1,2,3,4].map(n=><div key={n} className={`flower__line__leaf flower__line__leaf--${n}`}/>)}
          </div>
        </div>
        <div className="grow-ans" style={{'--d':'1.2s'} as React.CSSProperties}>
          <div className="flower__g-long">
            <div className="flower__g-long__top"/><div className="flower__g-long__bottom"/>
          </div>
        </div>
        <div className="growing-grass">
          <div className="flower__grass flower__grass--1">
            <div className="flower__grass--top"/><div className="flower__grass--bottom"/>
            {[1,2,3,4,5,6,7,8].map(n=><div key={n} className={`flower__grass__leaf flower__grass__leaf--${n}`}/>)}
            <div className="flower__grass__overlay"/>
          </div>
        </div>
        <div className="growing-grass">
          <div className="flower__grass flower__grass--2">
            <div className="flower__grass--top"/><div className="flower__grass--bottom"/>
            {[1,2,3,4,5,6,7,8].map(n=><div key={n} className={`flower__grass__leaf flower__grass__leaf--${n}`}/>)}
            <div className="flower__grass__overlay"/>
          </div>
        </div>
        <div className="grow-ans" style={{'--d':'2.4s'} as React.CSSProperties}>
          <div className="flower__g-right flower__g-right--1"><div className="leaf"/></div>
        </div>
        <div className="grow-ans" style={{'--d':'2.8s'} as React.CSSProperties}>
          <div className="flower__g-right flower__g-right--2"><div className="leaf"/></div>
        </div>
        <div className="grow-ans" style={{'--d':'2.8s'} as React.CSSProperties}>
          <div className="flower__g-front">
            {[1,2,3,4,5,6,7,8].map(n=>(
              <div key={n} className={`flower__g-front__leaf-wrapper flower__g-front__leaf-wrapper--${n}`}>
                <div className="flower__g-front__leaf"/>
              </div>
            ))}
            <div className="flower__g-front__line"/>
          </div>
        </div>
        <div className="grow-ans" style={{'--d':'3.2s'} as React.CSSProperties}>
          <div className="flower__g-fr">
            <div className="leaf"/>
            {[1,2,3,4,5,6,7,8].map(n=><div key={n} className={`flower__g-fr__leaf flower__g-fr__leaf--${n}`}/>)}
          </div>
        </div>
        {[
          [['3s','2.2s','3.4s','3.6s'],'long-g--0'],
          [['3.6s','3.8s','4s','4.2s'],'long-g--1'],
          [['4s','4.2s','4.4s','4.6s'],'long-g--2'],
          [['4s','4.2s','3s','3.6s'],  'long-g--3'],
          [['4s','4.2s','3s','3.6s'],  'long-g--4'],
          [['4s','4.2s','3s','3.6s'],  'long-g--5'],
          [['4.2s','4.4s','4.6s','4.8s'],'long-g--6'],
          [['3s','3.2s','3.5s','3.6s'],'long-g--7'],
        ].map(([delays, cls]) => (
          <div key={cls as string} className={`long-g ${cls as string}`}>
            {(delays as string[]).map((d, i) => (
              <div key={i} className="grow-ans" style={{'--d': d} as React.CSSProperties}>
                <div className={`leaf leaf--${i}`}/>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
