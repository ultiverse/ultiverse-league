import 'reflect-metadata';
import { AppDataSource } from '../data-source';

async function main() {
  await AppDataSource.initialize();

  // Insert account with column names matching the migration
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

  console.log('Seeded user:', 'greg@gregpike.ca', '→ account_id:', accountId);
  await AppDataSource.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
