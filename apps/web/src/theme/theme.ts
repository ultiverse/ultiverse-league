import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface TypeBackground {
    page: string;
  }
}

const baseTheme = createTheme({
  palette: {
    primary: {
      main: '#f05300',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#161919',
        },
      },
    },
  },
});

export const theme = createTheme({
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    background: {
      ...baseTheme.palette.background,
      page: '#f0f0f0',
    },
  },
});