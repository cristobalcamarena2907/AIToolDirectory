import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ToolDetail.css';

// Importar imágenes desde assets
import openaiImage from '../assets/openai.png';
import geminiImage from '../assets/gemini.png';
import claudeImage from '../assets/claude.png';
import perplexityImage from '../assets/perplexity.png';

function ToolDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useAuth();

  // Mapeo de nombres de herramientas a sus imágenes
  const toolImages = {
    'openai': openaiImage,
    'gemini': geminiImage,
    'claude': claudeImage,
    'perplexity': perplexityImage
  };

  useEffect(() => {
    const fetchTool = async () => {
      try {
        const toolDocRef = doc(db, 'AITools', id);
        const toolDoc = await getDoc(toolDocRef);

        if (toolDoc.exists()) {
          const toolData = toolDoc.data();
          setTool({ 
            id: toolDoc.id, 
            ...toolData,
            image: toolImages[id] // Usar directamente la imagen del assets
          });
        } else {
          setError('Tool not found.');
        }
      } catch (err) {
        console.error('Error fetching tool:', err);
        setError('Failed to load tool details.');
      } finally {
        setLoading(false);
      }
    };

    fetchTool();
  }, [id]);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (user) {
        try {
          const favoriteRef = doc(db, 'favorites', `${user.uid}_${id}`);
          const favoriteDoc = await getDoc(favoriteRef);
          setIsFavorite(favoriteDoc.exists());
        } catch (error) {
          console.error('Error checking favorite status:', error);
        }
      }
    };

    checkFavoriteStatus();
  }, [user, id]);

  const handleFavoriteClick = async () => {
    if (!user) {
      return;
    }

    try {
      const favoriteRef = doc(db, 'favorites', `${user.uid}_${id}`);
      
      if (isFavorite) {
        await deleteDoc(favoriteRef);
        setIsFavorite(false);
      } else {
        await setDoc(favoriteRef, {
          userId: user.uid,
          toolId: id,
          createdAt: new Date().toISOString()
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const getTypeIcon = (type) => {
    const typeIcons = {
      'Text': 'fa-file-alt',
      'Image': 'fa-image',
      'Video': 'fa-video',
      'Audio': 'fa-music',
      'Code': 'fa-code',
      'Chat': 'fa-comments',
      'Data': 'fa-database',
      'Design': 'fa-paint-brush',
      'Analysis': 'fa-chart-line',
      'Translation': 'fa-language',
      'default': 'fa-magic'
    };
    return typeIcons[type] || typeIcons.default;
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading tool details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message-page">
        <p>{error}</p>
        <Link to="/search" className="browse-button">Back to Search</Link>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="error-message-page">
        <p>No tool data available.</p>
        <Link to="/search" className="browse-button">Back to Search</Link>
      </div>
    );
  }

  return (
    <div className="tool-detail-page">
      <div className="tool-detail-content">
        <div className="tool-detail-card">
          <div className="tool-header">
            <h1>{tool.name}</h1>
          </div>

          <div className="tool-detail-image">
            <img src={toolImages[id]} alt={tool.name} />
          </div>

          <div className="tool-content">
            <p className="description">{tool.description}</p>
            
            {tool.type && Array.isArray(tool.type) && (
              <div className="tool-types">
                {tool.type.map((type, index) => (
                  <span key={index} className="type-tag">
                    <i className={`fas ${getTypeIcon(type)}`}></i>
                    {type}
                  </span>
                ))}
              </div>
            )}

            <div className="detail-actions">
              <a href={tool.url} target="_blank" rel="noopener noreferrer" className="visit-button">
                Visit Tool
              </a>
              {user && (
                <button 
                  onClick={handleFavoriteClick} 
                  className={`visit-button favorite ${isFavorite ? 'active' : ''}`}
                >
                  {isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                </button>
              )}
            </div>
          </div>
        </div>

        {tool.longDescription && (
          <div className="tool-long-description">
            <h2>About {tool.name}</h2>
            <p>{tool.longDescription}</p>
          </div>
        )}
      </div>

      <button onClick={() => navigate(-1)} className="back-button">
        <i className="fas fa-arrow-left"></i>
        Back
      </button>
    </div>
  );
}

export default ToolDetail; 