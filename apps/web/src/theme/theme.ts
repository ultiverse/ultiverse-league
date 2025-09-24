import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#f05300',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
      page: '#f0f0f0',
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