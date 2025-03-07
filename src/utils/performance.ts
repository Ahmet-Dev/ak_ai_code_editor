/**
 * Performance optimization utilities for the AI Code Editor
 */

// Debounce function to limit how often a function can be called
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

// Memoize function to cache expensive function results
export function memoize<T extends (...args: any[]) => any>(
  func: T
): T {
  const cache = new Map();
  
  return function(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    
    return result;
  } as T;
}

// Optimize rendering by preventing unnecessary re-renders
export function shouldComponentUpdate(
  prevProps: Record<string, any>,
  nextProps: Record<string, any>,
  propsToCheck: string[]
): boolean {
  for (const prop of propsToCheck) {
    if (prevProps[prop] !== nextProps[prop]) {
      return true;
    }
  }
  return false;
}

// Batch multiple state updates to prevent excessive re-renders
export function batchUpdates(updates: (() => void)[]): void {
  // Use React's unstable_batchedUpdates if available, otherwise just run sequentially
  if (typeof window !== 'undefined' && 'requestAnimationFrame' in window) {
    window.requestAnimationFrame(() => {
      updates.forEach(update => update());
    });
  } else {
    updates.forEach(update => update());
  }
}

// Optimize large lists by implementing virtualization
export function getVisibleItems<T>(
  items: T[],
  startIndex: number,
  endIndex: number
): T[] {
  return items.slice(startIndex, endIndex + 1);
}

// Optimize code parsing and syntax highlighting
export const codeProcessing = {
  // Cache for parsed code
  parsedCodeCache: new Map<string, any>(),
  
  // Parse code with caching
  parseCode(code: string): any {
    if (this.parsedCodeCache.has(code)) {
      return this.parsedCodeCache.get(code);
    }
    
    // Simple parsing for demonstration
    const parsed = {
      lines: code.split('\n'),
      length: code.length,
      tokens: code.split(/\s+/).length
    };
    
    this.parsedCodeCache.set(code, parsed);
    return parsed;
  },
  
  // Clear cache when it gets too large
  clearCacheIfNeeded(): void {
    if (this.parsedCodeCache.size > 100) {
      this.parsedCodeCache.clear();
    }
  }
};