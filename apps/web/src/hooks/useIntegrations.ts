import { useContext } from 'react';
import { IntegrationContext } from '../context/IntegrationContext.context';

export function useIntegrations() {
    const context = useContext(IntegrationContext);
    if (context === undefined) {
        throw new Error('useIntegrations must be used within an IntegrationContextProvider');
    }
    return context;
}