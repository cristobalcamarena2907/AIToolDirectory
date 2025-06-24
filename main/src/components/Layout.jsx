import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
//import defaultAvatar from '../assets/default-avatar.png';
import './Layout.css';
import Footer from './Footer';

function Layout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Handle AI-pedia logo click
  const handleLogoClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      window.location.reload();
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-left">
            <a href="/" className="nav-logo" onClick={handleLogoClick}>
              AI-pedia
            </a>
          </div>
          <div className="nav-right">
            <Link to="/" className="nav-icon-button" title="Home">
              <i className="fas fa-home"></i>
            </Link>
            <Link to="/search" className="nav-icon-button" title="Search">
              <i className="fas fa-search"></i>
            </Link>
            {user ? (
              <>
                <Link to="/profile" className="nav-icon-button" title="Profile">
                  <i className="fas fa-user"></i>
                </Link>
                <button onClick={handleSignOut} className="nav-icon-button" title="Sign Out">
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </>
            ) : (
              <Link to="/signup" className="nav-icon-button" title="Sign In">
                <i className="fas fa-sign-in-alt"></i>
              </Link>
            )}
          </div>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout; 