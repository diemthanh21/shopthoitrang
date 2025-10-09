import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import 'antd/dist/reset.css';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// console.log('[main] mounting React app');

const rootEl = document.getElementById('root');
if (!rootEl) {
  const warn = document.createElement('div');
  warn.innerText = 'Không tìm thấy #root trong index.html';
  document.body.appendChild(warn);
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);