import { useNavigate } from 'react-router-dom';
import { AccessTime } from '@mui/icons-material';
import { Box, Button, Container, Typography } from '@mui/material';
import writingAnimation from '../../assets/lastbg.mp4';
import instructionWriting from '../../assets/instructionwriting.png';
import stickyIcon from '../../assets/sticky.png';
import messageIcon from '../../assets/message.png';
import favoriteIcon from '../../assets/favorite.png';
import reactLogo from '../../assets/react.svg';

function HandwritingInstructions() {
  const navigate = useNavigate();

  const instructions = [
    'You will be shown a sentence to copy.',
    'Write the sentence on plain white paper using a pen or pencil.',
    'Use PRINT style writing — do not use cursive or joined-up writing.',
    'Write clearly with consistent pressure.',
    'Take a clear photo of your handwriting in good lighting.',
    'Make sure the full sentence is visible in the photo.',
    'Upload the photo when prompted.'
  ];

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <Box
        component="video"
        src={writingAnimation}
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
        src={writingAnimation}
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
          zIndex: -1,
        
        }}
      />

      <Container
        maxWidth="lg"
        sx={{ position: 'relative', zIndex: 1, pt: { xs: 10, md: 20 }, pb: 3 }}
      >
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, minWidth: 280 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box component="img" src={stickyIcon} alt="sticky" sx={{ width: 26, height: 26 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#6C4DE6' }}>
                Handwriting analysis
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 2.5 }}>
              <Box component="img" src={favoriteIcon} alt="favorite" sx={{ width: 16, height: 16 }} />
              <Typography variant="body2" sx={{ color: '#3d3d3d', fontSize: '0.8rem' }}>
                Write a sentence in print style for analysis
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 1.5 }}>
              {instructions.map((item, index) => (
                <Box key={item} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
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
                  <Typography variant="body2" sx={{ color: '#4a4a4a', fontSize: '0.72rem' }}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ mb: 1.5, border: '1px solid #D9CCFF', borderRadius: '13px', p: 1.5, bgcolor: '#F3F3FD' ,width:'fit-content'}}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                <Box component="img" src={messageIcon} alt="message" sx={{ width: 36, height: 30 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#6C4DE6' }}>
                  Important Notes
                </Typography>
              </Box>
              <Box component="ul" sx={{ pl: 5, m: 0, color: '#4a4a4a', listStyle: 'disc', fontSize: '0.50rem' }}>
                <li>
                  <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>Print style only — cursive writing cannot be analyzed.</Typography>
                </li>
                <li>
                  <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>Ensure good lighting and a clear, unblurred photo.</Typography>
                </li>
                <li>
                  <Typography variant="body2" sx={{ fontSize: '0.7rem' }}>Write at your normal pace — do not rush.</Typography>
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

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', marginTop: 4 }}>
           
              <Button
                variant="outlined"
                onClick={() => navigate('/assessment/start')}
                sx={{ borderColor: '#6C4DE6', color: '#6C4DE6', borderRadius: '9px', px: 5, py: 1 }}
              >
                Back
              </Button>
                 <Button
                variant="contained"
                onClick={() => navigate('/assessment/handwriting')}
                sx={{ bgcolor: '#6C4DE6', borderRadius: '9px', px: 5, py: 1, '&:hover': { bgcolor: '#5B3FE0' } }}
              >
                Start Test
              </Button>
            </Box>
          </Box>

          <Box sx={{ flex: 1, minWidth: 260, display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
       
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default HandwritingInstructions;
