import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './ToolDetail.css';
import { getToolImage } from '../components/ToolCard';

function ToolDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviews, setReviews] = useState([]);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

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
            image: getToolImage({ id: id, name: toolData.name })
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

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('toolId', '==', id),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(reviewsQuery);
        const reviewsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReviews(reviewsData);
        // Calcular promedio
        if (reviewsData.length > 0) {
          const total = reviewsData.reduce((sum, review) => sum + review.rating, 0);
          setAverageRating(total / reviewsData.length);
        } else {
          setAverageRating(0);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchReviews();
  }, [id]);

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

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/signin');
      return;
    }

    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      const reviewRef = doc(collection(db, 'reviews'));
      await setDoc(reviewRef, {
        toolId: id,
        userId: user.uid,
        userEmail: user.email,
        rating,
        comment,
        createdAt: new Date().toISOString()
      });

      // Refresh reviews
      const reviewsQuery = query(
        collection(db, 'reviews'),
        where('toolId', '==', id),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(reviewsQuery);
      const reviewsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReviews(reviewsData);

      // Reset form
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting review:', error);
    }
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
      <div className="tool-detail-columns">
        <div className="tool-detail-card-col">
          <div className="tool-detail-card">
            <div className="tool-header">
              <h1>{tool.name}</h1>
            </div>
            <div className="tool-detail-image">
              <img src={getToolImage({ id: tool.id, name: tool.name })} alt={tool.name} />
            </div>
            <div className="tool-content">
              <p className="description">{tool.description}</p>
              
              {/* Rating Display */}
              <div className="tool-rating">
                {[...Array(5)].map((_, i) => {
                  const diff = averageRating - i;
                  if (diff >= 1) {
                    return (
                      <i
                        key={i}
                        className="fas fa-star active"
                        style={{ color: 'var(--primary-color)', fontSize: '1rem' }}
                      />
                    );
                  } else if (diff >= 0.5) {
                    return (
                      <i
                        key={i}
                        className="fas fa-star-half-alt active"
                        style={{ color: 'var(--primary-color)', fontSize: '1rem' }}
                      />
                    );
                  } else {
                    return (
                      <i
                        key={i}
                        className="fas fa-star"
                        style={{ color: 'var(--border-color)', fontSize: '1rem' }}
                      />
                    );
                  }
                })}
                <span className="tool-rating-value">
                  {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
                </span>
              </div>

              {/* Pricing Badge */}
              <div className="tool-pricing">
                {(tool.isFree === true || tool.isFree === 'true' || tool.free === true || tool.free === 'true') ? (
                  <span className="pricing-badge free">
                    <i className="fas fa-gift"></i>
                    Free
                  </span>
                ) : (
                  <span className="pricing-badge paid">
                    <i className="fas fa-dollar-sign"></i>
                    Paid
                  </span>
                )}
              </div>

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
        </div>
        <div className="reviews-section-col">
          <div className="reviews-section">
            <h2>Reviews & Ratings</h2>
            <div className="average-rating">
              <div className="rating-stars">
                {[...Array(5)].map((_, index) => {
                  const diff = averageRating - index;
                  if (diff >= 1) {
                    return <i key={index} className="fas fa-star active" />;
                  } else if (diff >= 0.5) {
                    return <i key={index} className="fas fa-star-half-alt active" />;
                  } else {
                    return <i key={index} className="fas fa-star" />;
                  }
                })}
              </div>
              <span className="rating-value">{averageRating.toFixed(1)}</span>
              <span className="rating-count">({reviews.length} reviews)</span>
            </div>
            {user ? (
              <form onSubmit={handleSubmitReview} className="review-form">
                <div className="rating-input">
                  <label>Your Rating:</label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={`fas fa-star ${star <= (hoveredRating || rating) ? 'active' : ''}`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                      />
                    ))}
                  </div>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write your review..."
                  required
                />
                <button type="submit" className="submit-review-button">
                  Submit Review
                </button>
              </form>
            ) : (
              <div className="login-prompt">
                <p>Please <Link to="/signin">sign in</Link> to leave a review</p>
              </div>
            )}
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="review-user">
                      <i className="fas fa-user-circle"></i>
                      <span>{review.userEmail}</span>
                    </div>
                    <div className="review-rating">
                      {[...Array(5)].map((_, index) => (
                        <i
                          key={index}
                          className={`fas fa-star ${index < review.rating ? 'active' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {tool.longDescription && (
        <div className="tool-long-description">
          <h2>About {tool.name}</h2>
          <p>{tool.longDescription}</p>
        </div>
      )}
      <button onClick={() => navigate(-1)} className="back-button">
        <i className="fas fa-arrow-left"></i>
        Back
      </button>
    </div>
  );
}

export default ToolDetail; 