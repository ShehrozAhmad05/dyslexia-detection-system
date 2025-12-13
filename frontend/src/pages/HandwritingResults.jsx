import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Box, CircularProgress, Alert, Typography } from '@mui/material';
import ResultsDisplay from '@components/HandwritingModule/ResultsDisplay';
import { handwritingService } from '@services';

function HandwritingResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResults();
  }, [id]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await handwritingService.getResults(id);
      
      if (response.data.success) {
        setResult(response.data.result);
      } else {
        setError('Failed to load results');
      }
    } catch (err) {
      console.error('Fetch results error:', err);
      setError(
        err.response?.data?.message || 
        'Failed to load analysis results. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTakeAnotherTest = () => {
    navigate('/assessment/handwriting');
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 2
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Loading results...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Unable to load the analysis results.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <button onClick={fetchResults}>
                Try Again
              </button>
              <button onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </button>
            </Box>
          </Box>
        </Box>
      </Container>
    );
  }

  if (!result) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Alert severity="warning">
            No results found for this analysis.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <ResultsDisplay
          result={result}
          onTakeAnotherTest={handleTakeAnotherTest}
        />
      </Box>
    </Container>
  );
}

export default HandwritingResults;
