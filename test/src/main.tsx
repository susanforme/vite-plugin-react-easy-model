import React from 'react';
import ReactDOM from 'react-dom/client';
import { ModelProvider } from '~react-model';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(
  document.getElementById('root')!,
).render(
  <React.StrictMode>
    <ModelProvider>
      <App />
    </ModelProvider>
  </React.StrictMode>,
);
