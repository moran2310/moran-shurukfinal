// Console cleanup utility to suppress specific warnings in production
const originalWarn = console.warn;
const originalError = console.error;

// Patterns to suppress
const suppressPatterns = [
  /React Router Future Flag Warning/,
  /v7_startTransition/,
  /v7_relativeSplatPath/,
  /Download the React DevTools/,
  /WebSocket connection to.*failed/,
  /WebSocket is closed before the connection/,
  /Failed to find a valid digest/,
  /integrity attribute/
];

// Override console.warn
console.warn = function(...args) {
  const message = args[0]?.toString() || '';
  
  // Check if this warning should be suppressed
  const shouldSuppress = suppressPatterns.some(pattern => pattern.test(message));
  
  if (!shouldSuppress) {
    originalWarn.apply(console, args);
  }
};

// Override console.error for specific errors only
console.error = function(...args) {
  const message = args[0]?.toString() || '';
  
  // Only suppress specific WebSocket connection errors, not all errors
  if (message.includes('WebSocket connection to') && message.includes('failed')) {
    return;
  }
  
  originalError.apply(console, args);
};

// Clean up WebSocket errors from window
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message?.includes('WebSocket')) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

const ConsoleCleanup = {};
export default ConsoleCleanup;
