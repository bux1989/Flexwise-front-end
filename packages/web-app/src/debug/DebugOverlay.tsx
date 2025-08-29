import React from 'react';
import { useDebug } from './DebugProvider';
import { DebugOverlayProps } from './types';
import { generateDebugId } from './debugIds';

export function DebugOverlay({ id, name, children, className }: DebugOverlayProps) {
  const { isDebugMode } = useDebug();

  // Generate consistent ID if not provided
  const debugId = id || generateDebugId(name);

  if (!isDebugMode) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className || ''}`}>
      {children}
      
      {/* Debug ID overlay */}
      <div
        className="absolute top-0 left-0 pointer-events-none z-[9999]"
        style={{
          fontSize: '8px',
          lineHeight: '12px',
          padding: '1px 3px',
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          color: 'rgba(0, 0, 0, 0.7)',
          fontFamily: 'monospace',
          fontWeight: '400',
          borderRadius: '2px',
          userSelect: 'text',
          cursor: 'text',
        }}
        title={`Debug ID: ${debugId} | Component: ${name}`}
      >
        {debugId}
      </div>
    </div>
  );
}

// Convenience component for wrapping components without affecting layout
export function DebugWrapper({ id, name, children, className }: DebugOverlayProps) {
  return (
    <DebugOverlay id={id} name={name} className={className}>
      {children}
    </DebugOverlay>
  );
}

// Hook for getting debug information without visual overlay
export function useDebugInfo(componentName: string) {
  const { isDebugMode } = useDebug();
  const debugId = generateDebugId(componentName);
  
  return {
    isDebugMode,
    debugId,
    logDebugInfo: () => {
      if (isDebugMode) {
        console.log(`[DEBUG] ${debugId}: ${componentName}`);
      }
    }
  };
}
