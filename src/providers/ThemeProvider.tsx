'use client';

import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CssBaseline } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem('theme') as ThemeMode;
    if (savedMode) {
      setMode(savedMode);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('theme', mode);
      document.documentElement.classList.toggle('dark', mode === 'dark');
    }
  }, [mode, mounted]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'dark' ? '#60a5fa' : '#3b82f6',
        light: mode === 'dark' ? '#93c5fd' : '#60a5fa',
        dark: mode === 'dark' ? '#3b82f6' : '#2563eb',
      },
      secondary: {
        main: mode === 'dark' ? '#fbbf24' : '#f59e0b',
      },
      background: {
        default: mode === 'dark' ? '#0f172a' : '#f8fafc',
        paper: mode === 'dark' ? '#1e293b' : '#ffffff',
      },
      success: {
        main: mode === 'dark' ? '#34d399' : '#10b981',
      },
      error: {
        main: mode === 'dark' ? '#f87171' : '#ef4444',
      },
      text: {
        primary: mode === 'dark' ? '#f1f5f9' : '#0f172a',
        secondary: mode === 'dark' ? '#94a3b8' : '#64748b',
      },
    },
    typography: {
      fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
      h6: {
        fontWeight: 700,
        letterSpacing: '-0.01em',
      },
      subtitle1: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      button: {
        fontWeight: 600,
        letterSpacing: '0.02em',
      },
    },
    shape: {
      borderRadius: 8,
    },
    shadows: [
      'none',
      mode === 'dark'
        ? '0px 2px 4px rgba(0, 0, 0, 0.4)'
        : '0px 2px 4px rgba(15, 23, 42, 0.08)',
      mode === 'dark'
        ? '0px 4px 8px rgba(0, 0, 0, 0.4)'
        : '0px 4px 8px rgba(15, 23, 42, 0.1)',
      mode === 'dark'
        ? '0px 8px 16px rgba(0, 0, 0, 0.4)'
        : '0px 8px 16px rgba(15, 23, 42, 0.12)',
      ...Array(21).fill('none'),
    ] as any,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: mode === 'dark' ? '#0f172a' : '#f8fafc',
            color: mode === 'dark' ? '#f1f5f9' : '#0f172a',
            transition: 'background-color 0.3s ease, color 0.3s ease',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 8,
            padding: '8px 16px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: mode === 'dark'
                ? '0 4px 12px rgba(96, 165, 250, 0.3)'
                : '0 4px 12px rgba(59, 130, 246, 0.2)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          containedPrimary: {
            background: mode === 'dark'
              ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            '&:hover': {
              background: mode === 'dark'
                ? 'linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%)'
                : 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
            },
          },
          containedError: {
            background: mode === 'dark'
              ? 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)'
              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            transition: 'box-shadow 0.3s ease',
            backgroundImage: 'none',
          },
          elevation1: {
            boxShadow: mode === 'dark'
              ? '0 2px 8px rgba(0, 0, 0, 0.4)'
              : '0 2px 8px rgba(15, 23, 42, 0.08)',
          },
          elevation3: {
            boxShadow: mode === 'dark'
              ? '0 4px 16px rgba(0, 0, 0, 0.5)'
              : '0 4px 16px rgba(15, 23, 42, 0.1)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              transition: 'all 0.2s ease',
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: mode === 'dark' ? '#60a5fa' : '#3b82f6',
                },
              },
              '&.Mui-focused': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderWidth: 2,
                },
              },
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: mode === 'dark'
                ? 'rgba(96, 165, 250, 0.1)'
                : 'rgba(59, 130, 246, 0.1)',
              transform: 'scale(1.05)',
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: mode === 'dark' ? '#334155' : '#e2e8f0',
          },
        },
      },
    },
  });

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}