import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then((reg) => {
    console.log('ServiceWorker registration successful');
  }).catch(error => {
    alert('Debug: SW Registration Failed: ' + error.message);
    console.error('ServiceWorker registration failed: ', error);
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
