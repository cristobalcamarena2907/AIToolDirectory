import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../services/firebase';
import '../styles/auth.css';

function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [userToVerify, setUserToVerify] = useState(null);

  const navigate = useNavigate();

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const signedUser = userCredential.user;

      if (!signedUser.emailVerified) {
        setError('Please verify your email before signing in.');
        setUserToVerify(signedUser);
        setShowResend(true);
        await auth.signOut();
        return;
      }

      navigate('/');
    } catch (err) {
      setError('Invalid email or password.');
      setShowResend(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await sendEmailVerification(userToVerify);
      alert('Verification email resent.');
      setShowResend(false);
    } catch (err) {
      alert('Failed to resend verification email.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign In</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleEmailSignIn}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign In</button>
      </form>

      {showResend && (
        <button type="button" onClick={handleResendVerification}>
          Resend Verification Email
        </button>
      )}

      <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
    </div>
  );
}

export default SignIn;
