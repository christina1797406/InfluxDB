import { useEffect, useState } from 'react';
// import {BrowserRouter as Router, Routes, Route} from "react-router-dom";
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import FeaturesGrid from './components/FeatureGrid';
import Footer from './components/Footer';
import NavBar from './components/NavBar';
import WelcomeSection from './components/WelcomeSection';
// import ProtectedRoute from './components/protectedRoute';
import './styles/App.css';

function App() {
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [isLoggedIn, setLoggedIn] = useState(false);

  // Check if token exists in localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setLoggedIn(true);
  }, []);

  return (
    <div className="app-container">
      <main className="app-main">
        <NavBar onOpenAuth={() => setAuthOpen(true)} isLoggedIn={isLoggedIn} setLoggedIn={setLoggedIn} />
        {isLoggedIn ? (
          <><Dashboard /></>
        ) : (
          <>
            <WelcomeSection onOpenAuth={() => setAuthOpen(true)} />
            <FeaturesGrid />
          </>
        )}
        <Footer />

        {/* AuthModal only when logged out */}
        {!isLoggedIn && (
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setAuthOpen(false)}
            onLoggedInSuccess={() => {
              setLoggedIn(true);
              setAuthOpen(false);
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;
