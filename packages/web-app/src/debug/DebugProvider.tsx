import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DebugContextType } from './types';

const DebugContext = createContext<DebugContextType | undefined>(undefined);

const DEBUG_STORAGE_KEY = 'flexwise-debug-mode';
const DEBUG_PASSWORD = import.meta.env.VITE_DEBUG_PASSWORD || 'G:2j5v.M9Q3';

interface DebugProviderProps {
  children: React.ReactNode;
}

export function DebugProvider({ children }: DebugProviderProps) {
  const [isDebugMode, setIsDebugMode] = useState<boolean>(() => {
    // Initialize from localStorage
    try {
      const stored = localStorage.getItem(DEBUG_STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Persist debug mode to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(DEBUG_STORAGE_KEY, isDebugMode.toString());
    } catch {
      // Ignore localStorage errors
    }
  }, [isDebugMode]);

  // Key combination listener (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        if (isDebugMode) {
          // If already in debug mode, toggle off
          exitDebugMode();
        } else {
          // If not in debug mode, show password modal
          setShowPasswordModal(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDebugMode]);

  const verifyPassword = useCallback((password: string): boolean => {
    return password === DEBUG_PASSWORD;
  }, []);

  const enterDebugMode = useCallback(() => {
    setIsDebugMode(true);
    setShowPasswordModal(false);
  }, []);

  const exitDebugMode = useCallback(() => {
    setIsDebugMode(false);
    setShowPasswordModal(false);
  }, []);

  const toggleDebugMode = useCallback(() => {
    if (isDebugMode) {
      exitDebugMode();
    } else {
      setShowPasswordModal(true);
    }
  }, [isDebugMode, exitDebugMode]);

  const value: DebugContextType = {
    isDebugMode,
    toggleDebugMode,
    enterDebugMode,
    exitDebugMode,
    showPasswordModal,
    setShowPasswordModal,
    verifyPassword,
  };

  return (
    <DebugContext.Provider value={value}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug(): DebugContextType {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
}

// Helper hook for components to get their debug ID
export function useDebugId(componentName: string): string {
  const { generateDebugId } = require('./debugIds');
  return generateDebugId(componentName);
}
