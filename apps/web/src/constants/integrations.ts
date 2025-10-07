import { IntegrationProvider } from '../api/integrations';
import { theme } from '../theme/theme';

// Available integration configurations
export const AVAILABLE_INTEGRATIONS: IntegrationProvider[] = [
    {
        provider: 'uc',
        name: 'Ultimate Central',
        description: 'Your ultimate frisbee league management platform. Sync teams, games, and player data.',
        iconText: 'UC',
        primaryColor: theme.palette.integration.uc,
        features: ['Teams', 'Games', 'Players', 'League Info'],
        authType: 'oauth',
        isAvailable: true,
    },
    {
        provider: 'zuluru',
        name: 'Zuluru',
        description: 'Connect with Zuluru league management system.',
        iconText: 'ZU',
        primaryColor: theme.palette.integration.zuluru,
        features: ['Teams', 'Schedules', 'Registration'],
        authType: 'api_key',
        isAvailable: false, // Coming soon
    },
];