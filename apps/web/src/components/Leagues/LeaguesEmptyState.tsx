import { Paper, Stack, Typography, Button } from '@mui/material';
import { Add as AddIcon, Link as LinkIcon } from '@mui/icons-material';

interface LeaguesEmptyStateProps {
  onConnectIntegration: () => void;
}

export function LeaguesEmptyState({ onConnectIntegration }: LeaguesEmptyStateProps) {
  return (
    <Paper
      sx={{
        p: 6,
        textAlign: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Stack spacing={3} alignItems="center">
        <Typography variant="h5" color="text.secondary">
          No leagues found
        </Typography>
        <Typography variant="body1" color="text.secondary" maxWidth="sm">
          Connect an integration like Ultimate Central to import your leagues, or create a new
          league in Ultiverse.
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<LinkIcon />}
            onClick={onConnectIntegration}
          >
            Connect Integration
          </Button>
          <Button variant="outlined" startIcon={<AddIcon />} disabled>
            Create League (Coming Soon)
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
