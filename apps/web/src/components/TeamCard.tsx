import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
} from '@mui/material';
import { TeamSummary } from '../api/uc';

interface TeamCardProps {
  team: TeamSummary;
  teamPhoto?: string; // Optional team photo URL
  onClick?: () => void;
}

export function TeamCard({ team, teamPhoto, onClick }: TeamCardProps) {
  const hasPhoto = Boolean(teamPhoto);

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        overflow: 'hidden',
        '&:hover': onClick
          ? {
              transform: 'translateY(-2px)',
              boxShadow: 4,
            }
          : {},
      }}
      onClick={onClick}
    >
      {/* Team jersey colors */}
      <Box
        sx={{
          height: 12,
          display: 'flex',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        {/* Primary jersey color */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: team.colour,
          }}
        />
        {/* Secondary jersey color */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: team.altColour,
          }}
        />
      </Box>

      {hasPhoto && (
        <CardMedia
          component="img"
          height="200"
          image={teamPhoto}
          alt={`${team.name} team photo`}
          sx={{
            objectFit: 'cover',
          }}
        />
      )}

      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Typography
          variant="h6"
          component="h2"
          sx={{
            fontWeight: 600,
            lineHeight: 1.2,
            mb: 2,
          }}
        >
          {team.name}
        </Typography>

        {/* Team joined info for past teams */}
        {team.dateJoined && team.monthYear && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="body2" color="text.secondary">
              Joined: {team.monthYear}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}