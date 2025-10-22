import { Paper, Typography, Stack, Chip } from '@mui/material';
import type { MeConnection } from '../../api/user';

interface ConnectionStatusProps {
  connections: MeConnection[];
}

export function ConnectionStatus({ connections }: ConnectionStatusProps) {
  const activeConnections = connections.filter((c) => c.status === 'active');

  if (activeConnections.length === 0) {
    return null;
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Connected Integrations
      </Typography>
      <Stack direction="row" spacing={1}>
        {activeConnections.map((conn) => (
          <Chip
            key={conn.provider}
            label={conn.provider.toUpperCase()}
            color="success"
            size="small"
          />
        ))}
      </Stack>
    </Paper>
  );
}
