import { useState } from 'react';
// import AuthModal from './AuthModal';

export default function NavBar({onOpenAuth, isLoggedIn, setLoggedIn}) {
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

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (confirmLogout) {
      localStorage.removeItem('token');
      setLoggedIn(false);
      window.location.reload(); // ensures App.jsx shows landing page again
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">InfluxDB No-Code</div>
      <div className="nav-actions">
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? 'Dark' : 'Light'}
        </button>

        {isLoggedIn ? (
          <button className="nav-logout-btn" onClick={handleLogout}>Logout</button>
        ) : (
          <button className="nav-login-btn" onClick={onOpenAuth}>Login</button>
        )}
      </div>
    </nav>
  );
}