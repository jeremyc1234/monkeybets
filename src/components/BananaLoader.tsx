// Create a new file called BananaLoader.tsx
import React from 'react';

export default function BananaLoader() {
    return (
        <div className="min-h-[300px] relative overflow-hidden">
            {[...Array(10)].map((_, i) => (
                <div
                    key={i}
                    className="absolute animate-banana"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: '-50px',
                        animation: `banana ${2 + Math.random() * 3}s linear ${Math.random() * 2}s infinite`,
                    }}
                >
                    🍌
                </div>
            ))}
        </div>
    );
}