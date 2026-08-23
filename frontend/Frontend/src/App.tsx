import React, { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './pages/DashBoard';

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
    return <LoginPage onUnlock={handleUnlock} />;
  }

  return <Dashboard onLogout={handleLogout} />;
}