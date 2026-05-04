import { useNavigate } from 'react-router-dom';
import { AccessTime } from '@mui/icons-material';
import { Box, Button, Container, Typography } from '@mui/material';
import keyBackground from '../../assets/keybg2.mp4';
import keyhands from '../../assets/content.png';
import messageIcon from '../../assets/message.png';
import favoriteIcon from '../../assets/favorite.png';

function KeystrokeInstructions() {
  const navigate = useNavigate();

  const instructions = [
    'You will be shown a sentence to type.',
    'Type the sentence as accurately as possible.',
    'Type at your normal pace — do not rush.',
    'Use backspace to correct mistakes if needed.',
    'The test captures your typing rhythm and patterns.',
    'Submit when you have finished typing the sentence.'
  ];

  return (
    <Box sx={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <Box
        component="video"
        src={keyBackground}
        autoPlay
        loop
        muted
        sx={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center bottom',
          filter: 'blur(16px)',
          transform: 'scale(1.05)',
          zIndex: -1
        }}
      />
      <Box
        component="video"
        src={keyBackground}
        autoPlay
        loop
        muted
        sx={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center bottom',
          zIndex: -1
        }}
      />

      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          overflow: 'hidden',
          pt: { xs: 9, md: 13 },
          pb: 2
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', height: '85%' }}>
          <Box sx={{ flex: 1, minWidth: 280, maxHeight: '100%', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 5 }}>
              <Box component="img" src={keyhands} alt="keyhands" sx={{ width: 30, height: 30 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#6C4DE6',fontSize: '2rem' }}>
                Keystroke analysis
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1.5 }}>
              <Box component="img" src={favoriteIcon} alt="favorite" sx={{ width: 26, height: 26 }} />
              <Typography variant="body2" sx={{ color: '#3d3d3d', fontSize: '1.4rem' }}>
                Instructions
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, mb: 3}}>
              {instructions.map((item, index) => (
                <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1.5}}>
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      bgcolor: '#6C4DE6',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography variant="body2" sx={{ color: '#4a4a4a', fontSize: '0.8rem' }}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ mb: 3, border: '0px solid #D9CCFF', borderRadius: '13px', p: 1.25, bgcolor: '#F3F3FD', width: 'fit-content' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                <Box component="img" src={messageIcon} alt="message" sx={{ width: 36, height: 30 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#6C4DE6' }}>
                  Important Notes
                </Typography>
              </Box>
              <Box component="ul" sx={{ pl: 5,pb: 1.5, m: 0, color: '#4a4a4a', listStyle: 'disc', fontSize: '0.50rem' }}>
                <li>
                  <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                    Type naturally — do not try to slow down or speed up artificially.
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                    Every key press including backspace is recorded.
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>
                    Typing rhythm and timing patterns are analyzed, not just accuracy.
                  </Typography>
                </li>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 1.5,
                gap: 0.75,
                mb: 1,
                py: 1,
                border: '1px solid #D9CCFF',
                borderRadius: '9px',
                bgcolor: '#D3DFEE'
              }}
            >
              <AccessTime sx={{ color: '#6C4DE6' }} />
              <Typography variant="body2" sx={{ fontWeight: 700, color: '#6C4DE6', fontSize: '0.8rem' }}>
                Estimated time: 5 minutes
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', marginTop: 1.5 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/assessment/instructions/reading')}
                sx={{ borderColor: '#6C4DE6', color: '#6C4DE6', borderRadius: '9px', px: 5, py: 1 }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/assessment/keystroke')}
                sx={{ bgcolor: '#6C4DE6', borderRadius: '9px', px: 5, py: 1, '&:hover': { bgcolor: '#5B3FE0' } }}
              >
                Start Test
              </Button>
            </Box>
          </Box>

          <Box sx={{ flex: 1, minWidth: 260, display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }} />
        </Box>
      </Container>
    </Box>
  );
}

export default KeystrokeInstructions;
