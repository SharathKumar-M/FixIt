/**
 * CampusOS User Administration API
 */

import { apiRequest } from './client';
import type { UserProfile } from './types';

export async function getAdminUsersList(signal?: AbortSignal): Promise<UserProfile[]> {
  const data = await apiRequest<{ items: UserProfile[] } | UserProfile[]>('/api/v1/users', {
    method: 'GET',
    signal,
  });

  if (Array.isArray(data)) return data;
  if (data && Array.isArray((data as any).items)) return (data as any).items;
  return [];
}
