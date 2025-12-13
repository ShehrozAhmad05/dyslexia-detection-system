import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <AppBar position="static">
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'bold'
            }}
          >
            Dyslexia Detection System
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {isAuthenticated ? (
              <>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Hello, {user?.name}
                </Typography>
                <Button
                  component={Link}
                  to="/dashboard"
                  color="inherit"
                >
                  Dashboard
                </Button>
                <Button
                  onClick={handleLogout}
                  color="inherit"
                  variant="outlined"
                  sx={{ borderColor: 'white' }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  component={Link}
                  to="/login"
                  color="inherit"
                >
                  Login
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  color="inherit"
                  variant="outlined"
                  sx={{ borderColor: 'white' }}
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;
