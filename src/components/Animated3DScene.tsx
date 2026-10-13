import React, { useState } from 'react';

interface Animated3DSceneProps {
  variant?: 'hero' | 'banner' | 'compact';
  title?: string;
  subtitle?: string;
  badgeText?: string;
}

export const Animated3DScene: React.FC<Animated3DSceneProps> = ({
  variant = 'banner',
  title = '3D Academic & Scientific Holosphere',
  subtitle = 'Interactive 3D spatial geometry — move cursor to tilt perspective',
  badgeText = 'LIVE 3D ENGINE'
}) => {
  const [tilt, setTilt] = useState({ x: -12, y: 18 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      x: Math.round(-relY * 28),
      y: Math.round(relX * 36)
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: -12, y: 18 });
  };

  if (variant === 'compact') {
    return (
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B0E17] via-[#090B12] to-[#121024] border border-white/15 p-4 flex items-center justify-between gap-4 select-none"
      >
        <div className="space-y-1 z-10">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-400/30 text-[10px] font-mono font-bold text-indigo-300 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            {badgeText}
          </span>
          <h4 className="font-display text-sm font-bold text-white">{title}</h4>
          <p className="text-[11px] text-neutral-400">{subtitle}</p>
        </div>

        {/* 3D Rotating Cube + Orbital Rings */}
        <div className="relative w-20 h-20 flex items-center justify-center shrink-0 scene-3d-perspective">
          <div
            className="cube-3d-wrapper"
            style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
            }}
          >
            <div className="cube-3d">
              <div className="cube-face cube-front" />
              <div className="cube-face cube-back" />
              <div className="cube-face cube-right" />
              <div className="cube-face cube-left" />
              <div className="cube-face cube-top" />
              <div className="cube-face cube-bottom" />
            </div>
          </div>
          <div className="orbit-ring-3d orbit-ring-1" />
          <div className="orbit-ring-3d orbit-ring-2" />
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#080B12] via-[#0D1222] to-[#090D18] border border-white/15 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-5 select-none shadow-[0_20px_60px_rgba(0,0,0,0.65)]"
    >
      {/* Ambient 3D Glow Backdrops */}
      <div className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 rounded-full bg-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/15 blur-3xl" />

      <div className="space-y-1.5 z-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/15 text-[10px] font-mono uppercase tracking-widest text-indigo-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {badgeText}
        </div>
        <h3 className="font-display text-base sm:text-lg font-extrabold text-white tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">{subtitle}</p>
      </div>

      {/* Interactive Multi-Object 3D Stage */}
      <div className="flex items-center gap-6 sm:gap-8 z-10 py-1">
        {/* Object 1: 3D Rotating Tesseract Cube */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative w-20 h-20 flex items-center justify-center scene-3d-perspective">
            <div
              className="cube-3d-wrapper"
              style={{
                transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
              }}
            >
              <div className="cube-3d">
                <div className="cube-face cube-front">SSC</div>
                <div className="cube-face cube-back">3D</div>
                <div className="cube-face cube-right">LAB</div>
                <div className="cube-face cube-left">EDU</div>
                <div className="cube-face cube-top" />
                <div className="cube-face cube-bottom" />
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">3D Tesseract</span>
        </div>

        {/* Object 2: 3D Gyroscope Atomic Core */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="relative w-20 h-20 flex items-center justify-center scene-3d-perspective">
            <div
              className="gyro-3d-stage"
              style={{
                transform: `rotateX(${tilt.x * 0.8}deg) rotateY(${tilt.y * 0.8}deg)`
              }}
            >
              <div className="orbit-ring-3d orbit-ring-1" />
              <div className="orbit-ring-3d orbit-ring-2" />
              <div className="orbit-ring-3d orbit-ring-3" />
              <div className="core-sphere-3d" />
            </div>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">3D Gyro Core</span>
        </div>

        {/* Object 3: 3D Floating Octahedron / Prism */}
        <div className="hidden sm:flex flex-col items-center gap-1.5">
          <div className="relative w-20 h-20 flex items-center justify-center scene-3d-perspective">
            <div
              className="prism-3d-stage"
              style={{
                transform: `rotateX(${tilt.x}deg) rotateY(${-tilt.y}deg)`
              }}
            >
              <div className="prism-3d">
                <div className="prism-ring prism-ring-a" />
                <div className="prism-ring prism-ring-b" />
                <div className="prism-ring prism-ring-c" />
                <div className="prism-diamond" />
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono text-neutral-400">3D Quantum Node</span>
        </div>
      </div>
    </div>
  );
};
