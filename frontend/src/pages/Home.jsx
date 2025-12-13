import { Container, Typography, Box, Grid, Card, CardContent, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  Edit as EditIcon, 
  Keyboard as KeyboardIcon, 
  Visibility as VisibilityIcon,
  Psychology as PsychologyIcon,
  Assessment as AssessmentIcon,
  EmojiObjects as EmojiObjectsIcon
} from '@mui/icons-material';

function Home() {
  const navigate = useNavigate();

  return (
    <Box sx={{ bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
            Dyslexia Detection System
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9 }}>
            AI-Powered Multimodal Early Screening & Support
          </Typography>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Introduction */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h4" gutterBottom>
            Welcome to Our Comprehensive Assessment Platform
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto', mt: 2 }}>
            Our advanced AI system analyzes multiple indicators to provide accurate dyslexia screening 
            with transparent, explainable results and personalized support recommendations.
          </Typography>
        </Box>

        {/* Features Grid */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<EditIcon sx={{ fontSize: 48 }} />}
              title="Handwriting Analysis"
              description="Advanced computer vision detects letter reversals, spacing issues, and stroke patterns"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<KeyboardIcon sx={{ fontSize: 48 }} />}
              title="Keystroke Dynamics"
              description="Analyzes typing patterns, timing irregularities, and error frequencies"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<VisibilityIcon sx={{ fontSize: 48 }} />}
              title="Reading Assessment"
              description="Evaluates reading speed, comprehension, and eye movement patterns"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<PsychologyIcon sx={{ fontSize: 48 }} />}
              title="AI-Powered Analysis"
              description="Multimodal fusion combines all metrics for comprehensive risk assessment"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<AssessmentIcon sx={{ fontSize: 48 }} />}
              title="Explainable Results"
              description="Transparent AI explanations show exactly why results were determined"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard
              icon={<EmojiObjectsIcon sx={{ fontSize: 48 }} />}
              title="Personalized Therapy"
              description="Custom learning support recommendations based on assessment results"
            />
          </Grid>
        </Grid>

        {/* CTA Section */}
        <Box sx={{ textAlign: 'center', bgcolor: 'white', p: 6, borderRadius: 2, boxShadow: 2 }}>
          <Typography variant="h4" gutterBottom>
            Ready to Get Started?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Create an account to begin your comprehensive dyslexia assessment
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" size="large" onClick={() => navigate('/register')}>
              Register Now
            </Button>
            <Button variant="outlined" size="large" onClick={() => navigate('/login')}>
              Login
            </Button>
          </Box>
        </Box>
      </Container>

      {/* Footer */}
      <Box sx={{ bgcolor: 'grey.900', color: 'white', py: 4, mt: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" align="center">
            © 2025 Dyslexia Detection System | Final Year Project
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description }) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
        <Box sx={{ color: 'primary.main', mb: 2 }}>
          {icon}
        </Box>
        <Typography variant="h6" component="h3" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default Home;
