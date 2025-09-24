import React from 'react';
import { Paper, Typography, Box, SxProps, Theme } from '@mui/material';

interface SectionProps {
  title?: string;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  headerActions?: React.ReactNode;
}

export function Section({ title, children, sx, headerActions }: SectionProps) {
  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        ...sx,
      }}
    >
      {(title || headerActions) && (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: title ? 3 : 2
        }}>
          {title && (
            <Typography variant="h6" component="h2">
              {title}
            </Typography>
          )}
          {headerActions && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {headerActions}
            </Box>
          )}
        </Box>
      )}
      {children}
    </Paper>
  );
}

export default Section;