import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handlers to catch unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection caught:', event.reason);
  
  // Check if it's a Vite HMR WebSocket error (commonly happens in development)
  if (event.reason && typeof event.reason === 'object') {
    const reasonStr = event.reason.toString ? event.reason.toString() : JSON.stringify(event.reason);
    if (reasonStr.includes('WebSocket') || reasonStr.includes('HMR') || reasonStr.includes('vite') || reasonStr.includes('undefined')) {
      console.warn('Vite HMR WebSocket error (non-critical):', reasonStr);
      event.preventDefault();
      return;
    }
  }
  
  // Check if it's a WebSocket constructor error with undefined URL
  if (event.reason instanceof Error && event.reason.message && event.reason.message.includes('Failed to construct \'WebSocket\'')) {
    console.warn('WebSocket URL construction error (non-critical):', event.reason.message);
    event.preventDefault();
    return;
  }
  
  // For other errors, log but still prevent default
  console.error('Unexpected promise rejection:', event.reason);
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

createRoot(document.getElementById("root")!).render(<App />);
