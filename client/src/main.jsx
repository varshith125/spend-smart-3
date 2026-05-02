import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import InstallPrompt from './components/InstallPrompt';
import axios from 'axios';
import App from './App';
import './index.css';

// Configure Axios Base URL for deployment
// In production, this will point to your Render backend URL
// In development, it falls back to empty string (handled by Vite proxy)
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';
axios.defaults.withCredentials = false; // Using JWT in headers instead

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <InstallPrompt />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(15, 12, 41, 0.95)',
              color: '#f8fafc',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.75rem',
              backdropFilter: 'blur(16px)',
              fontSize: '0.875rem',
            },
            success: {
              iconTheme: { primary: '#34d399', secondary: '#f8fafc' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#f8fafc' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
