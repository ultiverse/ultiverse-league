export interface PersonLite {
  id: string;
  name?: string;
  email?: string | null;
}

export interface Registration {
  id: string;
  leagueExternalId: string;
  person: PersonLite | null;
  status?: string;
}

export interface IRegistrationProvider {
  listRegistrations(
    leagueExternalId: string,
    includePerson: boolean,
  ): Promise<Registration[]>;
}
