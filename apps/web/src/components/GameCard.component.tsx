import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    Divider,
} from '@mui/material';
import { TeamName } from './TeamName.component';
import { GameCardProps } from '../types/components';

export function GameCard({ game, homeTeamName, awayTeamName, homeTeamColor, awayTeamColor, venue, fieldSlot, onClick }: GameCardProps) {
    const gameDate = new Date(game.start);
    const timeDisplay = gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, });
    const dateDisplay = gameDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', });

    // Build field display text
    const getFieldDisplayText = () => {
        if (venue && fieldSlot) {
            return `${venue} - ${fieldSlot}`;
        }
        if (venue) {
            return venue;
        }
        if (fieldSlot) {
            return fieldSlot;
        }
        if (game.field) {
            return `Field ${game.field}`;
        }
        return null;
    };

    const fieldDisplayText = getFieldDisplayText();

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
                {fieldDisplayText && (
                    <Chip
                        label={fieldDisplayText}
                        variant="outlined"
                        size="small"
                        sx={{ mt: 1 }}
                    />
                )}
            </CardContent>
        </Card>
    );
}