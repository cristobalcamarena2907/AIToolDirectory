// src/pages/SignUp.jsx
import { useState } from 'react';
import { auth, db, googleProvider } from '../services/firebase';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/auth.css';

function SignUp() {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', bio: '', email: '', password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleSignUp = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Split the display name into first and last name
      const nameParts = user.displayName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName,
        bio: '',
        email: user.email,
        uid: user.uid,
        photoURL: user.photoURL,
        createdAt: new Date().toISOString()
      });

      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const { firstName, lastName, bio, email, password } = formData;
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{6,}$/;
  
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
  
    if (!passwordRegex.test(password)) {
      setError('Password must contain at least 6 characters, one uppercase letter, one number, and one special character.');
      return;
    }
  
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(res.user, { displayName: `${firstName} ${lastName}` });
  
      await sendEmailVerification(res.user);
  
      await setDoc(doc(db, 'users', res.user.uid), {
        firstName,
        lastName,
        bio,
        email,
        uid: res.user.uid,
        createdAt: new Date().toISOString()
      });
  
      alert('Account created! Please verify your email before signing in.');
      navigate('/signin');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSignUp}>
        <input name="firstName" placeholder="First Name" onChange={handleChange} required />
        <input name="lastName" placeholder="Last Name" onChange={handleChange} required />
        <textarea name="bio" placeholder="Short bio..." onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
        <button type="submit">Sign Up</button>
      </form>
      <div className="divider">
        <span>or</span>
      </div>
      <button 
        type="button" 
        onClick={handleGoogleSignUp}
        className="google-button"
      >
        <img 
          src="https://www.google.com/favicon.ico" 
          alt="Google" 
          className="google-icon"
        />
        Sign up with Google
      </button>
      <p>Already have an account? <Link to="/signin">Sign in</Link></p>
    </div>
  );
}

export default SignUp;
