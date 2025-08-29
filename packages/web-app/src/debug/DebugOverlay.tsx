import React, { useState } from 'react';
import { useDebug } from './DebugProvider';
import { DebugOverlayProps } from './types';
import { generateDebugId } from './debugIds';

export function DebugOverlay({ id, name, children, className }: DebugOverlayProps) {
  const { isDebugMode } = useDebug();
  const [copied, setCopied] = useState(false);

  // Generate consistent ID if not provided
  const debugId = id || generateDebugId(name);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(debugId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000); // Reset after 1 second
    } catch (err) {
      console.error('Failed to copy debug ID:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = debugId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  if (!isDebugMode) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className || ''}`}>
      {children}
      
      {/* Debug ID overlay */}
      <div
        className="absolute top-0 left-0 z-[9999]"
        style={{
          fontSize: '8px',
          lineHeight: '12px',
          padding: '1px 3px',
          backgroundColor: copied ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0, 0, 0, 0.05)',
          color: copied ? 'rgba(34, 197, 94, 0.9)' : 'rgba(0, 0, 0, 0.7)',
          fontFamily: 'monospace',
          fontWeight: '400',
          borderRadius: '2px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          userSelect: 'none',
        }}
        title={`Click to copy: ${debugId} | Component: ${name}`}
        onClick={handleCopyToClipboard}
      >
        {copied ? '✓' : debugId}
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
