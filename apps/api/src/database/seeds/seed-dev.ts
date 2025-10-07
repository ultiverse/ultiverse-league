import 'reflect-metadata';
import { AppDataSource } from '../data-source';

async function main() {
  await AppDataSource.initialize();

  // Insert account with column names matching the migration
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [{ id: accountId }] = await AppDataSource.query(
    `
    INSERT INTO accounts (id, email, "passwordHash", status, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), $1, $2, 'active', now(), now())
    ON CONFLICT (email) DO UPDATE
      SET "updatedAt" = now()
    RETURNING id;
    `,
    ['greg@gregpike.ca', 'password'], // Simple hash placeholder
  );

  await AppDataSource.query(
    `
    INSERT INTO profiles (id, "accountId", "displayName", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), $1, $2, now(), now())
    ON CONFLICT ("accountId") DO NOTHING;
    `,
    [accountId, 'Greg Pike'],
  );

  // Create integration connection entry for UC (disconnected by default)
  await AppDataSource.query(
    `
    INSERT INTO integration_connections (
      id, "accountId", provider, "isConnected", status,
      "createdAt", "updatedAt"
    )
    VALUES (gen_random_uuid(), $1, 'uc', false, 'disconnected', now(), now())
    ON CONFLICT ("accountId", provider) DO NOTHING;
    `,
    [accountId],
  );

  console.log('Seeded user:', 'greg@gregpike.ca', '→ account_id:', accountId);
  console.log('Seeded integration connection for UC (disconnected)');
  await AppDataSource.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
