/**
 * Security utilities for the AI Code Editor
 */

// Sanitize user input to prevent XSS attacks
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Validate API configuration
export function validateApiConfig(apiUrl: string, apiKey: string): { valid: boolean; error?: string } {
  if (!apiUrl) {
    return { valid: false, error: 'API URL is required' };
  }
  
  try {
    new URL(apiUrl);
  } catch (e) {
    return { valid: false, error: 'Invalid API URL format' };
  }
  
  if (!apiKey) {
    return { valid: false, error: 'API Key is required' };
  }
  
  if (apiKey.length < 8) {
    return { valid: false, error: 'API Key is too short' };
  }
  
  return { valid: true };
}

// Secure storage for sensitive data
export const secureStorage = {
  // Store data with encryption if available
  setItem(key: string, value: string): void {
    try {
      // In a real implementation, we would encrypt this data
      // For now, we'll just use localStorage with a prefix
      localStorage.setItem(`secure_${key}`, value);
    } catch (e) {
      console.error('Error storing secure data:', e);
    }
  },
  
  // Retrieve and decrypt data
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(`secure_${key}`);
    } catch (e) {
      console.error('Error retrieving secure data:', e);
      return null;
    }
  },
  
  // Remove secure data
  removeItem(key: string): void {
    try {
      localStorage.removeItem(`secure_${key}`);
    } catch (e) {
      console.error('Error removing secure data:', e);
    }
  }
};

// Rate limiting for API calls
export class RateLimiter {
  private maxRequests: number;
  private timeWindow: number;
  private requestTimestamps: number[] = [];
  
  constructor(maxRequests: number = 10, timeWindow: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }
  
  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Remove timestamps outside the time window
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.timeWindow
    );
    
    // Check if we're under the limit
    return this.requestTimestamps.length < this.maxRequests;
  }
  
  recordRequest(): void {
    this.requestTimestamps.push(Date.now());
  }
  
  getTimeUntilNextAllowed(): number {
    if (this.canMakeRequest()) {
      return 0;
    }
    
    const now = Date.now();
    const oldestTimestamp = this.requestTimestamps[0];
    return this.timeWindow - (now - oldestTimestamp);
  }
}

// Validate code for potential security issues
export function validateCode(code: string): { safe: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    { pattern: /eval\s*\(/, message: 'Use of eval() can be dangerous' },
    { pattern: /document\.write\s*\(/, message: 'document.write() can be unsafe' },
    { pattern: /innerHTML\s*=/, message: 'Setting innerHTML directly can lead to XSS vulnerabilities' },
    { pattern: /setTimeout\s*\(\s*['"`]/, message: 'Passing strings to setTimeout can be unsafe' },
    { pattern: /setInterval\s*\(\s*['"`]/, message: 'Passing strings to setInterval can be unsafe' },
    { pattern: /new\s+Function\s*\(/, message: 'Creating functions from strings can be unsafe' }
  ];
  
  dangerousPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(code)) {
      warnings.push(message);
    }
  });
  
  return {
    safe: warnings.length === 0,
    warnings
  };
}