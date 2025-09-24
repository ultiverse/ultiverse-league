import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Stack,
} from '@mui/material';
import { ScheduleGameView, TeamSide } from '@ultiverse/shared-types';
import { TeamName } from '@/components/TeamName';

interface GameCardProps {
  game: ScheduleGameView;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamColor?: string;
  awayTeamColor?: string;
  onClick?: () => void;
}


export function GameCard({ game, homeTeamName, awayTeamName, homeTeamColor, awayTeamColor, onClick }: GameCardProps) {
  const gameDate = new Date(game.start);

  const timeDisplay = gameDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const dateDisplay = gameDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });


  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick
          ? {
              transform: 'translateY(-1px)',
              boxShadow: 3,
            }
          : {},
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3, flexGrow: 1 }}>
        {/* Time (prominent) */}
        <Typography
          variant="h5"
          component="div"
          sx={{
            fontWeight: 600,
            mb: 0.5,
            color: 'primary.main',
          }}
        >
          {timeDisplay}
        </Typography>

        {/* Date (subtle) */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          {dateDisplay}
        </Typography>

        {/* Teams */}
        <Box sx={{ mb: 3 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            justifyContent="center"
            flexWrap="wrap"
          >
            <TeamName
              name={homeTeamName}
              primaryColor={homeTeamColor}
              size="sm"
              variant="inline"
            />
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mx: 1 }}
            >
              vs
            </Typography>
            <TeamName
              name={awayTeamName}
              primaryColor={awayTeamColor}
              size="sm"
              variant="inline"
            />
          </Stack>
        </Box>

        {/* Field */}
        {game.field && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Chip
              label={`Field ${game.field}`}
              variant="outlined"
              size="small"
              sx={{
                borderColor: 'divider',
                color: 'text.secondary',
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}