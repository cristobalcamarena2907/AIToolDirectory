import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, app } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import defaultAvatar from '../assets/default-avatar.png';
import './Profile.css';
import '../styles/toolCard.css';
import ToolCard from '../components/ToolCard';

function Profile() {
  const [favoriteTools, setFavoriteTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [ratings, setRatings] = useState({});
  const { user } = useAuth();
  const storage = getStorage(app);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchFavoriteTools();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
        setBio(userDoc.data().bio || '');
      } else {
        const newUserData = {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          bio: '',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', user.uid), newUserData);
        setUserData(newUserData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const imageRef = ref(storage, `profile_images/${user.uid}`);
      await uploadBytes(imageRef, file);
      const photoURL = await getDownloadURL(imageRef);

      await updateProfile(user, { photoURL });

      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        photoURL
      }, { merge: true });

      setUserData(prev => ({ ...prev, photoURL }));
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile photo:', error);
      alert('Failed to update profile photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveBio = async () => {
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        bio: bio
      }, { merge: true });
      setIsEditingBio(false);
      setUserData(prev => ({ ...prev, bio }));
    } catch (error) {
      console.error('Error saving bio:', error);
    }
  };

  const fetchFavoriteTools = async () => {
    try {
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', user.uid)
      );
      const favoritesSnapshot = await getDocs(favoritesQuery);
      const favoriteIds = favoritesSnapshot.docs.map(doc => doc.data().toolId);

      const tools = [];
      for (const toolId of favoriteIds) {
        const toolDoc = await getDoc(doc(db, 'AITools', toolId));
        if (toolDoc.exists()) {
          tools.push({ id: toolDoc.id, ...toolDoc.data() });
        }
      }
      setFavoriteTools(tools);
      fetchRatingsForTools(tools);
    } catch (error) {
      console.error('Error fetching favorite tools:', error);
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

  const handleFavoriteClick = async (toolId) => {
    try {
      const favoriteRef = doc(db, 'favorites', `${user.uid}_${toolId}`);
      await deleteDoc(favoriteRef);
      setFavoriteTools(prev => prev.filter(tool => tool.id !== toolId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  if (!user) {
    navigate('/signin', { state: { from: 'profile' } });
    return null;
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading your favorites...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-avatar-container">
            <img 
              src={userData?.photoURL || user?.photoURL || defaultAvatar} 
              alt={user?.displayName || 'Profile'} 
              className="profile-avatar"
            />
            <label htmlFor="profile-photo" className="change-photo-button">
              {isUploadingPhoto ? (
                <div className="spinner"></div>
              ) : (
                <i className="fas fa-camera"></i>
              )}
            </label>
            <input
              type="file"
              id="profile-photo"
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
            {uploadSuccess && (
              <p style={{ color: 'green', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Profile photo updated successfully ✅
              </p>
            )}
          </div>
          <div className="profile-details">
            <h1>{user.displayName}</h1>
            <p className="email">{user.email}</p>
            <div className="bio-section">
              {isEditingBio ? (
                <div className="bio-edit">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write something about yourself..."
                    maxLength={500}
                  />
                  <div className="bio-actions">
                    <button onClick={handleSaveBio} className="save-button">Save</button>
                    <button onClick={() => setIsEditingBio(false)} className="cancel-button">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="bio-display">
                  <p className="bio-text">{bio || 'No bio yet. Click edit to add one!'}</p>
                  <button onClick={() => setIsEditingBio(true)} className="edit-button">
                    <i className="fas fa-pen"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <section className="favorite-tools">
          <h2>Favorite Tools</h2>
          <div className="favorites-grid">
            {favoriteTools.length > 0 ? (
              favoriteTools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  avgRating={ratings[tool.id] || 0}
                  onFavoriteClick={handleFavoriteClick}
                  isFavorite={true}
                />
              ))
            ) : (
              <div className="no-favorites">
                <p>You haven't added any tools to your favorites yet.</p>
                <button 
                  onClick={() => navigate('/')}
                  className="browse-button"
                >
                  Browse Tools
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Profile;
