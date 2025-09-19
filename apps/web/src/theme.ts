import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1b5e20' },   // forest green (you can tweak)
    secondary: { main: '#c97c2c' }  // rust-ish
  },
  shape: { borderRadius: 16 }
});
