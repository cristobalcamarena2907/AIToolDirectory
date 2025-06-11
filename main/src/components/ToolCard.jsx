import { Link } from 'react-router-dom';
import { useState } from 'react';
import './ToolCard.css';

// Import images
import openaiImage from '../assets/openai.png';
import claudeImage from '../assets/claude.png';
import geminiImage from '../assets/gemini.png';
import perplexityImage from '../assets/perplexity.png';
import defaultImage from '../assets/default-avatar.png';

// Image mapping object
const toolImages = {
  'openai': openaiImage,
  'claude': claudeImage,
  'gemini': geminiImage,
  'perplexity': perplexityImage,
  'default': defaultImage
};

function ToolCard({ tool, onFavoriteClick, isFavorite, showActions = true }) {
  const [isHovered, setIsHovered] = useState(false);

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

  return (
    <div 
      className="tool-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/tool/${tool.id}`} className="tool-card-link">
        <div className="tool-image">
          <img src={getToolImage(tool)} alt={tool.name} />
        </div>
        <div className="tool-info">
          <h3>{tool.name}</h3>
          <p>{tool.description}</p>
        </div>
      </Link>
      {showActions && (
        <div className="tool-actions">
          <button 
            onClick={(e) => { 
              e.preventDefault();
              window.open(tool.url, '_blank', 'noopener noreferrer'); 
            }} 
            className="visit-button"
          >
            Visit Tool
          </button>
          <button
            onClick={(e) => { 
              e.preventDefault();
              onFavoriteClick(tool.id);
            }}
            className={`favorite-button ${isFavorite ? 'favorited' : ''}`}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <i className={`${isFavorite ? 'fas' : 'far'} fa-star`}></i>
          </button>
        </div>
      )}
    </div>
  );
}

export default ToolCard; 