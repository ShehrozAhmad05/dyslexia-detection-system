import { useNavigate } from 'react-router-dom';
import { AccessTime } from '@mui/icons-material';
import { Box, Button, Container, Typography } from '@mui/material';
import memoryIntroVideo from '../../assets/memoryintro.mp4';
import memoryIcon from '../../assets/game.png';

function MemoryInstructions() {
  const navigate = useNavigate();
  const navbarOffset = 110;

  const instructions = [
    'This assessment has two parts.',
    'Part 1 — Sequence Memory: You will see a sequence of items.',
    'Memorize the sequence, then reproduce it in the correct order.',
    'Part 2 — Word Recall: You will be shown a list of words.',
    'After a short delay, recall as many words as you can.',
    'Complete both parts to finish the memory assessment.'
  ];

  const importantNotes = [
    'Complete both parts — sequence memory AND word recall.',
    'Do not write anything down during the memorization phase.',
    'Take your time — there is no strict time pressure.'
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
        src={memoryIntroVideo}
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
          objectPosition: 'center',
          zIndex: -2
        }}
      />

      <Container
        maxWidth={false}
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          px: { xs: 2, md: 6 },
          pt: { xs: 2, md: 2 },
          position: 'relative',
          zIndex: 1
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 460 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, mb: 0.2 }}>
            <Box
              component="img"
              src={memoryIcon}
              alt="Memory"
              sx={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                p: 0.7,
                boxShadow: '0 8px 18px rgba(0, 0, 0, 0.12)',
                // mt: '8px'
              }}
            />
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#203A63', fontSize: '2.4rem' }}>
              Memory Assessment
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: '#324a70', fontSize: '0.65rem', fontWeight: 600, mb: 0.85, ml: 8.7 }}>
            Two tasks: sequence memory and word recall
          </Typography>

          <Box
            sx={{
              bgcolor: 'transparent',
              // border: '1px solid rgba(32, 58, 99, 0.18)',
              borderRadius: '16px',
              p: 1.1,
              mb: 0.9,
              boxShadow: 'none'
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#203A63', mb: 0.5, fontSize: '0.8rem' }}>
              Instructions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
              {instructions.map((item, index) => (
                <Box key={item} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.9 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: '#2E6AB3',
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
                  <Typography variant="body2" sx={{ color: '#3c3c3c', fontSize: '0.7rem', lineHeight: 1.15 }}>
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box
            sx={{
              bgcolor: 'transparent',
              border: '1px solid rgba(32, 58, 99, 0.14)',
              borderRadius: '16px',
              p: 1.1,
              mb: 0.9
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#203A63', fontSize: '0.8rem', mb: 0.5 }}>
              Important Notes
            </Typography>
            <Box component="ul" sx={{ pl: 1.6, m: 0, color: '#203A63', listStyle: 'disc' }}>
              {importantNotes.map((note) => (
                <li key={note} style={{ marginBottom: '0.05rem' ,marginLeft: '1.5rem'}}>
                  <Typography variant="body2" sx={{ fontSize: '0.6rem', lineHeight: 1.01 }}>
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
              px: 0,
              py: 0.3,
              gap: 0.5,
              // borderRadius: 0,
              // border: 'none',
              bgcolor: 'transparent',
              color: '#203A63',
              fontWeight: 600,
              mb: 0.9
            }}
          >
            <AccessTime sx={{ color: '#2E6AB3', fontSize: 16 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#203A63', fontSize: '0.7rem' }}>
              Estimated time: 5 minutes
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/assessment/instructions/keystroke')}
              sx={{
                borderColor: '#2E6AB3',
                color: '#203A63',
                borderRadius: '12px',
                px: 2.2,
                py: 0.55,
                fontWeight: 700,
                fontSize: '0.7rem'
              }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/memory-test')}
              sx={{
                bgcolor: '#2E6AB3',
                borderRadius: '12px',
                px: 2.2,
                py: 0.55,
                fontWeight: 700,
                fontSize: '0.7rem',
                '&:hover': { bgcolor: '#255A96' }
              }}
            >
              Start Memory Test
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default MemoryInstructions;
