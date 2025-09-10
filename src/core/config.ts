import { z } from 'zod';

export const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  UC_API_DOMAIN: z.string().min(1, 'UC_API_DOMAIN required'),
  UC_CLIENT_ID: z.string().min(1, 'UC_CLIENT_ID required'),
  UC_CLIENT_SECRET: z.string().min(1, 'UC_CLIENT_SECRET required'),
});

export type Env = z.infer<typeof EnvSchema>;
