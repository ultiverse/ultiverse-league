import 'reflect-metadata';
import { AppDataSource } from '../data-source';

interface IdRow {
  id: string;
}

function assertIdRow(row: unknown, context: string): asserts row is IdRow {
  if (
    typeof row !== 'object' ||
    row === null ||
    !('id' in row) ||
    typeof (row as Partial<IdRow>).id !== 'string'
  ) {
    throw new Error(`Result row for ${context} is missing a string id`);
  }
}

function extractId(rows: unknown, context: string): string {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`Expected at least one result row for ${context}`);
  }
  const row: unknown = rows[0];
  assertIdRow(row, context);
  return row.id;
}

/**
 * Seed script for staging environment
 * Creates test users and sample data for testing
 */
async function main() {
  console.log('🌱 Seeding staging database...');
  await AppDataSource.initialize();

  try {
    // Create default staging organization
    const organizationId = '00000000-0000-0000-0000-000000000001';
    await AppDataSource.query(
      `
      INSERT INTO organizations (id, name, slug, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, now(), now())
      ON CONFLICT (id) DO NOTHING;
      `,
      [organizationId, 'Staging Organization', 'staging-org'],
    );

    console.log('✓ Created staging organization');

    // Create test admin user with organizationId
    const adminId = extractId(
      await AppDataSource.query(
        `
      INSERT INTO accounts (id, email, "passwordHash", status, "organizationId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, 'active', $3, now(), now())
      ON CONFLICT (email) DO UPDATE
        SET "updatedAt" = now(), "organizationId" = $3
      RETURNING id;
      `,
        ['admin@staging.test', '$2a$10$dummyhashforstagin', organizationId], // Dummy hash for staging
      ),
      'admin account insert',
    );

    await AppDataSource.query(
      `
      INSERT INTO profiles (id, "accountId", "displayName", "firstName", "lastName", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, now(), now())
      ON CONFLICT ("accountId") DO NOTHING;
      `,
      [adminId, 'Admin User', 'Admin', 'User'],
    );

    console.log('✓ Created admin user: admin@staging.test');

    // Create test regular user with organizationId
    const userId = extractId(
      await AppDataSource.query(
        `
      INSERT INTO accounts (id, email, "passwordHash", status, "organizationId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, 'active', $3, now(), now())
      ON CONFLICT (email) DO UPDATE
        SET "updatedAt" = now(), "organizationId" = $3
      RETURNING id;
      `,
        ['user@staging.test', '$2a$10$dummyhashforstagin', organizationId], // Dummy hash for staging
      ),
      'test user account insert',
    );

    await AppDataSource.query(
      `
      INSERT INTO profiles (id, "accountId", "displayName", "firstName", "lastName", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, now(), now())
      ON CONFLICT ("accountId") DO NOTHING;
      `,
      [userId, 'Test User', 'Test', 'User'],
    );

    console.log('✓ Created test user: user@staging.test');

    // Create integration connections (disconnected by default)
    await AppDataSource.query(
      `
      INSERT INTO integration_connections (
        id, "accountId", provider, "isConnected", status,
        "createdAt", "updatedAt"
      )
      VALUES
        (gen_random_uuid(), $1, 'ultimate_central', false, 'disconnected', now(), now()),
        (gen_random_uuid(), $2, 'ultimate_central', false, 'disconnected', now(), now())
      ON CONFLICT ("accountId", provider) DO NOTHING;
      `,
      [adminId, userId],
    );

    console.log('✓ Created integration connection stubs');

    // Create sample team (using the same organizationId from above)
    const teamId = extractId(
      await AppDataSource.query(
        `
      INSERT INTO teams (
        id, "organizationId", name, location, "sourceType", "isEditable",
        "seasonStart", "seasonEnd", colour, "altColour", "createdByUserId",
        "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid(), $1, $2, $3, 'manual', true,
        '2025-06-01', '2025-08-31', '#FF5722', '#FFFFFF', $4,
        now(), now()
      )
      RETURNING id;
      `,
        [organizationId, 'Staging Test Team', 'Vancouver, BC', adminId],
      ),
      'team insert',
    );

    console.log('✓ Created sample team: Staging Test Team');

    // Add users to the team (table renamed to memberships)
    await AppDataSource.query(
      `
      INSERT INTO memberships (
        id, "userId", "teamId", role, "joinedVia", "createdAt"
      )
      VALUES
        (gen_random_uuid(), $1, $2, 'captain', 'manual', now()),
        (gen_random_uuid(), $3, $2, 'player', 'manual', now())
      ON CONFLICT DO NOTHING;
      `,
      [adminId, teamId, userId],
    );

    console.log('✓ Added users to team');

    console.log('\n🎉 Staging database seeded successfully!');
    console.log('\nTest Accounts:');
    console.log('  - admin@staging.test (Admin User)');
    console.log('  - user@staging.test (Test User)');
    console.log('\nNote: Use dummy password for testing only\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
