import { useState } from 'react';
import Dashboard from './components/Dashboard';
import FeaturesGrid from './components/FeatureGrid';
import './styles/App.css';
// import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import NavBar from './components/NavBar';
import WelcomeSection from './components/WelcomeSection';

function App() {
  const [isAuthOpen, setAuthOpen] = useState(false);
  return (
    <div className="app-container">
      <NavBar onOpenAuth={() => setAuthOpen(true)} />
      <main className="app-main">
        <WelcomeSection onOpenAuth={() => setAuthOpen(true)}/>
        <FeaturesGrid />
        <Dashboard />
      </main>
      {/* <Footer /> */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setAuthOpen(false)} />
    </div>

  );
}


export default App;
