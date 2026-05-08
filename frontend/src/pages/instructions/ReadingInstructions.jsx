import { useNavigate } from 'react-router-dom';
import { AccessTime, Stars } from '@mui/icons-material';
import { Box, Button, Container, Typography } from '@mui/material';
import readingIntroVideo from '../../assets/rintro5.mp4';
import readingIcon from '../../assets/reading.png';

function ReadingInstructions() {
  const navigate = useNavigate();
  const navbarOffset = 110;

  const instructions = [
    'You will be shown a reading passage divided into sections.',
    'Move your cursor along the text as you read each line.',
    'Read at your normal pace - do not rush or skim.',
    'After reading, you will answer 8 comprehension questions.',
    'You can scroll back to re-read sections if needed.',
    'Answer all questions before submitting.'
  ];

  const importantNotes = [
    'Move your cursor along the text as you read - this tracks your reading patterns.',
    'Pausing for 2 or more seconds in one place is recorded as a pause.',
    'Going back to a previous section is recorded as a revisit.',
    'Read naturally - do not try to game the tracking.'
  ];

  return (
    <Box
      sx={{
        position: 'relative',
        height: `calc(100vh - ${navbarOffset}px)`,
        minHeight: `calc(100vh - ${navbarOffset}px)`,
        overflow: 'hidden'
      }}
    >
      <Box
        component="video"
        src={readingIntroVideo}
        autoPlay
        loop
        muted
        playsInline
        sx={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          minWidth: '100vw',
          minHeight: '100vh',
          objectFit: 'cover',
          objectPosition: 'bottom',
          zIndex: -2
        }}
      />

      <Container
        maxWidth={false}
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'flex-start',
          px: { xs: 2, md: 6 },
          pt: { xs: 2, md: 2 },
          position: 'relative',
          zIndex: 1
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 520 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, mb: 0.5 }}>
            <Box
              component="img"
              src={readingIcon}
              alt="Reading"
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                p: 0.7,
                boxShadow: '0 8px 18px rgba(0, 0, 0, 0.12)'
              }}
            />
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#2F5E1A' }}>
              Reading Assessment
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#4b4b4b', fontSize: '0.72rem', mb: 0.9 }}>
            Read a passage and answer comprehension questions
          </Typography>

          <Box
            sx={{
              bgcolor: 'rgba(233, 246, 214, 0.95)',
              border: '1px solid #CFE3B5',
              borderRadius: '16px',
              p: 1.1,
              mb: 0.9,
              boxShadow: '0 10px 26px rgba(0, 0, 0, 0.08)'
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2F5E1A', mb: 0.5, fontSize: '0.82rem' }}>
              Instructions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.45 }}>
              {instructions.map((item, index) => (
                <Box key={item} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.9 }}>
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      bgcolor: '#5FAF3A',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '0.55rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: '2px'
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography variant="body2" sx={{ color: '#4b4b4b', fontSize: '0.72rem' }}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              bgcolor: 'rgba(241, 248, 226, 0.95)',
              border: '1px solid #CFE3B5',
              borderRadius: '16px',
              p: 1.1,
              mb: 0.9
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 0.5 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: '#4CAF50',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Stars sx={{ fontSize: 13 }} />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2F5E1A', fontSize: '0.82rem' }}>
                Important Notes
              </Typography>
            </Box>
            <Box component="ul" sx={{ pl: 2.4, m: 0, color: '#4b4b4b', listStyle: 'disc' }}>
              {importantNotes.map((note) => (
                <li key={note} style={{ marginBottom: '0.1rem' }}>
                  <Typography variant="body2" sx={{ fontSize: '0.60rem' }}>
                    {note}
                  </Typography>
                </li>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              px: 1.05,
              py: 0.3,
              gap: 0.6,
              borderRadius: '10px',
              border: '1px solid #DDEBCB',
              bgcolor: 'rgba(255, 255, 255, 0.85)',
              color: '#2F5E1A',
              fontWeight: 600,
              mb: 0.9
            }}
          >
            <AccessTime sx={{ color: '#4CAF50', fontSize: 16 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#2F5E1A', fontSize: '0.72rem' }}>
              Estimated time: 5 minutes
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/assessment/instructions/handwriting')}
              sx={{
                borderColor: '#5FAF3A',
                color: '#2F5E1A',
                borderRadius: '12px',
                px: 2.2,
                py: 0.55,
                fontWeight: 700,
                fontSize: '0.72rem'
              }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/reading-test')}
              sx={{
                bgcolor: '#4CAF50',
                borderRadius: '12px',
                px: 2.2,
                py: 0.55,
                fontWeight: 700,
                fontSize: '0.72rem',
                '&:hover': { bgcolor: '#3F9B45' }
              }}
            >
              Start Reading Test
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default ReadingInstructions;