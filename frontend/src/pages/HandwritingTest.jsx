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
import { CloudUpload, Analytics } from '@mui/icons-material';
import ImageUpload from '@components/HandwritingModule/ImageUpload';
import { handwritingService } from '@services';

function HandwritingTest() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const steps = ['Upload Image', 'Analyze', 'View Results'];

  useEffect(() => {
    // Cleanup preview URL on unmount
    return () => {
      if (selectedImage?.preview) {
        URL.revokeObjectURL(selectedImage.preview);
      }
    };
  }, [selectedImage]);

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

    try {
      setError('');
      setUploading(true);
      setActiveStep(1);

      // Create FormData
      const formData = new FormData();
      formData.append('image', selectedImage.file);

      // Upload image
      const uploadResponse = await handwritingService.upload(formData);
      const resultId = uploadResponse.data.result.id;

      setUploading(false);
      setAnalyzing(true);

      // Trigger analysis
      await handwritingService.analyze(resultId);

      setAnalyzing(false);
      setActiveStep(2);

      // Navigate to results page
      navigate(`/assessment/handwriting/results/${resultId}`);
    } catch (err) {
      console.error('Upload/Analysis error:', err);
      setError(err.response?.data?.message || 'Failed to upload and analyze image. Please try again.');
      setUploading(false);
      setAnalyzing(false);
      setActiveStep(0);
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
            Upload a sample of your handwriting to analyze patterns that may indicate dyslexia
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

        {/* Instructions */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.lighter' }}>
          <Typography variant="subtitle2" gutterBottom color="info.dark">
            Instructions:
          </Typography>
          <Typography variant="body2" color="info.dark">
            • Write a few sentences on paper (at least 2-3 lines of text)
            <br />
            • Take a clear photo or scan of your handwriting
            <br />
            • Ensure good lighting and the image is not blurry
            <br />
            • Upload the image below for analysis
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
