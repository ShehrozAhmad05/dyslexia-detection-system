import { Container, Typography, Box, Card, CardContent, Button, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import upperImage from '../assets/upper.png';
import handwritingImage from '../assets/writing.png';
import keystrokeImage from '../assets/key.png';
import readingImage from '../assets/reading.png';
import memoryImage from '../assets/memory.png';
import explainableImage from '../assets/explainable.png';
import therapyImage from '../assets/therapy.png';
import airplaneImage from '../assets/plane.png';

const kidsFont = '"Comic Sans MS", "Chalkboard SE", "Marker Felt", "Baloo 2", cursive';
const contentFont = '"Comic Sans MS", "Chalkboard SE", "Nunito", sans-serif';

const MODULES = [
  {
    title: 'Handwriting Analysis',
    description: 'Advanced computer vision detects letter reversals, spacing issues, and stroke patterns.',
    image: handwritingImage,
    accent: '#5B8CFF'
  },
  {
    title: 'Keystroke Dynamics',
    description: 'Analyzes typing patterns, timing irregularities, and error frequencies.',
    image: keystrokeImage,
   accent: '#8B7CFF'
  },
  {
    title: 'Reading Assessment',
    description: 'Evaluates reading speed, comprehension, and eye movement patterns.',
    image: readingImage,
    
     accent: '#44C0A8'
  },
  {
    title: 'Memory Assessment',
    description: 'Measures sequence recall, word memory, and cognitive processing flow.',
    image: memoryImage,
    accent: '#F49D5D'
  },
  {
    title: 'Explainable Results',
    description: 'Transparent AI explanations show exactly why results were determined.',
    image: explainableImage,
    accent: '#2AA6D6'
  },
  {
    title: 'Personalized Therapy',
    description: 'Custom learning support recommendations based on assessment outcomes.',
    image: therapyImage,
    accent: '#EC6EA8'
  }
];

function Home() {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: '#EEF5FF' }}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: { xs: 420, md: 650 },
          backgroundImage: `linear-gradient(105deg, rgba(12,28,58,0.72) 0%, rgba(12,28,58,0.46) 42%, rgba(12,28,58,0.18) 72%), url(${upperImage})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: { xs: 'center 20%', md: 'center 45%' }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -80,
            right: -60,
            width: 260,
            height: 260,
            borderRadius: '50%',
            bgcolor: 'rgba(91, 140, 255, 0.2)',
            filter: 'blur(6px)'
          }}
        />

        <Container
          maxWidth="xl"
          sx={{
            minHeight: { xs: 420, md: 520 },
            display: 'flex',
            alignItems: 'center',
            py: { xs: 4, md: 6 }
          }}
        >
          <Box sx={{ maxWidth: 640, zIndex: 2 }}>
              <Chip
                label="Child-Friendly AI Screening"
                sx={{
                  mb: 2,
                  bgcolor: 'rgba(255,255,255,0.18)',
                  color: '#FFFFFF',
                  fontFamily: contentFont,
                  fontWeight: 700,
                  backdropFilter: 'blur(4px)'
                }}
              />
              <Typography
                variant="h2"
                sx={{
                  fontFamily: kidsFont,
                  color: '#FFFFFF',
                  fontWeight: 100,
                  lineHeight: 1.15,
                  fontSize: { xs: '2rem', sm: '2.4rem', md: '2.9rem' }
                }}
              >
                Dyslexia Detection System
              </Typography>
              <Typography
                sx={{
                  mt: 2,
                  maxWidth: 560,
                  color: 'rgba(255,255,255,0.96)',
                  fontSize: { xs: '1.02rem', sm: '1.12rem' },
                  fontWeight: 700,
                  fontFamily: contentFont
                }}
              >
                AI-Powered Multimodal Early Screening & Support
              </Typography>

              <Typography
                sx={{
                  mt: 1.2,
                  maxWidth: 560,
                  color: 'rgba(237,243,255,0.95)',
                  fontSize: '0.98rem',
                  fontFamily: contentFont
                }}
              >
                Gentle, child-friendly assessments for reading, writing, memory, and typing growth.
              </Typography>

              <Box sx={{ mt: 3, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/register')}
                  sx={{
                    borderRadius: '999px',
                    px: 3,
                    py: 1.1,
                    fontFamily: contentFont,
                    fontWeight: 700,
                    bgcolor: '#5B8CFF',
                    boxShadow: '0 12px 25px rgba(91, 140, 255, 0.35)',
                    '&:hover': { bgcolor: '#4B7CFA' }
                  }}
                >
                  Create Account
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/login')}
                  sx={{
                    borderRadius: '999px',
                    px: 3,
                    py: 1.1,
                    borderColor: 'rgba(255,255,255,0.8)',
                    color: '#FFFFFF',
                    fontFamily: contentFont,
                    fontWeight: 700,
                    '&:hover': { borderColor: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.12)' }
                  }}
                >
                  Sign In
                </Button>
              </Box>
          </Box>
        </Container>

        <Box
          component="svg"
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
          aria-hidden="true"
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -1,
            width: '100%',
            height: { xs: 56, sm: 72, md: 90 },
            display: 'block'
          }}
        >
          <path
            d="M0,64 C180,126 360,16 540,54 C720,92 900,152 1080,112 C1260,72 1350,30 1440,56 L1440,160 L0,160 Z"
            fill="#EEF5FF"
          />
        </Box>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 5, md: 7 } }}>
        <Typography
          variant="h4"
          sx={{
            textAlign: 'center',
            mb: 3,
            color: '#274777',
            fontFamily: kidsFont,
            fontWeight: 800
          }}
        >
          {/* Choose a Learning Module */}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'nowrap',
            overflowX: 'auto',
            pb: 1,
            // '&::-webkit-scrollbar': {
            //   height: 10
            // },
            // '&::-webkit-scrollbar-thumb': {
            //   backgroundColor: 'rgba(255, 255, 255, 1)',
            //   borderRadius: 999
            // }
          }}
        >
          {MODULES.map((module) => (
            <Box key={module.title} sx={{ flex: '0 0 220px', width: 220 }}>
              <FeatureCard module={module} contentFont={contentFont} kidsFont={kidsFont} />
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            mt: 6,
            bgcolor: '#EFEAFC',
            borderRadius: 4,
            boxShadow: '0 16px 34px rgba(97, 78, 175, 0.14)',
            p: { xs: 2, md: 2.6 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: { xs: 1.4, md: 10 },
            flexDirection: { xs: 'column', md: 'row' }
          }}
        >
          <Box
            component="img"
            src={airplaneImage}
            alt="Airplane"
            sx={{
              width: { xs: 88, sm: 100, md: 40 },
              height: 'auto',
              flexShrink: 0
            }}
          />

          <Box sx={{ flex: 1, textAlign: { xs: 'center', md: 'left' } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: { xs: 1.2, md: 2 },
                flexDirection: { xs: 'column', sm: 'row' }
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontFamily: kidsFont,
                  color: '#6A4FD8',
                  fontWeight: 800,
                  fontSize: { xs: '1.35rem', md: '1.85rem' },
                  lineHeight: 1.2
                }}
              >
                Ready to make a difference?
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                 
                  gap: 1,
                  flexWrap: 'nowrap',
                  justifyContent: { xs: 'center', sm: 'flex-end' }
                }}
              >
                <Button
                  variant="contained"
                  onClick={() => navigate('/register')}
                  sx={{
                    borderRadius: '999px',
                    px: { xs: 2.2, md: 2.8 },
                    py: 0.9,
                      marginTop:'15px',
                    fontFamily: contentFont,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    bgcolor: '#6A4FD8',
                    '&:hover': { bgcolor: '#5B43C2' }
                  }}
                >
                  Create Account
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/login')}
                  sx={{
                    borderRadius: '999px',
                    px: { xs: 2.2, md: 2.8 },
                    py: 0.9,
                     marginTop:'15px',
                    borderColor: '#6A4FD8',
                    color: '#6A4FD8',
                    fontFamily: contentFont,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    '&:hover': { borderColor: '#5B43C2', backgroundColor: 'rgba(106, 79, 216, 0.08)' }
                  }}
                >
                  Sign In
                </Button>
              </Box>
            </Box>

            <Typography sx={{ color: '#5A5185', fontFamily: contentFont, mt: 1, mb: 0.1 }}>
              Start your child-friendly dyslexia screening journey today.
            </Typography>
          </Box>
        </Box>
      </Container>

      <Box sx={{ bgcolor: '#14243F', color: 'white', py: 3 }}>
        <Container maxWidth="xl">
          <Typography sx={{ textAlign: 'center', opacity: 0.9, fontFamily: contentFont }}>
            © 2026 Dyslexia Detection System | Empowering Every Child Through Early Support
          </Typography>
        </Container>
      </Box>

    </Box>
  );
}

function FeatureCard({ module, contentFont, kidsFont }) {
  return (
    <Card
      sx={{
        width: 220,
        minWidth: 220,
        maxWidth: 220,
        height: 330,
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid rgba(91, 140, 255, 0.18)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,252,255,0.98))',
        boxShadow: '0 12px 25px rgba(30, 65, 128, 0.12)'
      }}
    >
      <Box
        sx={{
          height: 130,
          backgroundImage: `url(${module.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <CardContent
        sx={{
          textAlign: 'center',
          height: 200,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontFamily: kidsFont,
            color: '#2D4E83',
            fontWeight: 800,
            mb: 1,
            fontSize: '1.05rem',
            lineHeight: 1.2
          }}
        >
          {module.title}
        </Typography>
        <Typography sx={{ color: '#4C668F', fontFamily: contentFont, fontSize: '0.88rem', lineHeight: 1.35, flexGrow: 1 }}>
          {module.description}
        </Typography>
        <Box sx={{ mt: 2.2, mx: 'auto', width: 42, height: 5, borderRadius: 999, bgcolor: module.accent }} />
      </CardContent>
    </Card>
  );
}

export default Home;
