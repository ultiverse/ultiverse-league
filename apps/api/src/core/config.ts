import { z } from 'zod';

export const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  // UC credentials are now stored per-user in integration_connections table
  // No global UC credentials needed
});

export type Env = z.infer<typeof EnvSchema>;
