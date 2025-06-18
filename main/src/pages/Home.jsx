import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ToolCard from '../components/ToolCard';
import './Home.css';

function Home() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [ratings, setRatings] = useState({}); // { toolId: avgRating }
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTools();
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchTools = async () => {
    try {
      const toolsCollection = collection(db, 'AITools');
      const toolsSnapshot = await getDocs(toolsCollection);
      const toolsList = toolsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTools(toolsList);
      fetchRatingsForTools(toolsList);
    } catch (error) {
      console.error('Error fetching tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRatingsForTools = async (toolsList) => {
    const ratingsObj = {};
    for (const tool of toolsList) {
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('toolId', '==', tool.id)
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviews = reviewsSnapshot.docs.map(doc => doc.data());
      if (reviews.length > 0) {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        ratingsObj[tool.id] = avg;
      } else {
        ratingsObj[tool.id] = 0;
      }
    }
    setRatings(ratingsObj);
  };

  const fetchFavorites = async () => {
    try {
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', user.uid)
      );
      const favoritesSnapshot = await getDocs(favoritesQuery);
      const favoriteIds = favoritesSnapshot.docs.map(doc => doc.data().toolId);
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleFavoriteClick = async (toolId) => {
    if (!user) {
      navigate('/signin', { state: { from: 'home' } });
      return;
    }

    try {
      const favoriteRef = doc(db, 'favorites', `${user.uid}_${toolId}`);
      const favoriteDoc = await getDoc(favoriteRef);

      if (favoriteDoc.exists()) {
        await deleteDoc(favoriteRef);
        setFavorites(prev => prev.filter(id => id !== toolId));
      } else {
        await setDoc(favoriteRef, {
          userId: user.uid,
          toolId: toolId,
          createdAt: new Date().toISOString()
        });
        setFavorites(prev => [...prev, toolId]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading AI tools...</p>
      </div>
    );
  }

  return (
    <div className="home">
      {/* MODERN HERO */}
      <section className="hero modern-hero">
        <div className="hero-content">
          <h1>Discover the Best AI Tools</h1>
          <p>Explore our curated collection of powerful artificial intelligence tools to boost your productivity and creativity.</p>
          <button className="cta-button">Explore Tools</button>
        </div>
      </section>

      {/* ANIMATED STATS */}
      <section className="stats-section">
        <div className="stat-card glass">
          <span className="stat-number">{tools.length}</span>
          <span className="stat-label">Tools</span>
        </div>
        <div className="stat-card glass">
          <span className="stat-number">+1000</span>
          <span className="stat-label">Users</span>
        </div>
        <div className="stat-card glass">
          <span className="stat-number">+300</span>
          <span className="stat-label">Reviews</span>
        </div>
      </section>

      {/* AI BENEFITS SECTION */}
      <section className="benefits-section glass">
        <h2>Why use AI tools?</h2>
        <div className="benefits-list">
          <div className="benefit-item">
            <i className="fas fa-bolt"></i>
            <h3>Automate tasks</h3>
            <p>Save time and effort by letting AI handle repetitive tasks for you.</p>
          </div>
          <div className="benefit-item">
            <i className="fas fa-brain"></i>
            <h3>Boost your creativity</h3>
            <p>Generate ideas, texts, images, and more with the help of advanced models.</p>
          </div>
          <div className="benefit-item">
            <i className="fas fa-chart-line"></i>
            <h3>Increase productivity</h3>
            <p>Optimize your workflows and make better decisions with intelligent insights.</p>
          </div>
        </div>
      </section>

      {/* FEATURED TOOLS */}
      <section className="featured-tools">
        <h2>Featured Tools ({tools.length})</h2>
        <div className="tools-grid">
          {tools.length > 0 ? (
            // Sort by rating and take only the top 3
            tools
              .slice() // Copy to avoid mutating state
              .sort((a, b) => (ratings[b.id] || 0) - (ratings[a.id] || 0))
              .slice(0, 3)
              .map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  avgRating={ratings[tool.id] || 0}
                  onFavoriteClick={handleFavoriteClick}
                  isFavorite={favorites.includes(tool.id)}
                />
              ))
          ) : (
            <div className="no-results">
              <p>No tools available at the moment.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Home; 