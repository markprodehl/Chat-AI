import { useState } from 'react';
import PropTypes from 'prop-types';
import googleIcon from '../../public/google_signin_light.png';
import '../styles.css';

const SignIn = ({ handleSignIn, handleSignInWithEmail, handleSignUpWithEmail }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="signin-container">
      <h1 className="chat-ai-header">Chat AI</h1>
      <div className="signin-form">
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          className="signin-input"
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          className="signin-input"
        />
        <div className="auth-buttons">
          <button onClick={() => handleSignInWithEmail(email, password)} className="signin-btn auth-btn">
            Sign In
          </button>
          <button onClick={() => handleSignUpWithEmail(email, password)} className="signup-btn auth-btn">
            Sign Up
          </button>
        </div>
      </div>
      <button className="google-btn" onClick={handleSignIn}>
        <img className="google-icon" src={googleIcon} alt="Google sign-in" />
      </button>
    </div>
  );
};

SignIn.propTypes = {
  handleSignIn: PropTypes.func.isRequired,
  handleSignInWithEmail: PropTypes.func.isRequired,
  handleSignUpWithEmail: PropTypes.func.isRequired,
};

export default SignIn;

