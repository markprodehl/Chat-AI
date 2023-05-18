import googleIcon from '../../public/google_signin_dark.png';
import '../styles.css';
import PropTypes from 'prop-types';

const SignIn = ({ handleSignIn }) => {
  return (
    <div>
      <h1 className="chat-ai-header">Chat AI</h1>
      <button className="google-btn" onClick={handleSignIn}>
        <img className="google-icon" src={googleIcon} alt="Google sign-in" />
      </button>
    </div>
  );
};

SignIn.propTypes = {
  handleSignIn: PropTypes.func.isRequired,
};

export default SignIn;
