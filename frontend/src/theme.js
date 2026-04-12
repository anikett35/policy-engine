import { createTheme, alpha } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4f6ef7',
      light: '#7b91f9',
      dark: '#3a54c4',
      contrastText: '#fff',
    },
    secondary: {
      main: '#7c3aed',
      light: '#a78bfa',
      dark: '#5b21b6',
      contrastText: '#fff',
    },
    success: {
      main: '#16a34a',
      light: '#dcfce7',
      dark: '#166534',
    },
    error: {
      main: '#dc2626',
      light: '#fee2e2',
      dark: '#991b1b',
    },
    warning: {
      main: '#d97706',
      light: '#fef9c3',
      dark: '#854d0e',
    },
    info: {
      main: '#0891b2',
      light: '#e0f2fe',
      dark: '#075985',
    },
    background: {
      default: '#f8f9fb',
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      disabled: '#9ca3af',
    },
    divider: '#e4e7ed',
    action: {
      hover: 'rgba(79, 110, 247, 0.04)',
      selected: 'rgba(79, 110, 247, 0.08)',
    },
  },

  typography: {
    fontFamily: '"Inter", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: { fontWeight: 700, fontSize: '1.75rem', lineHeight: 1.3, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, fontSize: '1.375rem', lineHeight: 1.3, letterSpacing: '-0.01em' },
    h3: { fontWeight: 700, fontSize: '1.125rem', lineHeight: 1.4 },
    h4: { fontWeight: 700, fontSize: '1rem', lineHeight: 1.4 },
    h5: { fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.5 },
    h6: { fontWeight: 600, fontSize: '0.8125rem', lineHeight: 1.5 },
    subtitle1: { fontWeight: 500, fontSize: '0.875rem', lineHeight: 1.5, color: '#6b7280' },
    subtitle2: { fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.5, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' },
    body1: { fontSize: '0.875rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.6 },
    caption: { fontSize: '0.6875rem', lineHeight: 1.5, color: '#9ca3af' },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '0.8125rem' },
    overline: { fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' },
  },

  shape: {
    borderRadius: 12,
  },

  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.04)',
    '0 2px 8px rgba(0,0,0,0.06)',
    '0 4px 16px rgba(0,0,0,0.08)',
    '0 6px 24px rgba(0,0,0,0.10)',
    '0 8px 32px rgba(0,0,0,0.12)',
    ...Array(19).fill('0 8px 32px rgba(0,0,0,0.12)'),
  ],

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box' },
        body: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
        '::-webkit-scrollbar': { width: 6, height: 6 },
        '::-webkit-scrollbar-track': { background: 'transparent' },
        '::-webkit-scrollbar-thumb': { background: '#d1d5db', borderRadius: 99 },
        '::-webkit-scrollbar-thumb:hover': { background: '#9ca3af' },
        '@keyframes spin': { to: { transform: 'rotate(360deg)' } },
        '@keyframes fadeInUp': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '@keyframes shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        '@keyframes dotPulse': {
          '0%, 100%': { opacity: 0.25, transform: 'scale(0.9)' },
          '50%': { opacity: 1, transform: 'scale(1.1)' },
        },
        '@keyframes dotBounce': {
          '0%, 100%': { transform: 'translateY(0)', opacity: 0.35 },
          '50%': { transform: 'translateY(-4px)', opacity: 1 },
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 18px',
          fontWeight: 600,
          fontSize: '0.8125rem',
          transition: 'all 0.15s ease',
        },
        contained: {
          boxShadow: '0 2px 8px rgba(79,110,247,0.25)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(79,110,247,0.35)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: '#e4e7ed',
          color: '#374151',
          '&:hover': { borderColor: '#4f6ef7', color: '#4f6ef7', background: 'rgba(79,110,247,0.04)' },
        },
        sizeSmall: { padding: '5px 12px', fontSize: '0.75rem' },
      },
    },

    MuiCard: {
      defaultProps: { elevation: 1 },
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid #e4e7ed',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          '&:hover': { boxShadow: '0 4px 20px rgba(79,110,247,0.08)' },
        },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { borderRadius: 14 },
      },
    },

    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            fontSize: '0.8125rem',
            background: '#f9fafb',
            transition: 'all 0.15s',
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#a5b4fc' },
            '&.Mui-focused': { background: '#fff' },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#4f6ef7',
              borderWidth: 1.5,
            },
          },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e4e7ed' },
          '& .MuiInputLabel-root': { fontSize: '0.8125rem' },
        },
      },
    },

    MuiSelect: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: { borderRadius: 10, fontSize: '0.8125rem' },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.6875rem', height: 24 },
        sizeSmall: { height: 20, fontSize: '0.625rem' },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.8125rem',
          minHeight: 40,
          '&.Mui-selected': { fontWeight: 600 },
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: { height: 2.5, borderRadius: 2 },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: { fontSize: '0.8125rem', borderColor: '#f3f4f6', padding: '10px 16px' },
        head: {
          fontWeight: 600,
          fontSize: '0.6875rem',
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          background: '#fafafa',
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16 },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: '1px solid #e4e7ed', boxShadow: 'none' },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '1px 0',
          padding: '8px 12px',
          transition: 'all 0.15s',
          '&.Mui-selected': {
            background: alpha('#4f6ef7', 0.08),
            border: `1px solid ${alpha('#4f6ef7', 0.2)}`,
            '&:hover': { background: alpha('#4f6ef7', 0.12) },
          },
          '&:hover': { background: alpha('#4f6ef7', 0.04) },
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 99, height: 6 },
        bar: { borderRadius: 99 },
      },
    },

    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(79,110,247,0.35)',
          '&:hover': { boxShadow: '0 6px 28px rgba(79,110,247,0.45)' },
        },
      },
    },

    MuiSkeleton: {
      defaultProps: { animation: 'wave' },
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },

    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          fontSize: '0.75rem',
        },
      },
    },

    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #e4e7ed',
          borderRadius: '14px !important',
          '&::before': { display: 'none' },
          '&.Mui-expanded': { margin: 0 },
        },
      },
    },

    MuiAccordionSummary: {
      styleOverrides: {
        root: { padding: '4px 18px', minHeight: 56 },
        content: { margin: '12px 0' },
      },
    },
  },
});

export default theme;
