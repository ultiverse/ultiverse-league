import React from 'react';
import {
    Card,
    CardContent,
    Stack,
    Box,
    Typography,
} from '@mui/material';
import { JerseyIcon } from '../assets/jersey-icon';
import { TeamSummary } from '../types/api';
import { SourceBadge, SyncStatusBadge } from './SourceBadge.component';

interface TeamCardProps {
    team: TeamSummary;
    onClick?: (team: TeamSummary) => void;
    showSourceInfo?: boolean;
}

export function TeamCard({ team, onClick, showSourceInfo = true }: TeamCardProps) {
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
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                '&:hover': onClick ? {
                    elevation: 3,
                    transform: 'translateY(-2px)',
                } : undefined,
                transition: 'all 0.2s ease',
            }}
            onClick={handleClick}
        >
            <CardContent>
                <Stack spacing={2}>
                    {/* Main team info */}
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <JerseyIcon
                            color={team.colour}
                            sx={{
                                fontSize: 28,
                                flexShrink: 0,
                            }}
                        />
                        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
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
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ lineHeight: 1 }}
                                    noWrap
                                >
                                    {team.division}
                                </Typography>
                            )}
                        </Box>
                    </Stack>

                    {/* Source and sync status */}
                    {showSourceInfo && (
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            {team.source ? (
                                <>
                                    <SourceBadge
                                        source={team.source}
                                        integrationProvider={team.integrationProvider}
                                        size="small"
                                        variant="outlined"
                                    />
                                    {team.syncStatus && (
                                        <SyncStatusBadge
                                            syncStatus={team.syncStatus}
                                            lastSynced={team.lastSynced}
                                            size="small"
                                        />
                                    )}
                                </>
                            ) : (
                                <Typography variant="caption" color="text.secondary">
                                    Loading integration status...
                                </Typography>
                            )}
                        </Stack>
                    )}

                    {/* Additional team info */}
                    {team.dateJoined && (
                        <Typography variant="caption" color="text.secondary">
                            Joined: {new Date(team.dateJoined).toLocaleDateString()}
                        </Typography>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}