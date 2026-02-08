import type { User } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'user_superadmin',
    name: 'Super Admin',
    role: 'superadmin',
    avatarUrl: 'https://picsum.photos/seed/1/100/100',
    dataAiHint: 'person portrait',
  },
  {
    id: 'user_starsi',
    name: 'Starší Sibling',
    role: 'starší',
    bedtime: '22:00',
    avatarUrl: 'https://picsum.photos/seed/2/100/100',
    dataAiHint: 'teenager portrait',
  },
  {
    id: 'user_mladsi',
    name: 'Mladší Sibling',
    role: 'mladší',
    bedtime: '20:30',
    avatarUrl: 'https://picsum.photos/seed/3/100/100',
    dataAiHint: 'child portrait',
  },
];
