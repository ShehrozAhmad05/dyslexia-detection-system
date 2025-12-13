import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, Paper, IconButton, Alert } from '@mui/material';
import { CloudUpload, Close, Image as ImageIcon } from '@mui/icons-material';

function ImageUpload({ onImageSelect, selectedImage, onRemove }) {
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('');

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
      } else {
        setError('Please upload a valid image file (JPG, PNG, GIF, BMP)');
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onImageSelect(file);
    }
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/bmp': ['.bmp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {!selectedImage ? (
        <Paper
          {...getRootProps()}
          sx={{
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.400',
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover'
            }
          }}
        >
          <input {...getInputProps()} />
          
          <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Drop the image here' : 'Drag & drop handwriting image'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            or click to browse files
          </Typography>
          
          <Typography variant="caption" color="text.secondary">
            Supported formats: JPG, PNG, GIF, BMP (Max size: 10MB)
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 2, position: 'relative' }}>
          <IconButton
            onClick={onRemove}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'error.light', color: 'white' }
            }}
          >
            <Close />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ImageIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" noWrap>
                {selectedImage.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatFileSize(selectedImage.size)}
              </Typography>
            </Box>
          </Box>

          {selectedImage.preview && (
            <Box
              sx={{
                mt: 2,
                display: 'flex',
                justifyContent: 'center',
                '& img': {
                  maxWidth: '100%',
                  maxHeight: 400,
                  borderRadius: 1,
                  boxShadow: 2
                }
              }}
            >
              <img src={selectedImage.preview} alt="Preview" />
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}

export default ImageUpload;
