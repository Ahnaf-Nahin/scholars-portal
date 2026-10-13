import React from 'react';
import { usePlatform } from '../context/PlatformContext';

export const ScienceFairBar: React.FC = () => {
  return null;
};

export const FloatingToastAndTriggers: React.FC = () => {
  const { toastMessage } = usePlatform();

  if (!toastMessage) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-50 bg-[#0C0C0C] border border-white/25 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 max-w-md animate-fade-in"
    >
      <span className="w-2 h-2 rounded-full bg-white shrink-0" />
      <span className="text-sm font-medium">{toastMessage}</span>
    </div>
  );
};
