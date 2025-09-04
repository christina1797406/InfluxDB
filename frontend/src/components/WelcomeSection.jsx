// import { useState } from 'react';

export default function WelcomeSection({onOpenAuth}) {

  // const [isAuthOpen, setAuthOpen] = useState(false);

  return (
    <div className="welcome-section">
      <h1 className="welcome-title">Welcome</h1>
      <p className="welcome-subtitle">
        Simplify your InfluxDB experience with an intuitive visual interface.
        Build queries, create visualisations, and organise your time series data — all without writing code.
      </p>

      <div className="login-prompt">
        <h3>Get Started</h3>
        <p>Sign in with your InfluxDB account to access your data and start building queries visually.</p>
        <button className="big-login-btn" onClick={onOpenAuth}>
          Sign Up / Log In
        </button>
        {/* <AuthModal isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} /> */}
      </div>
    </div>
  );
}
