/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PlatformProvider, usePlatform } from './context/PlatformContext';
import { LoginModal } from './components/LoginModal';
import { StudentPortal } from './components/StudentPortal';
import { TeacherPortal } from './components/TeacherPortal';
import { ManagementHub } from './components/ManagementHub';
import { BrainifyPlatform } from './components/BrainifyPlatform';
import { ScienceFairBar, FloatingToastAndTriggers } from './components/ScienceFairBar';

const MainSurfaceRouter: React.FC = () => {
  const { surface, isRestoringSession } = usePlatform();

  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mb-3" />
        <p className="font-mono text-xs text-neutral-400">Restoring authenticated session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <ScienceFairBar />
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={surface}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {surface === 'login' && <LoginModal />}
            {surface === 'student' && <StudentPortal />}
            {surface === 'teacher' && <TeacherPortal />}
            {surface === 'leadership' && <ManagementHub />}
            {surface === 'brainify' && <BrainifyPlatform />}
          </motion.div>
        </AnimatePresence>
      </div>
      <FloatingToastAndTriggers />
    </div>
  );
};

import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <PlatformProvider>
        <MainSurfaceRouter />
      </PlatformProvider>
    </ErrorBoundary>
  );
}

