import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// ✅ Mount React App
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ✅ Register the service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => console.log('✅ Service Worker registered successfully'))
      .catch((err) => console.log('❌ Service Worker registration failed:', err));
  });
}
