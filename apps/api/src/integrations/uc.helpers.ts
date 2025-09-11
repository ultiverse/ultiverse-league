import { UCMeResponse } from './uc.types';

export function getMePersonId(res: UCMeResponse): number | null {
  if (res?.status !== 200) return null;
  const item = Array.isArray(res?.result) ? res.result[0] : undefined;
  return typeof item?.person_id === 'number' ? item.person_id : null;
}
