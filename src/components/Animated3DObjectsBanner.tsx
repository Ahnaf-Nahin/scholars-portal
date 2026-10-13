import React from 'react';

export interface Floating3DShapesLayerProps {
  variant?: 'student' | 'teacher' | 'login-teacher';
}

export interface Cube3DObjectProps {
  size?: number;
  accent?: 'cyan' | 'purple' | 'emerald' | 'crimson';
  speedSeconds?: number;
  reverse?: boolean;
}

export interface Square3DObjectProps {
  size?: number;
  accent?: 'cyan' | 'purple' | 'emerald' | 'crimson';
  speedSeconds?: number;
}

/**
 * Shapes have been disabled as requested to keep the UI clean,
 * distraction-free, and high-performance.
 */
export const Cube3DObject: React.FC<Cube3DObjectProps> = () => {
  return null;
};

export const Square3DObject: React.FC<Square3DObjectProps> = () => {
  return null;
};

export const Floating3DShapesLayer: React.FC<Floating3DShapesLayerProps> = () => {
  return null;
};

export const Animated3DObjectsBanner: React.FC<{ roleLabel?: string; compact?: boolean }> = () => {
  return null;
};
