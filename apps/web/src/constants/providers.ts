import { PROVIDERS } from '@ultiverse/shared-types';
import type { IntegrationProvider } from '../types/api';

/**
 * Provider badge configuration
 * Maps provider identifiers to their display badges
 */
export const PROVIDER_BADGES: Record<IntegrationProvider, string> = {
  [PROVIDERS.ULTIMATE_CENTRAL]: 'UC',
  [PROVIDERS.ZULURU]: 'Z',
};

/**
 * Provider display names
 */
export const PROVIDER_NAMES: Record<IntegrationProvider, string> = {
  [PROVIDERS.ULTIMATE_CENTRAL]: 'Ultimate Central',
  [PROVIDERS.ZULURU]: 'Zuluru',
};
