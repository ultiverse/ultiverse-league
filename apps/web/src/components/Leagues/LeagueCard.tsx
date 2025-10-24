import {
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Box,
  useTheme,
  Button,
  CardActions,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import type { MeLeague } from '../../api/user';

interface LeagueCardProps {
  league: MeLeague;
  onSelect?: (league: MeLeague) => void;
}

export function LeagueCard({ league, onSelect }: LeagueCardProps) {
  const theme = useTheme();

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'UC':
        return theme.palette.integration.uc;
      case 'UV':
        return theme.palette.integration.ultiverse;
      case 'Z':
        return theme.palette.integration.zuluru;
      default:
        return theme.palette.integration.unknown;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  const getLastSyncedText = (lastSyncedAt?: string) => {
    if (!lastSyncedAt) return null;
    try {
      return `Synced ${formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}`;
    } catch {
      return null;
    }
  };

  const formatRole = (role: string) => {
    if (role === 'org_admin') return 'Admin';
    // Capitalize first letter
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const shouldShowOrganization = (orgName: string) => {
    // Hide auto-generated organization names
    return !orgName.startsWith('Organization for');
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
          cursor: 'pointer',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack spacing={2}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <Chip
                label={league.badge}
                size="small"
                sx={{
                  bgcolor: getBadgeColor(league.badge),
                  color: 'white',
                }}
              />
              {shouldShowOrganization(league.organization.name) && (
                <Typography variant="caption" color="text.secondary">
                  {league.organization.name}
                </Typography>
              )}
            </Stack>
            <Typography variant="h6" component="h3" fontWeight="bold">
              {league.name}
            </Typography>
          </Box>

          <Stack spacing={0.5}>
            {league.seasonStart && (
              <Typography variant="body2" color="text.secondary">
                {formatDate(league.seasonStart)}
                {league.seasonEnd && ` - ${formatDate(league.seasonEnd)}`}
              </Typography>
            )}
            {getLastSyncedText(league.lastSyncedAt) && (
              <Typography variant="caption" color="text.secondary">
                {getLastSyncedText(league.lastSyncedAt)}
              </Typography>
            )}
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            {league.roles.map((role) => (
              <Chip
                key={role}
                label={formatRole(role)}
                size="small"
                variant="outlined"
              />
            ))}
          </Stack>
        </Stack>
      </CardContent>
      {onSelect && (
        <CardActions sx={{ px: 2, pb: 2 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => onSelect(league)}
          >
            Select League
          </Button>
        </CardActions>
      )}
    </Card>
  );
}
