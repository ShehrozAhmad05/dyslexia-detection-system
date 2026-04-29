import { Box, Typography } from '@mui/material';
import PsychologyRoundedIcon from '@mui/icons-material/PsychologyRounded';
import CreateRoundedIcon from '@mui/icons-material/CreateRounded';
import KeyboardRoundedIcon from '@mui/icons-material/KeyboardRounded';
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';

const defaultOrbitItems = [
  { label: 'Handwriting', icon: CreateRoundedIcon, color: '#7FB4FF', ring: 1, start: 20 },
  { label: 'Keystroke', icon: KeyboardRoundedIcon, color: '#57D9BE', ring: 1, start: 200 },
  { label: 'Reading', icon: MenuBookRoundedIcon, color: '#A68CFF', ring: 2, start: 90 },
  { label: 'Memory', icon: MemoryRoundedIcon, color: '#F8AD6F', ring: 2, start: 270 }
];

function OrbitItem({ item, ringRadii }) {
  const Icon = item.icon;
  const radius = ringRadii[item.ring] ?? ringRadii[1];

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        transform: `rotate(${item.start}deg)`
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translateX(${radius}px)`
        }}
      >
        <Box
          sx={{
            width: 102,
            height: 44,
            borderRadius: '999px',
            px: 1.4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.8,
            color: '#FFFFFF',
            background: `linear-gradient(135deg, ${item.color}, rgba(18, 34, 68, 0.95))`,
            boxShadow: `0 0 20px ${item.color}55, 0 8px 18px rgba(11, 20, 42, 0.35)`,
            border: '1px solid rgba(255,255,255,0.22)',
            backdropFilter: 'blur(6px)'
          }}
        >
          <Icon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: '0.68rem', lineHeight: 1, fontWeight: 800, letterSpacing: 0.2 }}>
            {item.label}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function HeroOrbitSystem({ size = 380, items = defaultOrbitItems }) {
  const ringRadii = {
    1: Math.round(size * 0.26),
    2: Math.round(size * 0.38)
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '2px solid rgba(112, 181, 255, 0.65)',
          boxShadow: '0 0 30px rgba(112,181,255,0.45)'
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          inset: `${Math.round(size * 0.12)}px`,
          borderRadius: '50%',
          border: '2px solid rgba(115, 244, 215, 0.62)',
          boxShadow: '0 0 28px rgba(115,244,215,0.38)'
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: Math.round(size * 0.32),
          height: Math.round(size * 0.32),
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 28% 25%, rgba(129, 194, 255, 0.95), rgba(66, 110, 237, 0.95) 60%, rgba(37, 66, 148, 1) 100%)',
          boxShadow: '0 0 42px rgba(108,176,255,0.55), 0 10px 30px rgba(5,11,27,0.55)',
          border: '2px solid rgba(255,255,255,0.26)'
        }}
      >
        <PsychologyRoundedIcon sx={{ color: '#FFFFFF', fontSize: Math.round(size * 0.14) }} />
      </Box>

      {items.map((item) => (
        <OrbitItem key={item.label} item={item} ringRadii={ringRadii} />
      ))}

    </Box>
  );
}

export default HeroOrbitSystem;