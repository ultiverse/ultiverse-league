import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface TypeBackground {
    page: string;
  }

  interface Palette {
    integration: {
      uc: string;
      ultiverse: string;
      zuluru: string;
      synced: string;
      unknown: string;
    };
    syncStatus: {
      synced: string;
      needsPull: string;
      needsPush: string;
      conflict: string;
      neverSynced: string;
    };
  }

  interface PaletteOptions {
    integration?: {
      uc?: string;
      ultiverse?: string;
      zuluru?: string;
      synced?: string;
      unknown?: string;
    };
    syncStatus?: {
      synced?: string;
      needsPull?: string;
      needsPush?: string;
      conflict?: string;
      neverSynced?: string;
    };
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
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
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
    integration: {
      uc: '#1976d2',
      ultiverse: '#7b1fa2',
      zuluru: '#4caf50',
      synced: '#ff9800',
      unknown: '#9e9e9e',
    },
    syncStatus: {
      synced: '#4caf50',
      needsPull: '#2196f3',
      needsPush: '#ff9800',
      conflict: '#f44336',
      neverSynced: '#9e9e9e',
    },
  },
});