import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';

const titleFont = '"Comic Sans MS", "Chalkboard SE", "Baloo 2", sans-serif';
const contentFont = '"Comic Sans MS", "Chalkboard SE", "Nunito", sans-serif';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const overlayRoutes = ['/', '/login', '/register', '/dashboard', '/assessment/handwriting', '/assessment/keystroke', '/memory-test', '/memory/sequence', '/memory/word'];
  const isHandwritingResults = location.pathname.startsWith('/assessment/handwriting/results');
  const isHandwritingInstructions = location.pathname.startsWith('/assessment/instructions/handwriting');
  const isKeystrokeResults = location.pathname.startsWith('/assessment/keystroke/results');
  const isOverlayPage = overlayRoutes.includes(location.pathname) || isHandwritingResults || isHandwritingInstructions || isKeystrokeResults;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <AppBar
      position={isOverlayPage ? 'absolute' : 'relative'}
      elevation={0}
      sx={{
        bgcolor: '#d7dce0ff',
        mx: { xs: 1.2, sm: 2, md: 3 },
        mt: { xs: 2, sm: 2.4, md: 2.8 },
        width: {
          xs: 'calc(100% - 19.2px)',
          sm: 'calc(100% - 32px)',
          md: 'calc(100% - 48px)'
        },
        left: isOverlayPage ? 0 : 'auto',
        borderRadius: '999px',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.12)',
        backdropFilter: isOverlayPage ? 'blur(4px)' : 'none',
        zIndex: 1200
      }}
    >
      <Container
        maxWidth={false}
        disableGutters
        sx={{ px: { xs: 1.25, sm: 2, md: 2.6 } }}
      >
        <Toolbar disableGutters sx={{ minHeight: 74 }}>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: '#111111',
              fontWeight: 800,
              fontFamily: titleFont,
              letterSpacing: 0.2,
              fontSize: { xs: '1.04rem', sm: '1.18rem', md: '1.25rem' }
            }}
          >
            Dyslexia Detection System
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.1, alignItems: 'center', ml: 'auto' }}>
            {isAuthenticated ? (
              <>
                <Typography variant="body2" sx={{ mr: 0.6, color: '#111111', fontFamily: contentFont, fontWeight: 700 }}>
                  Hello, {user?.name}
                </Typography>
                <Button
                  component={Link}
                  to="/dashboard"
                  variant="contained"
                  sx={{
                    borderRadius: '999px',
                    textTransform: 'none',
                    bgcolor: 'rgba(255,255,255,0.65)',
                    color: '#111111',
                    fontWeight: 700,
                    fontFamily: contentFont,
                    px: 2,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.78)' }
                  }}
                >
                  Dashboard
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outlined"
                  sx={{
                    borderRadius: '999px',
                    borderColor: 'rgba(0,0,0,0.45)',
                    color: '#111111',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontFamily: contentFont,
                    px: 2,
                    '&:hover': { borderColor: '#111111', backgroundColor: 'rgba(255,255,255,0.24)' }
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  sx={{
                    borderRadius: '999px',
                    borderColor: 'rgba(0,0,0,0.45)',
                    color: '#111111',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontFamily: contentFont,
                    px: 2.2,
                    '&:hover': { borderColor: '#111111', backgroundColor: 'rgba(255,255,255,0.24)' }
                  }}
                >
                  Sign In
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  variant="contained"
                  sx={{
                    borderRadius: '999px',
                    textTransform: 'none',
                    bgcolor: 'rgba(255,255,255,0.65)',
                    color: '#111111',
                    fontWeight: 700,
                    fontFamily: contentFont,
                    px: 2.2,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.78)' }
                  }}
                >
                  Create Account
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
