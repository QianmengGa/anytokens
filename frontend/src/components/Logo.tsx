import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 32, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="40" r="40" fill="url(#logoGrad)" />
      {/* A - 两条斜线 + 横线，路径绘制 */}
      <path d="M14 58 L27 22 L40 58" stroke="white" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="18.5" y1="44" x2="35.5" y2="44" stroke="white" strokeWidth="4" strokeLinecap="round" />
      {/* T - 横线 + 竖线 */}
      <line x1="45" y1="22" x2="65" y2="22" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="55" y1="22" x2="55" y2="58" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  );
}

export function LogoFull({ size = 32, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoIcon size={size} />
      <span style={{ fontSize: size * 0.5, fontWeight: 600, letterSpacing: '-0.3px', color: 'inherit' }}>
        Any<span style={{ color: '#8b5cf6', fontWeight: 400 }}>tokens</span>
      </span>
    </div>
  );
}

export default LogoIcon;
