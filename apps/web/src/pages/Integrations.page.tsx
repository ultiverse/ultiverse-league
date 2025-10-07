import { Stack } from '@mui/material';
import { Page } from '../components/Layout/Page.component';
import { IntegrationsManager } from '../components/Integrations/IntegrationsManager.component';

export function IntegrationsPage() {
    return (
        <Page title="Integrations" subtitle="Connect and manage your external services">
            <Stack spacing={3}>
                <IntegrationsManager />
            </Stack>
        </Page>
    );
}