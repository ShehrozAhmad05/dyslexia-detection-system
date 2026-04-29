import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import { Analytics } from '@mui/icons-material';
import ImageUpload from '@components/HandwritingModule/ImageUpload';
import { handwritingService } from '@services';

function HandwritingTest() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [screeningSentence, setScreeningSentence] = useState('');
  const [sentenceLoading, setSentenceLoading] = useState(true);
  const [sentenceError, setSentenceError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const steps = ['Write Sentence', 'Upload Image', 'Analyze', 'View Results'];

  useEffect(() => {
    fetchScreeningSentence();
  }, []);

  useEffect(() => {
    // Cleanup preview URL on unmount
    return () => {
      if (selectedImage?.preview) {
        URL.revokeObjectURL(selectedImage.preview);
      }
    };
  }, [selectedImage]);

  const fetchScreeningSentence = async () => {
    try {
      setSentenceLoading(true);
      setSentenceError('');
      const response = await handwritingService.getSentence();
      setScreeningSentence(response.data.sentence);
    } catch (err) {
      setSentenceError(
        'Failed to load screening sentence. Please refresh the page.'
      );
    } finally {
      setSentenceLoading(false);
    }
  };

  const handleImageSelect = (file) => {
    // Create preview URL
    const preview = URL.createObjectURL(file);
    setSelectedImage({
      file,
      name: file.name,
      size: file.size,
      preview
    });
    setError('');
  };

  const handleRemoveImage = () => {
    if (selectedImage?.preview) {
      URL.revokeObjectURL(selectedImage.preview);
    }
    setSelectedImage(null);
    setError('');
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }
    if (!screeningSentence) {
      setError('Screening sentence not loaded. Please refresh.');
      return;
    }

    try {
      setError('');
      setUploading(true);
      setActiveStep(2);

      // Include expected sentence in FormData
      const formData = new FormData();
      formData.append('image', selectedImage.file);
      formData.append('expectedSentence', screeningSentence);
      const assessmentId = localStorage.getItem('currentAssessmentId');
      if (assessmentId) {
        formData.append('assessmentId', assessmentId);
      }

      const uploadResponse = await handwritingService.upload(formData);
      const resultId = uploadResponse.data.result.id;

      setUploading(false);
      setAnalyzing(true);
      setActiveStep(3);
      await handwritingService.analyze(resultId);

      setAnalyzing(false);
      navigate(`/assessment/handwriting/results/${resultId}`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to upload and analyze image. Please try again.'
      );
      setUploading(false);
      setAnalyzing(false);
      setActiveStep(1);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h4" gutterBottom>
            Handwriting Analysis Test
          </Typography>
          <Typography variant="body1">
            Write the sentence shown below and upload a photo
            of your handwriting for dyslexia screening
          </Typography>
        </Paper>

        {/* Stepper */}
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Screening sentence */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Your Screening Sentence
          </Typography>

          {sentenceLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress />
            </Box>
          )}

          {!sentenceLoading && sentenceError && (
            <Alert
              severity="warning"
              action={(
                <Button color="inherit" size="small" onClick={fetchScreeningSentence}>
                  Retry
                </Button>
              )}
            >
              {sentenceError}
            </Alert>
          )}

          {!sentenceLoading && !sentenceError && screeningSentence && (
            <>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                {screeningSentence}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Write this sentence on paper in PRINT style
                (not cursive/joining). Then take a clear photo
                and upload it below.
              </Typography>
            </>
          )}
        </Paper>

        {/* Instructions */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.lighter' }}>
          <Typography variant="subtitle2" gutterBottom color="info.dark">
            Instructions:
          </Typography>
          <Typography variant="body2" color="info.dark">
            • Write the sentence above on plain white paper
            <br />
            • Use PRINT style writing (not cursive or joining)
            <br />
            • Write clearly with good pen pressure
            <br />
            • Take a clear photo in good lighting
            <br />
            • Ensure the full sentence is visible in the photo
            <br />
            • Upload the photo below
          </Typography>
        </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Upload Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <ImageUpload
            onImageSelect={handleImageSelect}
            selectedImage={selectedImage}
            onRemove={handleRemoveImage}
          />
        </Paper>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            size="large"
            onClick={() => navigate('/dashboard')}
            disabled={uploading || analyzing}
          >
            Cancel
          </Button>
          
          <Button
            variant="contained"
            size="large"
            startIcon={uploading || analyzing ? <CircularProgress size={20} color="inherit" /> : <Analytics />}
            onClick={handleUploadAndAnalyze}
            disabled={!selectedImage || uploading || analyzing}
          >
            {uploading ? 'Uploading...' : analyzing ? 'Analyzing...' : 'Upload & Analyze'}
          </Button>
        </Box>

        {/* Progress Message */}
        {(uploading || analyzing) && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {uploading && 'Uploading your handwriting sample...'}
              {analyzing && 'Analyzing handwriting patterns with AI...'}
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default HandwritingTest;
