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
import ImageUpload from '@components/HandwritingModule/ImageUpload';
import { handwritingService } from '@services';
import writingbg from '../assets/writingbg.png';
import girli from '../assets/cropgirli.jpeg';
import favorite from '../assets/favorite.png';
import cartoon from '../assets/cartoon copy.png';
import love from '../assets/love.png';

function HandwritingTest() {
  const navigate = useNavigate();
  const [screeningSentence, setScreeningSentence] = useState('');
  const [sentenceLoading, setSentenceLoading] = useState(true);
  const [sentenceError, setSentenceError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const purple = '#6C4DE6';

  const steps = ['Write Sentence', 'Upload Image', 'Analyze', 'View Result'];

  const currentStep = analyzing ? 3 : uploading ? 2 : selectedImage ? 1 : 0;

  const instructionItems = [
    'Write the sentence above on plain white paper',
    'Use PRINT style writing (not cursive or joining)',
    'Write clearly with good pen pressure',
    'Take a clear photo in good lighting',
    'Ensure the full sentence is visible in the photo',
    'Upload the photo below'
  ];

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
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        backgroundImage: `url(${writingbg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#ffffff',
        py: 2
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ py: 15 }}>
          {/* Header */}
          <Box
            sx={{
              mb: 8,
              borderRadius: 4,
              overflow: 'hidden',
              backgroundColor: purple,
              backgroundImage: `url(${girli})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'repeat',
              minHeight: 180,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              px: 20,
            
              mx: { xs: -2, sm: 0 },
              // width: '100vw', 
    ml: 'calc(-80vw + 70%)', // removes side white space
            }}
          >
            <Box sx={{ maxWidth: 720, color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.35)' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Handwriting Analysis Test
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 200,
                  px: { xs: 2, sm: 6 },
                  mb: 3,
                  fontSize: { xs: '1rem', sm: '1rem' }
                }}
              >
                writie the sentence shown below and upload a photo of your handwriting for dyslexia screening
              </Typography>
            </Box>
          </Box>

          {/* Stepper */}
          <Box sx={{ mb: 5, px: { xs: 0, sm: 1 } }}>
            <Stepper
              activeStep={currentStep}
              sx={{
                '& .MuiStepIcon-root.Mui-active': { color: purple },
                '& .MuiStepIcon-root.Mui-completed': { color: purple },
                '& .MuiStepLabel-label.Mui-active': { color: purple, fontWeight: 700 },
                '& .MuiStepLabel-label.Mui-completed': { color: purple }
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Screening sentence */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: '#fff' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box component="img" src={favorite} alt="favorite" sx={{ width: 24, height: 24 }} />
              <Typography variant="h6">Your Screening Sentence</Typography>
            </Box>

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
              <Box
                sx={{
                  position: 'relative',
                  minHeight: { xs: 200, sm: 180 },
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'hidden'
                }}
              >
                <Box sx={{ flex: 1, minWidth: 240, pr: { xs: 0, md: 26 } }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: purple,fontSize: { sm: '2.3rem' }, mb: 8 }}>
                    {screeningSentence}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Write a sentence on paper in PRINT style (not cursive), take a clear photo, and upload it below for analysis.
                  </Typography>
                </Box>
                <Box
                  component="img"
                  src={cartoon}
                  alt="cartoon"
                  sx={{
                    position: { xs: 'relative', md: 'absolute' },
                    right: { md: 12 },
                    bottom: { md: 0 },
                    width: { xs: 10, sm: 0, md: 310 },
                    height: 'auto',
                    mt: { xs: 2, md: 0 }
                  }}
                />
              </Box>
            )}
          </Paper>

          {/* Instructions */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: '#fff' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Box component="img" src={favorite} alt="favorite" sx={{ width: 24, height: 24 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Instructions:
              </Typography>
            </Box>
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                gap: 3,
                alignItems: 'center',
                minHeight: { xs: 200, sm: 180 },
                overflow: 'hidden'
              }}
            >
              <Box sx={{ flex: 1, minWidth: 240, pr: { xs: 0, md: 20 } }}>
                {instructionItems.map((item) => (
                  <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Box component="img" src={favorite} alt="favorite" sx={{ width: 18, height: 18 }} />
                    <Typography variant="body2" color="text.secondary">
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Box
                component="img"
                src={love}
                alt="love"
                sx={{
                  position: { xs: 'relative', md: 'absolute' },
                  right: { md: 110 },
                  top: { md: 5 },
                  width: { xs: 0, sm: 60 },
                  height: 'auto',
                  mt: { xs: 2, md: 0 }
                }}
              />
            </Box>
          </Paper>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

          {/* Upload Section */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3, bgcolor: '#fff' }}>
            <ImageUpload
              onImageSelect={handleImageSelect}
              selectedImage={selectedImage}
              onRemove={handleRemoveImage}
            />
          </Paper>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/dashboard')}
              disabled={uploading || analyzing}
              sx={{
                borderColor: purple,
                color: purple,
                borderRadius: 999,
                px: 4,
                '&:hover': { borderColor: purple, bgcolor: 'rgba(108,77,230,0.08)' }
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              size="large"
              onClick={handleUploadAndAnalyze}
              disabled={!selectedImage || uploading || analyzing}
              sx={{
                bgcolor: purple,
                color: '#fff',
                borderRadius: 999,
                px: 4,
                '&:hover': { bgcolor: '#5B3FE0' },
                '&.Mui-disabled': { bgcolor: purple, opacity: 0.6, color: '#fff' }
              }}
            >
              {uploading || analyzing ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                'Upload & Analyze'
              )}
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
    </Box>
  );
}

export default HandwritingTest;
