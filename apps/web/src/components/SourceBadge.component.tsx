import { Box, Chip, Tooltip, Stack, useTheme } from '@mui/material';
import { DataSource, IntegrationProvider } from '../types/api';

// Extend the theme type to include our custom palette properties
interface CustomTheme {
  palette: {
    integration: {
      uc: string;
      ultiverse: string;
      zuluru: string;
      synced: string;
      unknown: string;
    };
    syncStatus: {
      synced: string;
      needsPull: string;
      needsPush: string;
      conflict: string;
      neverSynced: string;
    };
  };
}

interface SourceBadgeProps {
    source?: DataSource;
    integrationProvider?: IntegrationProvider;
    size?: 'small' | 'medium';
    showText?: boolean;
    variant?: 'filled' | 'outlined';
}

interface ProviderConfig {
    name: string;
    shortName: string;
    color: string;
    iconText: string;
}

const getProviderConfigs = (theme: CustomTheme): Record<IntegrationProvider, ProviderConfig> => ({
    uc: {
        name: 'Ultimate Central',
        shortName: 'UC',
        color: theme.palette.integration.uc,
        iconText: 'UC',
    },
    zuluru: {
        name: 'Zuluru',
        shortName: 'Zuluru',
        color: theme.palette.integration.zuluru,
        iconText: 'ZU',
    },
});

const getSourceConfigs = (theme: CustomTheme): Record<DataSource, { name: string; color: string; }> => ({
    ultiverse: {
        name: 'Ultiverse',
        color: theme.palette.integration.ultiverse,
    },
    uc: {
        name: 'Ultimate Central',
        color: theme.palette.integration.uc,
    },
    zuluru: {
        name: 'Zuluru',
        color: theme.palette.integration.zuluru,
    },
    both: {
        name: 'Synced',
        color: theme.palette.integration.synced,
    },
});

export function SourceBadge({
    source,
    integrationProvider,
    size = 'medium',
    showText = true,
    variant = 'filled'
}: SourceBadgeProps) {
    const theme = useTheme() as CustomTheme;
    const PROVIDER_CONFIGS = getProviderConfigs(theme);
    const SOURCE_CONFIGS = getSourceConfigs(theme);

    const getSourceInfo = () => {
        // Handle undefined or null source
        if (!source) {
            return {
                name: 'Unknown',
                color: theme.palette.integration.unknown,
                iconText: '?',
                tooltip: 'Unknown data source',
            };
        }
        if (source === 'both') {
            return {
                name: 'Synced',
                color: SOURCE_CONFIGS.both.color,
                iconText: '⇄',
                tooltip: 'This data is synced between Ultiverse and external providers',
            };
        }

        if (source === 'ultiverse') {
            return {
                name: 'Ultiverse',
                color: SOURCE_CONFIGS.ultiverse.color,
                iconText: 'UV',
                tooltip: 'Local Ultiverse data (not synced)',
            };
        }

        // For external sources, use the provider config
        if (integrationProvider && PROVIDER_CONFIGS[integrationProvider]) {
            const provider = PROVIDER_CONFIGS[integrationProvider];
            return {
                name: provider.name,
                color: provider.color,
                iconText: provider.iconText,
                tooltip: `Data from ${provider.name}`,
            };
        }

        // Fallback to source config
        const sourceConfig = SOURCE_CONFIGS[source];
        if (!sourceConfig) {
            // Ultimate fallback for unknown sources
            const safeName = source || 'unknown';
            return {
                name: safeName.charAt(0).toUpperCase() + safeName.slice(1),
                color: theme.palette.integration.unknown,
                iconText: safeName.toUpperCase().substring(0, 2),
                tooltip: `Data from ${safeName}`,
            };
        }

        return {
            name: sourceConfig.name,
            color: sourceConfig.color,
            iconText: source.toUpperCase().substring(0, 2),
            tooltip: `Data from ${sourceConfig.name}`,
        };
    };

    const sourceInfo = getSourceInfo();

    if (!showText) {
        // Icon-only version
        return (
            <Tooltip title={sourceInfo.tooltip}>
                <Box
                    sx={{
                        width: size === 'small' ? 20 : 24,
                        height: size === 'small' ? 20 : 24,
                        borderRadius: 0.5,
                        bgcolor: sourceInfo.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: size === 'small' ? '0.6rem' : '0.7rem',
                        flexShrink: 0,
                    }}
                >
                    {sourceInfo.iconText}
                </Box>
            </Tooltip>
        );
    }

    // Chip version with text
    return (
        <Tooltip title={sourceInfo.tooltip}>
            <Chip
                label={sourceInfo.name}
                size={size === 'small' ? 'small' : 'medium'}
                variant={variant}
                sx={{
                    bgcolor: variant === 'filled' ? sourceInfo.color : 'transparent',
                    color: variant === 'filled' ? 'white' : sourceInfo.color,
                    borderColor: variant === 'outlined' ? sourceInfo.color : undefined,
                    fontWeight: 'medium',
                    '& .MuiChip-label': {
                        px: 1,
                    },
                }}
            />
        </Tooltip>
    );
}

interface SyncStatusBadgeProps {
    syncStatus?: 'synced' | 'needs_pull' | 'needs_push' | 'conflict' | 'never_synced';
    size?: 'small' | 'medium';
    lastSynced?: string | null;
}

export function SyncStatusBadge({ syncStatus, size = 'medium', lastSynced }: SyncStatusBadgeProps) {
    const theme = useTheme() as CustomTheme;

    const getStatusInfo = () => {
        // Handle undefined or null syncStatus
        if (!syncStatus) {
            return {
                label: 'Unknown',
                color: theme.palette.syncStatus.neverSynced,
                tooltip: 'Unknown sync status',
            };
        }

        switch (syncStatus) {
            case 'synced':
                return {
                    label: 'Synced',
                    color: theme.palette.syncStatus.synced,
                    tooltip: lastSynced ? `Last synced: ${new Date(lastSynced).toLocaleString()}` : 'Data is synced',
                };
            case 'needs_pull':
                return {
                    label: 'Pull Available',
                    color: theme.palette.syncStatus.needsPull,
                    tooltip: 'New changes available from external source',
                };
            case 'needs_push':
                return {
                    label: 'Push Pending',
                    color: theme.palette.syncStatus.needsPush,
                    tooltip: 'Local changes ready to push to external source',
                };
            case 'conflict':
                return {
                    label: 'Conflict',
                    color: theme.palette.syncStatus.conflict,
                    tooltip: 'Data conflicts need resolution',
                };
            case 'never_synced':
                return {
                    label: 'Not Synced',
                    color: theme.palette.syncStatus.neverSynced,
                    tooltip: 'Never been synced with external sources',
                };
            default:
                return {
                    label: 'Unknown',
                    color: theme.palette.syncStatus.neverSynced,
                    tooltip: 'Unknown sync status',
                };
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <Tooltip title={statusInfo.tooltip}>
            <Chip
                label={statusInfo.label}
                size={size}
                variant="outlined"
                sx={{
                    borderColor: statusInfo.color,
                    color: statusInfo.color,
                    fontWeight: 'medium',
                    '& .MuiChip-label': {
                        px: 1,
                    },
                }}
            />
        </Tooltip>
    );
}

interface CombinedSourceBadgeProps {
    source?: DataSource;
    syncStatus?: 'synced' | 'needs_pull' | 'needs_push' | 'conflict' | 'never_synced';
    integrationProvider?: IntegrationProvider;
    lastSynced?: string | null;
    size?: 'small' | 'medium';
    layout?: 'stacked' | 'inline';
}

export function CombinedSourceBadge({
    source,
    syncStatus,
    integrationProvider,
    lastSynced,
    size = 'medium',
    layout = 'inline'
}: CombinedSourceBadgeProps) {
    if (layout === 'stacked') {
        return (
            <Stack spacing={0.5} alignItems="flex-start">
                <SourceBadge
                    source={source}
                    integrationProvider={integrationProvider}
                    size={size}
                />
                <SyncStatusBadge
                    syncStatus={syncStatus}
                    lastSynced={lastSynced}
                    size={size}
                />
            </Stack>
        );
    }

    return (
        <Stack direction="row" spacing={1} alignItems="center">
            <SourceBadge
                source={source}
                integrationProvider={integrationProvider}
                size={size}
            />
            <SyncStatusBadge
                syncStatus={syncStatus}
                lastSynced={lastSynced}
                size={size}
            />
        </Stack>
    );
}