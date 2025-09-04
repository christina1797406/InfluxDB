import { useState } from 'react';
// import AuthModal from './AuthModal';

export default function NavBar({onOpenAuth}) {
  const [theme, setTheme] = useState('dark');
  // const [isAuthOpen, setAuthOpen] = useState(false);

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
      setTheme('light');
    } else {
      document.body.classList.remove('light-mode');
      document.body.classList.add('dark-mode');
      setTheme('dark');
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">InfluxDB No-Code</div>
      <div className="nav-actions">
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? 'Dark' : 'Light'}
        </button>
        <button className="nav-login-btn" onClick={onOpenAuth}>Login</button>
        {/* <AuthModal isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} /> */}
      </div>
    </nav>
  );
}