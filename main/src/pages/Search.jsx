import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ToolCard from '../components/ToolCard';
import './Search.css';
import '../styles/toolCard.css';

// Import images
import openaiImage from '../assets/openai.png';
import claudeImage from '../assets/claude.png';
import geminiImage from '../assets/gemini.png';
import perplexityImage from '../assets/perplexity.png';
import defaultImage from '../assets/default-avatar.png';

// Image mapping object
const toolImages = {
  // OpenAI related tools
  'chatgpt': openaiImage,
  'dall-e': openaiImage,
  'gpt-4': openaiImage,
  'openai': openaiImage,
  
  // Anthropic/Claude related tools
  'claude': claudeImage,
  'anthropic': claudeImage,
  
  // Google/Gemini related tools
  'gemini': geminiImage,
  'bard': geminiImage,
  'google ai': geminiImage,
  
  // Perplexity related tools
  'perplexity': perplexityImage,
  'perplexity ai': perplexityImage,
  
  // Default fallback
  'default': defaultImage
};

function Search() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
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
      navigate('/signin', { state: { from: 'search' } });
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

  const getToolImage = (tool) => {
    const toolId = tool.id.toLowerCase();
    const toolName = tool.name.toLowerCase();
    
    // First try to match by ID
    if (toolImages[toolId]) {
      return toolImages[toolId];
    }
    
    // Then try to match by name
    for (const [key, image] of Object.entries(toolImages)) {
      if (toolName.includes(key)) {
        return image;
      }
    }
    
    // If no match found, use default
    return toolImages['default'];
  };

  const filteredTools = tools.filter(tool => {
    // Filter by search query
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by type
    if (selectedType === 'all') return matchesSearch;
    
    if (!tool.type) return false;
    
    let toolTypes = [];
    if (typeof tool.type === 'string' && tool.type.startsWith('[') && tool.type.endsWith(']')) {
      try {
        toolTypes = JSON.parse(tool.type.replace(/'/g, '"'));
      } catch (e) {
        console.error("Failed to parse tool.type string:", tool.type, e);
        toolTypes = [tool.type];
      }
    } else if (Array.isArray(tool.type)) {
      toolTypes = tool.type;
    } else if (tool.type) {
      toolTypes = [tool.type];
    }
    
    return matchesSearch && toolTypes.some(type => type.toLowerCase() === selectedType.toLowerCase());
  });

  const types = [
    'all',
    'text',
    'code',
    'video',
    'image',
    'sound',
    'music'
  ];

  // Icon mapping for each type
  const typeIcons = {
    all: 'fas fa-th-large',
    text: 'fas fa-font',
    code: 'fas fa-code',
    video: 'fas fa-video',
    image: 'fas fa-image',
    sound: 'fas fa-volume-up',
    music: 'fas fa-music'
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
    <div className="search-page">
      <section className="search-section">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search AI tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </section>

      <section className="filters">
        <div className="filter-section">
          <h3>Categories</h3>
          <div className="type-buttons">
            {types.map(type => (
              <button
                key={type}
                className={`type-button ${selectedType === type ? 'active' : ''}`}
                onClick={() => setSelectedType(type)}
              >
                <i className={typeIcons[type]}></i>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="search-results">
        <h2>Search Results ({filteredTools.length})</h2>
        <div className="tools-grid">
          {filteredTools.length > 0 ? (
            filteredTools.map((tool) => (
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
              <p>No tools found matching your search criteria.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default Search;
