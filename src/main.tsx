import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { injectNodeStyles } from './nodes/nodeStyles';

// Inject dynamic node color styles from nodeDefinitions
injectNodeStyles();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
