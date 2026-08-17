import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { fontsReady } from './engine.js';
import { artReady } from './art.js';
import './style.css';

// Canvas has no reflow: a page drawn before the faces and the sticker art
// arrive stays wrong until something repaints it. So wait, then mount.
Promise.all([fontsReady(), artReady()]).then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode><App /></StrictMode>,
  );
});
