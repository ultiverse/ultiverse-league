import {
    Card,
    CardMedia,
    CardContent,
    Stack,
    Box,
    Typography,
    Chip,
} from '@mui/material';
import { People as PeopleIcon } from '@mui/icons-material';
import { TeamSummary } from '../types/api';
import { SourceBadge } from './SourceBadge.component';

interface TeamCardProps {
    team: TeamSummary;
    onClick?: (team: TeamSummary) => void;
    showSourceInfo?: boolean;
}

export function TeamCard({ team, onClick, showSourceInfo = false }: TeamCardProps) {
    const handleClick = () => {
        if (onClick) {
            onClick(team);
        }
    };

    return (
        <Card
            elevation={1}
            sx={{
                cursor: onClick ? 'pointer' : 'default',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': onClick ? {
                    elevation: 4,
                    transform: 'translateY(-4px)',
                } : undefined,
                transition: 'all 0.2s ease',
                overflow: 'hidden',
            }}
            onClick={handleClick}
        >
            {/* Top section: Team photo or color */}
            {team.photoUrl ? (
                <CardMedia
                    component="img"
                    height="160"
                    image={team.photoUrl}
                    alt={team.name}
                    sx={{
                        objectFit: 'cover',
                    }}
                />
            ) : (
                <Box
                    sx={{
                        height: 160,
                        background: team.altColour
                            ? `linear-gradient(135deg, ${team.colour} 0%, ${team.altColour} 100%)`
                            : team.colour,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                    }}
                >
                    {/* Source badge in top-right corner if enabled */}
                    {showSourceInfo && team.source && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                            }}
                        >
                            <SourceBadge
                                source={team.source}
                                integrationProvider={team.integrationProvider}
                                size="small"
                                showText={false}
                            />
                        </Box>
                    )}
                    {/* Team name overlay on color background */}
                    <Typography
                        variant="h4"
                        sx={{
                            color: 'white',
                            fontWeight: 700,
                            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                            px: 2,
                            textAlign: 'center',
                        }}
                    >
                        {team.name.split(' ').map(word => word[0]).join('').slice(0, 3).toUpperCase()}
                    </Typography>
                </Box>
            )}

            {/* Bottom section: Team info */}
            <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                <Stack spacing={1}>
                    <Typography
                        variant="h6"
                        fontWeight={600}
                        noWrap
                        title={team.name}
                    >
                        {team.name}
                    </Typography>

                    {team.division && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                        >
                            {team.division}
                        </Typography>
                    )}

                    {/* Player count */}
                    {team.playerCount !== undefined && (
                        <Chip
                            icon={<PeopleIcon />}
                            label={`${team.playerCount} player${team.playerCount !== 1 ? 's' : ''}`}
                            size="small"
                            variant="outlined"
                            sx={{ width: 'fit-content' }}
                        />
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}
