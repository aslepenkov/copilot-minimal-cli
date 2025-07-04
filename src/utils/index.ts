/**
 * Logger utility for consistent application logging
 */
export const logger = {
  /**
   * Log informational message
   */
  info: (message: string, ...args: any[]): void => {
    console.log(`[INFO] ${message}`, ...args);
  },

  /**
   * Log success message
   */
  success: (message: string, ...args: any[]): void => {
    console.log(`[SUCCESS] ${message}`, ...args);
  },

  /**
   * Log warning message
   */
  warn: (message: string, ...args: any[]): void => {
    console.log(`[WARNING] ${message}`, ...args);
  },

  /**
   * Log error message with optional error details
   */
  error: (message: string, error?: unknown): void => {
    console.error(`[ERROR] ${message}`);
    if (error) {
      if (error instanceof Error) {
        console.error(error.stack || error.message);
      } else {
        console.error(JSON.stringify(error, null, 2));
      }
    }
  },

  /**
   * Log debug message (only in development environment)
   */
  debug: (message: string, ...args: any[]): void => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
};
