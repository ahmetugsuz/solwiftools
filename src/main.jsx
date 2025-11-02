import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Make sure this file exists
import App from './App'; // Ensure this is correctly imported
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter here
import { Toaster } from 'react-hot-toast'; // Import Toaster component

// Polyfills for Solana wallet adapters
import { Buffer } from 'buffer';
window.Buffer = Buffer;
window.global = window;
window.globalThis = window;
window.Request = window.Request || fetch('').constructor; // fallback for Request



const rootElement = document.getElementById('app');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <BrowserRouter>
      <App />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
    </BrowserRouter>
  );
} else {
  console.error('Could not find the DOM element with ID "app"');
}

