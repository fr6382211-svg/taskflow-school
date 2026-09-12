import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import RuntimeErrorBoundary from './components/ui/RuntimeErrorBoundary';
import { ToastProvider } from './components/ui/Toast';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root tidak ditemukan.');

createRoot(root).render(
  <StrictMode>
    <RuntimeErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </RuntimeErrorBoundary>
  </StrictMode>
);
