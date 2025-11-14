import { z } from 'zod';

export const EnvSchema = z.object({
  PORT: z.coerce.number().default(Number(process.env.PORT) || 3000),
});

export type Env = z.infer<typeof EnvSchema>;
