import { Field } from '@ultiverse/shared-types';

export interface IFieldsProvider {
  listFields(leagueExternalId: string): Promise<Field[]>;
}