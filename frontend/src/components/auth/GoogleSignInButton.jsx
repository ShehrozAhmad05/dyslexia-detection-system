import { GoogleLogin } from '@react-oauth/google';

function GoogleSignInButton({ onSuccess, onError }) {
  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        if (credentialResponse.credential) {
          onSuccess(credentialResponse.credential);
        } else if (onError) {
          onError('No credential received');
        }
      }}
      onError={() => {
        if (onError) onError('Google sign-in failed');
      }}
      useOneTap={false}
      theme="outline"
      size="large"
      width="100%"
      text="signin_with"
      shape="rectangular"
    />
  );
}

export default GoogleSignInButton;
