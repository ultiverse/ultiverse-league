import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    Divider,
} from '@mui/material';
import { ScheduleGameView } from '@ultiverse/shared-types';
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
    const timeDisplay = gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, });
    const dateDisplay = gameDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', });

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease-in-out',
                '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 5, } : {},
                borderRadius: 2,
                borderTop: homeTeamColor ? `4px solid ${homeTeamColor}` : 'none',
            }}
            onClick={onClick}
        >
            <CardContent sx={{ p: 3, flexGrow: 1, textAlign: 'center' }}>
                {/* Teams Section */}
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 2, // A bit of space between items
                        mb: 2,
                    }}
                >
                    <TeamName
                        name={homeTeamName}
                        primaryColor={homeTeamColor}
                        size="md"
                        variant="inline"
                        sx={{ minWidth: '40%' }} // Allow wrapping
                    />
                    <Typography
                        variant="h6"
                        sx={{ fontWeight: 'bold', color: 'text.secondary' }}
                    >
                        vs
                    </Typography>
                    <TeamName
                        name={awayTeamName}
                        primaryColor={awayTeamColor}
                        size="md"
                        variant="inline"
                        sx={{ minWidth: '40%' }} // Allow wrapping
                    />
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Date and Time */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {`${dateDisplay} at ${timeDisplay}`}
                </Typography>

                {/* Field Chip */}
                {game.field && (
                    <Chip
                        label={`Field ${game.field}`}
                        variant="outlined"
                        size="small"
                        sx={{ mt: 1 }}
                    />
                )}
            </CardContent>
        </Card>
    );
}