import { createTheme } from '@mui/material/styles';

export const getAppTheme = (mode = 'light') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: '#2f6bff',
        light: '#5b8cff',
        dark: '#1e50d8',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#8b5cf6',
        light: '#a78bfa',
        dark: '#7c3aed',
      },
      success: {
        main: '#10b981',
        light: '#34d399',
        dark: '#059669',
      },
      warning: {
        main: '#f59e0b',
        light: '#fbbf24',
        dark: '#d97706',
      },
      error: {
        main: '#ef4444',
        light: '#f87171',
        dark: '#dc2626',
      },
      background: {
        default: mode === 'dark' ? '#0b0f19' : '#f4f6fb',
        paper: mode === 'dark' ? '#131c2e' : '#ffffff',
      },
      text: {
        primary: mode === 'dark' ? '#f8fafc' : '#0f172a',
        secondary: mode === 'dark' ? '#94a3b8' : '#64748b',
      },
      divider: mode === 'dark' ? '#1e293b' : '#e8ecf4',
    },
    typography: {
      fontFamily: '"Inter Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 14,
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 700 },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 10,
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '13px',
            transition: 'all 0.18s ease-in-out',
          },
          containedPrimary: {
            '&:hover': {
              backgroundColor: '#2256d6',
            },
          },
          outlined: {
            borderColor: mode === 'dark' ? '#263852' : '#e2e8f0',
            color: mode === 'dark' ? '#e2e8f0' : '#1e293b',
            '&:hover': {
              borderColor: '#2f6bff',
              backgroundColor: mode === 'dark' ? 'rgba(47, 107, 255, 0.08)' : 'rgba(47, 107, 255, 0.05)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            backgroundImage: 'none',
            border: `1px solid ${mode === 'dark' ? '#1e293b' : '#e8ecf4'}`,
            boxShadow: mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 2px 10px rgba(15, 23, 42, 0.03)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#e8ecf4'}`,
            fontSize: '13px',
            padding: '12px 14px',
          },
          head: {
            fontWeight: 700,
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: mode === 'dark' ? '#94a3b8' : '#64748b',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            fontSize: '11px',
            height: '24px',
            borderRadius: '999px',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '13px',
            minHeight: '42px',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            backgroundImage: 'none',
          },
        },
      },
    },
  });
