import { Container, Typography, Box, Grid, Card, CardContent, Button } from '@mui/material';
import { useAuth } from '@contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Start your dyslexia assessment or view your previous results
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => navigate('/assessment/handwriting')}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Handwriting Test
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload handwriting samples for analysis
              </Typography>
              <Button variant="contained" sx={{ mt: 2 }}>
                Start Test
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => navigate('/assessment/keystroke')}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Keystroke Test
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Analyze your typing patterns
              </Typography>
              <Button variant="contained" sx={{ mt: 2 }}>
                Start Test
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => navigate('/reading-test')}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reading Test
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Assess reading speed and comprehension
              </Typography>
              <Button variant="contained" sx={{ mt: 2 }}>
                Start Test
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Assessment History
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No assessments completed yet. Start your first test above!
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
