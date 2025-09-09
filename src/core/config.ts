import { z } from 'zod';

export const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  UC_CLIENT_ID: z.string().optional(),
  UC_CLIENT_SECRET: z.string().optional(),
  UC_API_DOMAIN: z.string().default('usetopscore.com'),
});
export type Env = z.infer<typeof EnvSchema>;
