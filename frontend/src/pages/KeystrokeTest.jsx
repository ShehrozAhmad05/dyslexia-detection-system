import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  TextField,
  Stack,
  Chip,
  Paper,
  Container,
} from '@mui/material';
import { keystrokeService } from '../services';
import bgKeyboardTest from '../assets/keybg.png';
import technologyIcon from '../assets/technology.png';
import starRatingIcon from '../assets/star-rating.png';
import playIcon from '../assets/play.png';
import stopIcon from '../assets/stop.png';
import paperAirplaneIcon from '../assets/paper-airplane.png';
import refreshIcon from '../assets/refresh.png';
import focusIcon from '../assets/focus.png';
import daysIcon from '../assets/days.png';
import clockIcon from '../assets/clocks.png';

const IGNORED_KEYS = new Set([
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'CapsLock',
  'Tab',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
]);

function normalizeKey(key) {
  if (key === ' ') return 'Space';
  return key;
}

function formatBreakdownLabel(key) {
  const labels = {
    holdTimeRisk: 'Hold Time Risk',
    flightTimeRisk: 'Flight Time Risk',
    backspaceRisk: 'Backspace Risk',
    pauseRisk: 'Pause Risk',
    speedRisk: 'Speed Risk',
    errorRateRisk: 'Error Rate Risk',
  };
  return labels[key] || key;
}

function getRiskColor(level) {
  const levelStr = typeof level === 'string' ? level.toUpperCase() : '';
  if (levelStr === 'LOW') return 'success';
  if (levelStr === 'MODERATE') return 'warning';
  if (levelStr === 'HIGH') return 'error';
  return 'primary';
}

function calculateDebugMetrics({ keystrokes = [], startTime, endTime, prompt = '', typedText = '' }) {
  const holdTimes = keystrokes
    .map((k) => Number(k.holdTime))
    .filter((v) => Number.isFinite(v) && v > 0);

  const flightTimes = keystrokes
    .map((k) => Number(k.flightTime))
    .filter((v) => Number.isFinite(v));

  const motorFlights = flightTimes.filter((v) => v >= 0 && v <= 2000);
  const pauses = flightTimes.filter((v) => v > 2000);
  const backspaceCount = keystrokes.filter((k) => ['Backspace', 'BKSP', 'Delete', 'DEL'].includes(k.key)).length;

  const durationMs = startTime && endTime ? Math.max(0, endTime - startTime) : 0;
  const minutes = durationMs > 0 ? durationMs / 60000 : 0;
  const promptWords = prompt.trim().split(/\s+/).filter(Boolean).length;
  const typedWords = typedText.trim().split(/\s+/).filter(Boolean).length;
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  return {
    totalEvents: keystrokes.length,
    durationMs,
    startIso: startTime ? new Date(startTime).toISOString() : null,
    endIso: endTime ? new Date(endTime).toISOString() : null,
    avgHoldMs: avg(holdTimes),
    avgFlightMs: avg(motorFlights),
    avgPauseMs: avg(pauses),
    pauseCount: pauses.length,
    backspaceCount,
    backspaceRate: keystrokes.length ? backspaceCount / keystrokes.length : 0,
    pauseFrequencyPerWord: promptWords > 0 ? pauses.length / promptWords : 0,
    wpmByPrompt: minutes > 0 ? promptWords / minutes : 0,
    wpmByTyped: minutes > 0 ? typedWords / minutes : 0,
  };
}

function KeystrokeTest() {
  const navigate = useNavigate();
  const [isCapturing, setIsCapturing] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startError, setStartError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState(null);
  const [typedText, setTypedText] = useState('');
  const [keystrokes, setKeystrokes] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  const activeKeysRef = useRef(new Map());
  const lastKeyUpTimeRef = useRef(null);
  const previousKeyRef = useRef(null);

  const totalDurationMs = useMemo(() => {
    if (!startTime || !endTime) return 0;
    return Math.max(0, endTime - startTime);
  }, [startTime, endTime]);

  const debugMetrics = useMemo(
    () => calculateDebugMetrics({ keystrokes, startTime, endTime, prompt, typedText }),
    [keystrokes, startTime, endTime, prompt, typedText]
  );

  const resetCapture = () => {
    setPrompt('');
    setResult(null);
    setStartError('');
    setSubmitError('');
    setTypedText('');
    setKeystrokes([]);
    setStartTime(null);
    setEndTime(null);
    activeKeysRef.current = new Map();
    lastKeyUpTimeRef.current = null;
    previousKeyRef.current = null;
  };

  const handleStart = async () => {
    setIsStarting(true);
    setStartError('');
    setSubmitError('');
    resetCapture();

    try {
      const response = await keystrokeService.startTest();
      const apiPrompt = response?.data?.prompt;
      if (!apiPrompt) {
        throw new Error('Prompt not returned by backend');
      }

      setPrompt(apiPrompt);
    } catch (error) {
      setIsCapturing(false);
      setStartError(error?.response?.data?.message || error.message || 'Failed to start keystroke test');
      setIsStarting(false);
      return;
    }

    setIsCapturing(true);
    setIsStarting(false);
  };

  const handleStop = () => {
    setIsCapturing(false);
    activeKeysRef.current.clear();

    const snapshot = calculateDebugMetrics({ keystrokes, startTime, endTime, prompt, typedText });
    const recentEvents = keystrokes.slice(-15).map((k, index) => ({
      index: keystrokes.length - 15 + index + 1,
      key: k.key,
      previousKey: k.previousKey || '-',
      holdMs: Number(k.holdTime) || 0,
      flightMs: Number(k.flightTime) || 0,
      keyDownIso: Number.isFinite(k.keyDownTime) ? new Date(k.keyDownTime).toISOString() : '-',
      keyUpIso: Number.isFinite(k.keyUpTime) ? new Date(k.keyUpTime).toISOString() : '-',
    }));

    // console.group('[KeystrokeTest] Capture Stopped');
    // console.log('Session summary:', snapshot);
    // console.table(recentEvents);
    // console.log('Full keystrokes array:', keystrokes);
    // console.groupEnd();
  };

  const handleSubmit = async () => {
    if (!prompt || !typedText || !startTime || !endTime || keystrokes.length === 0) {
      setSubmitError('Please start, type the prompt, stop capture, and ensure events were recorded.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        prompt,
        typedText,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        keystrokes,
        testType: 'typing',
      };

      const assessmentId = localStorage.getItem('currentAssessmentId');
      const submitPayload = {
        ...payload,
        ...(assessmentId && { assessmentId })
      };

      // console.group('[KeystrokeTest] Submitting Payload');
      // console.log('Payload summary:', {
      //   promptLength: prompt.length,
      //   typedLength: typedText.length,
      //   eventCount: keystrokes.length,
      //   startTime: payload.startTime,
      //   endTime: payload.endTime,
      // });
      // console.log('Computed debug metrics:', calculateDebugMetrics({ keystrokes, startTime, endTime, prompt, typedText }));
      // console.groupEnd();

      const response = await keystrokeService.submitData(submitPayload);

      const submitResult = response?.data || null;
      setResult(submitResult);

      if (submitResult?.resultId) {
        navigate(`/assessment/keystroke/results/${submitResult.resultId}`);
      }

      // console.group('[KeystrokeTest] Submit Response');
      // console.log('Result payload:', response?.data || null);
      // console.groupEnd();
    } catch (error) {
      setSubmitError(error?.response?.data?.message || error.message || 'Failed to submit keystroke test');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (event) => {
    if (!isCapturing) return;
    if (event.repeat) {
      event.preventDefault();
      return;
    }
    if (IGNORED_KEYS.has(event.key)) return;

    const now = Date.now();
    if (!startTime) setStartTime(now);

    let flightTime = 0;
    if (lastKeyUpTimeRef.current !== null) {
      flightTime = Math.max(0, now - lastKeyUpTimeRef.current);
    }

    const key = normalizeKey(event.key);
    activeKeysRef.current.set(event.code, {
      key,
      keyDownTime: now,
      previousKey: previousKeyRef.current,
      flightTime,
    });
  };

  const handleKeyUp = (event) => {
    if (!isCapturing) return;
    if (IGNORED_KEYS.has(event.key)) return;

    const now = Date.now();
    const pending = activeKeysRef.current.get(event.code);
    if (!pending) return;

    const holdTime = now - pending.keyDownTime;
    const complete = {
      ...pending,
      keyUpTime: now,
      holdTime,
    };

    activeKeysRef.current.delete(event.code);
    lastKeyUpTimeRef.current = now;
    previousKeyRef.current = complete.key;
    setEndTime(now);
    setKeystrokes((prev) => [...prev, complete]);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: `url(${bgKeyboardTest})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
       
       
        
        py: { xs: 10, md: 0 }
      }}
    >
      <Container sx={{ width: '57%' }}>
        <Paper sx={{ p: 5, borderRadius: 5, bgcolor: '#F4F0FD', minHeight: '65vh' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
            <Box component="img" src={technologyIcon} alt="technology" sx={{ width: 42, height: 42, mt: 0.25 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#6C4DE6' }}>
                Keystroke Capture Test
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                This step captures raw key events only. Metrics and scoring are computed in backend.
              </Typography>
            </Box>
               {/* <Typography variant="body2" color='text.secondary' sx={{ mb:3 }}>
              Keystroke Capture Test
            </Typography> */}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box component="img" src={starRatingIcon} alt="prompt" sx={{ width: 35, height: 35 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#6C4DE6' }}>
              Prompt
            </Typography>
          </Box>
         
          <Typography variant="body2" color="text.secondary">
            {prompt || 'Press Start Capture to fetch a prompt from backend.'}
          </Typography>
          {startError ? (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {startError}
            </Typography>
          ) : null}
          {submitError ? (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              {submitError}
            </Typography>
          ) : null}

          <Stack direction="row" spacing={1.5} sx={{ mt: 2, mb: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={handleStart}
              disabled={isCapturing || isStarting}
              startIcon={<Box component="img" src={playIcon} alt="start" sx={{ width: 16, height: 16 }} />}
              sx={{ bgcolor: '#6C4DE6', boxShadow: '0 6px 14px rgba(108,77,230,0.35)', '&:hover': { bgcolor: '#5B3FE0' } }}
            >
              {isStarting ? 'Starting...' : 'Start Capture'}
            </Button>
            <Button
              variant="contained"
              onClick={handleStop}
              disabled={!isCapturing}
              startIcon={<Box component="img" src={stopIcon} alt="stop" sx={{ width: 16, height: 16 }} />}
              sx={{ bgcolor: '#ffffff', color: '#6C4DE6', boxShadow: '0 6px 14px rgba(108,77,230,0.2)' }}
            >
              Stop Capture
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isCapturing || isSubmitting || keystrokes.length === 0 || !typedText || !prompt}
              startIcon={<Box component="img" src={paperAirplaneIcon} alt="submit" sx={{ width: 16, height: 16 }} />}
              sx={{ bgcolor: '#6C4DE6', boxShadow: '0 6px 14px rgba(108,77,230,0.35)', '&:hover': { bgcolor: '#5B3FE0' } }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
            <Button
              variant="contained"
              onClick={resetCapture}
              startIcon={<Box  component="img" src={refreshIcon} alt="reset" sx={{ width: 16, height: 16 }} />}
              sx={{ bgcolor: '#ffffff', color: '#6C4DE6', boxShadow: '0 6px 14px rgba(108,77,230,0.2)' }}
            >
              Reset
            </Button>
          </Stack>

          <TextField
            disabled={!isCapturing}
            fullWidth
            multiline
            minRows={6}
            value={typedText}
            onChange={(e) => {
              if (!isCapturing) return;
              setTypedText(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            placeholder="Click Start Capture, then type here..."
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 6px 16px rgba(108,77,230,0.18)'
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none'
              }
            }}
          />

          <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Box component="img" src={focusIcon} alt="capturing" sx={{ width: 14, height: 14 }} />}
              sx={{ bgcolor: '#ffffff', color: '#6C4DE6', boxShadow: '0 4px 12px rgba(108,77,230,0.2)' }}
            >
              Capturing: {isCapturing ? 'Yes' : 'No'}
            </Button>
            <Button
              variant="contained"
              startIcon={<Box component="img" src={daysIcon} alt="events" sx={{ width: 14, height: 14 }} />}
              sx={{ bgcolor: '#ffffff', color: '#6C4DE6', boxShadow: '0 4px 12px rgba(108,77,230,0.2)' }}
            >
              Events: {keystrokes.length}
            </Button>
            <Button
              variant="contained"
              startIcon={<Box component="img" src={clockIcon} alt="duration" sx={{ width: 14, height: 14 }} />}
              sx={{ bgcolor: '#ffffff', color: '#6C4DE6', boxShadow: '0 4px 12px rgba(108,77,230,0.2)' }}
            >
              Duration: {totalDurationMs} ms
            </Button>
          </Stack>

          {/* {keystrokes.length > 0 ? (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Debug Metrics (Local)
              </Typography>
              <Typography variant="body2" color="text.secondary">Start: {debugMetrics.startIso || 'N/A'}</Typography>
              <Typography variant="body2" color="text.secondary">End: {debugMetrics.endIso || 'N/A'}</Typography>
              <Typography variant="body2" color="text.secondary">Avg Hold: {debugMetrics.avgHoldMs.toFixed(2)} ms</Typography>
              <Typography variant="body2" color="text.secondary">Avg Flight: {debugMetrics.avgFlightMs.toFixed(2)} ms</Typography>
              <Typography variant="body2" color="text.secondary">Avg Pause (&gt;2s): {debugMetrics.avgPauseMs.toFixed(2)} ms</Typography>
              <Typography variant="body2" color="text.secondary">Backspace Count: {debugMetrics.backspaceCount}</Typography>
              <Typography variant="body2" color="text.secondary">Backspace Rate: {debugMetrics.backspaceRate.toFixed(4)}</Typography>
              <Typography variant="body2" color="text.secondary">Pause Count: {debugMetrics.pauseCount}</Typography>
              <Typography variant="body2" color="text.secondary">Pause Frequency (per prompt word): {debugMetrics.pauseFrequencyPerWord.toFixed(4)}</Typography>
              <Typography variant="body2" color="text.secondary">WPM (Prompt): {debugMetrics.wpmByPrompt.toFixed(2)}</Typography>
              <Typography variant="body2" color="text.secondary">WPM (Typed): {debugMetrics.wpmByTyped.toFixed(2)}</Typography>

              <Box sx={{ mt: 2, maxHeight: 220, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Recent Key Events (Last 20)
                </Typography>
                {keystrokes.slice(-20).map((k, idx) => (
                  <Typography key={`${k.keyUpTime}-${idx}`} variant="caption" display="block" color="text.secondary">
                    {`#${Math.max(1, keystrokes.length - 19 + idx)} | key=${k.key} | prev=${k.previousKey || '-'} | hold=${Number(k.holdTime) || 0}ms | flight=${Number(k.flightTime) || 0}ms | down=${Number.isFinite(k.keyDownTime) ? new Date(k.keyDownTime).toISOString() : '-'} | up=${Number.isFinite(k.keyUpTime) ? new Date(k.keyUpTime).toISOString() : '-'}`}
                  </Typography>
                ))}
              </Box>
            </Box>
          ) : null} */}

          {/*
            Inline result UI intentionally disabled for cleaner flow.
            Fallback code is preserved below in case redirect-based results page is unavailable.

            {result ? (
              <Box sx={{ mt: 3 }}>
                <Paper elevation={2} sx={{ p: 2.5, mb: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6">Assessment Result</Typography>
                    <Chip
                      label={`Risk Level: ${result.riskLevel || 'N/A'}`}
                      color={getRiskColor(result.riskLevel)}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Paper>

                <Paper elevation={2} sx={{ p: 2.5, mb: 2.5 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Overall Risk Score
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.75 }}>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, Math.max(0, Number(result.riskScore) || 0))}
                        color={getRiskColor(result.riskLevel)}
                        sx={{ height: 14, borderRadius: 1 }}
                      />
                    </Box>
                    <Typography variant="h6" fontWeight="bold">
                      {Number.isFinite(result.riskScore) ? result.riskScore : 0}/100
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Final score combines rule-based risk and ML anomaly contribution.
                  </Typography>
                </Paper>

                <Grid container spacing={2} sx={{ mb: 2.5 }}>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">Accuracy</Typography>
                        <Typography variant="h5" fontWeight="bold">
                          {Number.isFinite(result.accuracy) ? `${result.accuracy.toFixed(2)}%` : 'N/A'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">Error Rate</Typography>
                        <Typography variant="h5" fontWeight="bold">
                          {Number.isFinite(result.errorRate) ? `${result.errorRate.toFixed(2)}%` : 'N/A'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">Anomaly Score</Typography>
                        <Typography variant="h5" fontWeight="bold">
                          {Number.isFinite(result.anomalyScore) ? result.anomalyScore.toFixed(3) : 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Is Anomalous: {result.isAnomalous ? 'Yes' : 'No'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            ) : null}

            {result?.riskBreakdown ? (
              <Paper elevation={2} sx={{ p: 2.5 }}>
                <Typography variant="h6" gutterBottom>
                  Risk Breakdown
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {Object.entries(result.riskBreakdown).map(([key, value]) => {
                  const numericValue = Math.min(100, Math.max(0, Number(value) || 0));
                  return (
                    <Box key={key} sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {formatBreakdownLabel(key)}
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {numericValue}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={numericValue}
                        color={numericValue >= 70 ? 'error' : numericValue >= 40 ? 'warning' : 'success'}
                        sx={{ height: 10, borderRadius: 1 }}
                      />
                    </Box>
                  );
                })}
              </Paper>
            ) : null}
          */}
        </Paper>
      </Container>
    </Box>
  );
}

export default KeystrokeTest;
