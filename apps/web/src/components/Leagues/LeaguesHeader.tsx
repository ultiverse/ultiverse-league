import { Box, Stack, Typography, Button, Divider } from '@mui/material';
import { Add as AddIcon, Link as LinkIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface LeaguesHeaderProps {
  email: string;
  onRefresh: () => void;
  onConnectIntegration: () => void;
  isRefreshing?: boolean;
}

export function LeaguesHeader({
  email,
  onRefresh,
  onConnectIntegration,
  isRefreshing,
}: LeaguesHeaderProps) {
  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <div>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Your Leagues
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {email}
          </Typography>
        </div>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<LinkIcon />}
            onClick={onConnectIntegration}
          >
            Connect Integration
          </Button>
          <Button variant="outlined" startIcon={<AddIcon />} disabled>
            New League
          </Button>
        </Stack>
      </Stack>
      <Divider />
    </Box>
  );
}
