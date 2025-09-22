import {
  Box,
  Typography,
  Paper,
  Alert,
} from '@mui/material';

export function Settings() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Alert severity="info">
          Settings page is under construction. Configuration options will be added here.
        </Alert>
      </Paper>
    </Box>
  );
}