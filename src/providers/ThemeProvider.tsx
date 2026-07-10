'use client';

import { createTheme, ThemeProvider as MuiThemeProvider, alpha } from '@mui/material/styles';
import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
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

/**
 * デザイントークン — 「ミッションコントロール」
 * 深いネイビーを基調に、スカイシアンをアクセントにした運航管理ダッシュボードの配色。
 */
const tokens = {
  light: {
    primary: '#0284c7',
    primaryLight: '#38bdf8',
    primaryDark: '#0369a1',
    background: '#f4f7fb',
    paper: '#ffffff',
    paperElevated: '#ffffff',
    border: '#dde5f0',
    textPrimary: '#0b1424',
    textSecondary: '#5a6b84',
  },
  dark: {
    primary: '#38bdf8',
    primaryLight: '#7dd3fc',
    primaryDark: '#0ea5e9',
    background: '#0a1120',
    paper: '#0f1a2e',
    paperElevated: '#14213a',
    border: '#1e2d4a',
    textPrimary: '#e8eefb',
    textSecondary: '#8da2c0',
  },
} as const;

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

  const theme = useMemo(() => {
    const t = tokens[mode];
    const isDark = mode === 'dark';

    return createTheme({
      palette: {
        mode,
        primary: {
          main: t.primary,
          light: t.primaryLight,
          dark: t.primaryDark,
        },
        secondary: {
          main: isDark ? '#fbbf24' : '#d97706',
        },
        background: {
          default: t.background,
          paper: t.paper,
        },
        success: {
          main: isDark ? '#34d399' : '#059669',
        },
        warning: {
          main: isDark ? '#fbbf24' : '#d97706',
        },
        error: {
          main: isDark ? '#fb7185' : '#e11d48',
        },
        divider: t.border,
        text: {
          primary: t.textPrimary,
          secondary: t.textSecondary,
        },
      },
      typography: {
        fontFamily: 'var(--font-sans), system-ui, sans-serif',
        h5: { fontWeight: 900, letterSpacing: '-0.02em' },
        h6: { fontWeight: 700, letterSpacing: '-0.01em' },
        subtitle1: { fontWeight: 700, letterSpacing: '-0.01em' },
        subtitle2: { fontWeight: 700 },
        button: { fontWeight: 700, letterSpacing: '0.02em' },
        overline: {
          fontWeight: 700,
          letterSpacing: '0.12em',
          fontSize: '0.65rem',
        },
      },
      shape: {
        borderRadius: 10,
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: t.background,
              color: t.textPrimary,
              transition: 'background-color 0.3s ease, color 0.3s ease',
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 10,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-1px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            },
            containedPrimary: {
              color: isDark ? '#04121f' : '#ffffff',
              background: isDark
                ? 'linear-gradient(135deg, #7dd3fc 0%, #38bdf8 55%, #0ea5e9 100%)'
                : 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 55%, #0369a1 100%)',
              boxShadow: `0 6px 18px ${alpha(t.primary, 0.35)}`,
              '&:hover': {
                boxShadow: `0 8px 22px ${alpha(t.primary, 0.45)}`,
              },
            },
            containedError: {
              background: isDark
                ? 'linear-gradient(135deg, #fb7185 0%, #f43f5e 100%)'
                : 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
              boxShadow: `0 6px 18px ${alpha('#f43f5e', 0.35)}`,
            },
            outlined: {
              borderColor: t.border,
              '&:hover': {
                borderColor: t.primary,
                backgroundColor: alpha(t.primary, 0.06),
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
              transition: 'box-shadow 0.3s ease, background-color 0.3s ease',
            },
            outlined: {
              borderColor: t.border,
            },
            elevation1: {
              boxShadow: isDark
                ? '0 2px 10px rgba(0, 0, 0, 0.45)'
                : '0 2px 10px rgba(11, 20, 36, 0.07)',
            },
            elevation4: {
              boxShadow: isDark
                ? '0 12px 32px rgba(0, 0, 0, 0.55)'
                : '0 12px 32px rgba(11, 20, 36, 0.14)',
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              fontWeight: 700,
              borderRadius: 8,
            },
            outlined: {
              borderColor: t.border,
            },
          },
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              backgroundColor: isDark ? '#1c2c4c' : '#12203a',
              color: '#e8eefb',
              fontSize: '0.72rem',
              fontWeight: 500,
              borderRadius: 8,
              padding: '6px 10px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            },
            arrow: {
              color: isDark ? '#1c2c4c' : '#12203a',
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 10,
                transition: 'all 0.2s ease',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: t.border,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: t.primary,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderWidth: 2,
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
                backgroundColor: alpha(t.primary, 0.12),
              },
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              borderColor: t.border,
            },
          },
        },
        MuiTableRow: {
          styleOverrides: {
            root: {
              '&.Mui-selected': {
                backgroundColor: alpha(t.primary, isDark ? 0.16 : 0.1),
                '&:hover': {
                  backgroundColor: alpha(t.primary, isDark ? 0.22 : 0.16),
                },
              },
            },
          },
        },
        MuiToggleButtonGroup: {
          styleOverrides: {
            root: {
              backgroundColor: isDark
                ? alpha('#0a1120', 0.6)
                : alpha('#e6edf7', 0.9),
              borderRadius: 9,
              padding: 2,
              gap: 2,
            },
          },
        },
        MuiToggleButton: {
          styleOverrides: {
            root: {
              border: 'none',
              borderRadius: '7px !important',
              textTransform: 'none',
              fontWeight: 700,
              color: t.textSecondary,
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                backgroundColor: t.paperElevated,
                color: t.primary,
                boxShadow: isDark
                  ? '0 2px 8px rgba(0, 0, 0, 0.4)'
                  : '0 2px 8px rgba(11, 20, 36, 0.12)',
                '&:hover': {
                  backgroundColor: t.paperElevated,
                },
              },
            },
          },
        },
        MuiSlider: {
          styleOverrides: {
            root: {
              height: 5,
            },
            thumb: {
              width: 16,
              height: 16,
              boxShadow: `0 2px 8px ${alpha(t.primary, 0.5)}`,
              '&:hover, &.Mui-focusVisible': {
                boxShadow: `0 0 0 6px ${alpha(t.primary, 0.16)}`,
              },
            },
            rail: {
              opacity: 0.25,
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: 18,
              border: `1px solid ${t.border}`,
              backgroundImage: isDark
                ? 'linear-gradient(180deg, #14213a 0%, #0f1a2e 100%)'
                : 'linear-gradient(180deg, #ffffff 0%, #f7fafd 100%)',
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              borderRight: `1px solid ${t.border}`,
              backgroundColor: t.paper,
            },
          },
        },
        MuiLinearProgress: {
          styleOverrides: {
            root: {
              borderRadius: 4,
              backgroundColor: alpha(t.primary, 0.15),
            },
            bar: {
              borderRadius: 4,
              background: isDark
                ? 'linear-gradient(90deg, #38bdf8, #7dd3fc)'
                : 'linear-gradient(90deg, #0284c7, #38bdf8)',
            },
          },
        },
        MuiAlert: {
          styleOverrides: {
            root: {
              borderRadius: 10,
            },
          },
        },
      },
    });
  }, [mode]);

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
