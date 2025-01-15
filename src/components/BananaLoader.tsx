import React from 'react';

export default function BananaLoader() {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {[...Array(5)].map((_, i) => ( // Fewer bananas
                <div
                    key={i}
                    className="absolute animate-banana opacity-20"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: '-100px',
                        animation: `banana ${5 + Math.random() * 5}s linear ${Math.random() * 2}s infinite`,
                        fontSize: '4rem', // Larger bananas
                        zIndex: -1, // Ensure bananas stay behind
                    }}
                >
                    🍌
                </div>
            ))}
        </div>
    );
}