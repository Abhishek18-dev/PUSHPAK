import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './pages/DashBoard';
import { Toaster } from 'sonner';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('pushpak_authenticated') === 'true';
  });

  const handleUnlock = () => {
    localStorage.setItem('pushpak_authenticated', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('pushpak_authenticated');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <>
        <Toaster theme="dark" position="top-right" />
        <LoginPage onUnlock={handleUnlock} />
      </>
    );
  }

  return (
    <>
      <Toaster theme="dark" position="top-right" />
      <Dashboard onLogout={handleLogout} />
    </>
  );
}