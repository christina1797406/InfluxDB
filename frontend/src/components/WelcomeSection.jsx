import { useState } from 'react';
import Modal from './Modal/Modal';

export default function WelcomeSection() {

  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <button className="big-login-btn" onClick={() => setIsModalOpen(true)}>Login to Continue</button>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2>Log In / Sign Up</h2>
        <br></br>
        <p>Insert login form here</p>
        <br></br>
        <button className="big-login-btn" onClick={()=> alert('Login submitted!')}>
          Login
        </button>
      </Modal>
    </div>
  );
}
