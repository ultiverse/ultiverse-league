import { Pagination } from './common';

export interface UCField {
  model: 'field';
  id: number;
  name: string;
  surface?: string;
  page_id?: number;
  location_id?: number;
  organization_id?: number;
  media_item_id?: number | null;
  contact_phone_number?: string;
  website_url?: string;
  slug?: string;
  [k: string]: unknown;
}

export interface UCFieldsResponse {
  action: string; // 'api_fields_list'
  status: number;
  count: number;
  result: UCField[];
  errors?: unknown[];
}

export type FieldsQuery = Pagination &
  Partial<{
    id: number[] | number | string; // single | array | CSV
    event_id: number; // primary query parameter
    field_id: number[];
    organization_id: number;
    location_id: number;
    surface: string;
    order_by: string;
  }>;

export function toUcFieldsParams(
  q?: FieldsQuery,
): Record<string, string | number | boolean> | undefined {
  if (!q) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      if (!v.length) continue;
      out[k] = v.join(',');
    } else if (
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean'
    ) {
      out[k] = v;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

export interface UCFieldRef {
  id?: number; // field_id
  name?: string;
  slug?: string;
}