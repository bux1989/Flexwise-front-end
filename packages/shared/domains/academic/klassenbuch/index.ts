// Klassenbuch domain exports
// This module provides business logic and utilities for the digital class register (Klassenbuch)

// Core utilities
export * from './utils';
export * from './hooks';
export * from './data';

// Re-export key types for convenience
export type {
  Class,
  Student,
  Lesson,
  StudentStatistics,
  ExcuseInfo
} from './utils';
