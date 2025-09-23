export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h3 className="footer-logo">InfluxDB No-Code Interface</h3>
          <p className="footer-text">Manage your data with ease.</p>
        </div>
        <div className="footer-links">
          {/* Use a real link if available, otherwise use a button */}
          <button className="footer-link-btn" type="button" tabIndex={0}>Docs</button>
          <a href="https://github.cs.adelaide.edu.au/a1881053/INFLUX-UI-UG-" target="_blank" rel="noopener noreferrer">GitHub</a>
          <button className="footer-link-btn" type="button" tabIndex={0}>Support</button>
          <button className="footer-link-btn" type="button" tabIndex={0}>Privacy</button>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} InfluxDB No-Code Interface. All rights reserved.</span>
      </div>
    </footer>
  );
}
