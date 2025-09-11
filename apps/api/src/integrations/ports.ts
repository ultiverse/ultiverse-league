export interface ILeagueProvider {
  listRecent(): Promise<any[]>;
  getLeagueById(id: string): Promise<any | null>;
}
export interface IRegistrationProvider {
  listRegistrations(
    leagueExternalId: string,
    includePerson: boolean,
  ): Promise<any[]>;
}

export const PROVIDER_REGISTRY = Symbol('PROVIDER_REGISTRY');
export type ProviderKeys = 'ultimateCentral';
export interface ProviderRegistry {
  leagues: ILeagueProvider;
  registrations: IRegistrationProvider;
}
