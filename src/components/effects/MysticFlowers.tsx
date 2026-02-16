
'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const Sparkle = ({ initialX, duration, delay, size }: { initialX: number; duration: number; delay: number; size: number }) => (
    <motion.div
        className="absolute top-0 bg-white rounded-full pointer-events-none"
        style={{
            left: `${initialX}%`,
            width: size,
            height: size,
            boxShadow: '0 0 5px #ff00ff, 0 0 10px #fff',
        }}
        initial={{ y: '-10vh', scale: 0, opacity: 0 }}
        animate={{ y: '110vh', scale: [0, 1, 0.5], opacity: [0, 1, 0] }}
        transition={{ duration, delay, repeat: Infinity, ease: 'linear' }}
    />
);

const Flower = ({ left, finalHeight, scale, swayDuration, animationDelay }: { left: string; finalHeight: number; scale: number; swayDuration: number; animationDelay: number; }) => {
    return (
        <motion.div
            className="absolute bottom-0 flex flex-col items-center"
            style={{ left, originY: 1 }}
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ duration: 1.5, delay: animationDelay, ease: 'easeOut' }}
        >
            <motion.div
                className="relative"
                style={{ width: 50 * scale, height: 50 * scale }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 1, delay: animationDelay + 1.8, type: 'spring', stiffness: 150, damping: 10 }}
            >
                {/* Petals */}
                {[0, 90, 180, 270].map(rot => (
                    <div
                        key={rot}
                        className="absolute w-full h-full rounded-[50%_50%_0_50%] shadow-[0_0_10px_rgba(255,0,255,0.4)]"
                        style={{
                            background: 'radial-gradient(circle at 30% 30%, #ff4081, #7b1fa2)',
                            transform: `rotate(${rot}deg)`,
                        }}
                    />
                ))}
                {/* Center */}
                <div
                    className="absolute top-1/2 left-1/2 w-[15px] h-[15px] bg-yellow-400 rounded-full shadow-[0_0_10px_#ffeb3b] z-10"
                    style={{ transform: 'translate(-50%, -50%)' }}
                />
            </motion.div>
            {/* Stem */}
            <motion.div
                className="w-1 rounded-full mb-[-2px]"
                style={{ background: 'linear-gradient(to top, #2e003e, #880e4f)' }}
                initial={{ height: 0 }}
                animate={{ height: finalHeight * scale }}
                transition={{ duration: 2, delay: animationDelay, ease: 'easeOut' }}
            >
                {/* Leaves */}
                <motion.div
                    className="absolute w-5 h-10 bg-purple-900 rounded-[0_100%]"
                    style={{ left: -20, bottom: '30%', originX: 0, originY: 1 }}
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: animationDelay + 1.5 }}
                />
                 <motion.div
                    className="absolute w-5 h-10 bg-purple-900 rounded-[100%_0]"
                    style={{ right: -20, bottom: '50%', originX: 1, originY: 1, transform: 'scaleX(-1)' }}
                    initial={{ scale: 0, rotate: 45 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: animationDelay + 1.8 }}
                />
            </motion.div>
        </motion.div>
    );
};


const MysticFlowers = () => {
    const sparkles = useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        initialX: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 3 + 4,
        delay: Math.random() * 5,
    })), []);

    const flowers = [
        { id: 1, left: '50%', finalHeight: 300, scale: 1, swayDuration: 4, animationDelay: 0 },
        { id: 2, left: '20%', finalHeight: 200, scale: 0.8, swayDuration: 5, animationDelay: 0.5 },
        { id: 3, left: '80%', finalHeight: 250, scale: 0.9, swayDuration: 4.5, animationDelay: 0.2 },
    ];

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-[#0d021f] to-[#240b36]">
            <div className="relative w-full h-full">
                {/* Sparkles */}
                {sparkles.map(s => <Sparkle key={s.id} {...s} />)}

                {/* Grass */}
                <motion.div
                    className="absolute bottom-0 w-full h-40 z-10"
                    style={{
                        background: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1440 320\"><path fill=\"%231a0529\" fill-opacity=\"1\" d=\"M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,250.7C960,235,1056,181,1152,165.3C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z\"></path></svg>')",
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'bottom',
                    }}
                    initial={{ y: '100%' }}
                    animate={{ y: '0%' }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                />

                {/* Flowers */}
                {flowers.map(f => (
                    <motion.div
                        key={f.id}
                        className="absolute bottom-0"
                        style={{ left: f.left, transformOrigin: 'bottom center' }}
                        animate={{ rotate: [0, -2, 2, 0] }}
                        transition={{ duration: f.swayDuration, repeat: Infinity, ease: 'easeInOut', delay: f.animationDelay + 2 }}
                    >
                        <Flower {...f} />
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default MysticFlowers;
