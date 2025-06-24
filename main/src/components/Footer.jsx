// Footer.jsx
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>AI Tools Hub</h4>
          <p>Discover and explore the best AI tools for your needs.</p>
        </div>
        <div className="footer-section">
          <h5>Quick Links</h5>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/search">Search</Link></li>
            <li><Link to="/profile">Profile</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h5>Categories</h5>
          <ul>
            <li><Link to="/search?type=ai">AI & ML</Link></li>
            <li><Link to="/search?type=productivity">Productivity</Link></li>
            <li><Link to="/search?type=development">Development</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h5>Contact</h5>
          <ul>
            <li><a href="mailto:contact@aitoolshub.com">cristobalcamher@gmail.com</a></li>
            <li><a href="https://twitter.com/aitoolshub" target="_blank" rel="noopener noreferrer">Instagram</a></li>
            <li><a href="https://github.com/aitoolshub" target="_blank" rel="noopener noreferrer">GitHub</a></li>
          </ul>
        </div>
      </div>
      <div className="copyright">
        <p>© {new Date().getFullYear()} AI Tools Hub</p>
      </div>
    </footer>
  );
};

export default Footer; 