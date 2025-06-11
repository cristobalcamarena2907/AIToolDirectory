import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ToolCard from '../components/ToolCard';
import './Home.css';

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

function Home() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
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
    } catch (error) {
      console.error('Error fetching tools:', error);
    } finally {
      setLoading(false);
    }
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
      <section className="hero">
        <h1>Discover the Best AI Tools</h1>
        <p>Explore our curated collection of powerful AI tools to enhance your productivity</p>
      </section>

      <section className="featured-tools">
        <h2>Featured Tools ({tools.length})</h2>
        <div className="tools-grid">
          {tools.length > 0 ? (
            tools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
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