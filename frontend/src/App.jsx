import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { AuthProvider } from '@contexts/AuthContext';
import './App.css';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import HandwritingTest from './pages/HandwritingTest';
import HandwritingResults from './pages/HandwritingResults';
import ReadingTest from './pages/ReadingTest';
import ReadingResults from './pages/ReadingResults';
import KeystrokeTest from './pages/KeystrokeTest';
import KeystrokeResults from './pages/KeystrokeResults';

// Import Memory Module components
import SequenceMemoryTest from './components/MemoryModule/SequenceMemoryTest';
import WordMemoryTest from './components/MemoryModule/WordMemoryTest';
import MemoryResults from './components/MemoryModule/MemoryResults';
import MemoryTestFlow from './components/MemoryModule/MemoryTestFlow';

// Import components
import Navbar from '@components/common/Navbar';
import ProtectedRoute from '@components/common/ProtectedRoute';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <Box component="main" sx={{ flexGrow: 1 }}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                {/* Handwriting Assessment Routes */}
                <Route 
                  path="/assessment/handwriting" 
                  element={
                    <ProtectedRoute>
                      <HandwritingTest />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/assessment/handwriting/results/:id" 
                  element={
                    <ProtectedRoute>
                      <HandwritingResults />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Reading Assessment Routes */}
                <Route 
                  path="/reading-test" 
                  element={
                    <ProtectedRoute>
                      <ReadingTest />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/reading-results/:id" 
                  element={
                    <ProtectedRoute>
                      <ReadingResults />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Memory Assessment Routes */}
                <Route 
                  path="/memory-test" 
                  element={
                    <ProtectedRoute>
                      <MemoryTestFlow />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/memory/sequence" 
                  element={
                    <ProtectedRoute>
                      <SequenceMemoryTest />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/memory/word" 
                  element={
                    <ProtectedRoute>
                      <WordMemoryTest />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/memory-results" 
                  element={
                    <ProtectedRoute>
                      <MemoryResults />
                    </ProtectedRoute>
                  } 
                />
                <Route
                  path="/assessment/keystroke"
                  element={
                    <ProtectedRoute>
                      <KeystrokeTest />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/assessment/keystroke/results/:id"
                  element={
                    <ProtectedRoute>
                      <KeystrokeResults />
                    </ProtectedRoute>
                  }
                />
                
                {/* Add more protected routes for other assessments */}
                {/* <Route path="/assessment/keystroke" element={<ProtectedRoute><KeystrokeTest /></ProtectedRoute>} /> */}
                {/* Add more protected routes for assessments */}
                {/* <Route path="/assessment/handwriting" element={<ProtectedRoute><HandwritingTest /></ProtectedRoute>} /> */}
              </Routes>
            </Box>
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
