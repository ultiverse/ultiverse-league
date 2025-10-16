import 'reflect-metadata';
import { AppDataSource } from '../data-source';

/**
 * Seed script for staging environment
 * Creates test users and sample data for testing
 */
async function main() {
  console.log('🌱 Seeding staging database...');
  await AppDataSource.initialize();

  try {
    // Create test admin user
    const [{ id: adminId }] = (await AppDataSource.query(
      `
      INSERT INTO accounts (id, email, "passwordHash", status, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, 'active', now(), now())
      ON CONFLICT (email) DO UPDATE
        SET "updatedAt" = now()
      RETURNING id;
      `,
      ['admin@staging.test', '$2a$10$dummyhashforstagin'], // Dummy hash for staging
    )) as Array<{ id: string }>;

    await AppDataSource.query(
      `
      INSERT INTO profiles (id, "accountId", "displayName", "firstName", "lastName", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, now(), now())
      ON CONFLICT ("accountId") DO NOTHING;
      `,
      [adminId, 'Admin User', 'Admin', 'User'],
    );

    console.log('✓ Created admin user: admin@staging.test');

    // Create test regular user
    const [{ id: userId }] = (await AppDataSource.query(
      `
      INSERT INTO accounts (id, email, "passwordHash", status, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), $1, $2, 'active', now(), now())
      ON CONFLICT (email) DO UPDATE
        SET "updatedAt" = now()
      RETURNING id;
      `,
      ['user@staging.test', '$2a$10$dummyhashforstagin'], // Dummy hash for staging
    )) as Array<{ id: string }>;

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
        (gen_random_uuid(), $1, 'uc', false, 'disconnected', now(), now()),
        (gen_random_uuid(), $2, 'uc', false, 'disconnected', now(), now())
      ON CONFLICT ("accountId", provider) DO NOTHING;
      `,
      [adminId, userId],
    );

    console.log('✓ Created integration connection stubs');

    // Create sample team
    const organizationId = '00000000-0000-0000-0000-000000000001';
    const [{ id: teamId }] = (await AppDataSource.query(
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
      [
        organizationId,
        'Staging Test Team',
        'Vancouver, BC',
        adminId,
      ],
    )) as Array<{ id: string }>;

    console.log('✓ Created sample team: Staging Test Team');

    // Add users to the team
    await AppDataSource.query(
      `
      INSERT INTO user_team_memberships (
        id, "userId", "teamId", role, "joinedVia", "createdAt"
      )
      VALUES
        (gen_random_uuid(), $1, $2, 'captain', 'manual', now()),
        (gen_random_uuid(), $3, $2, 'player', 'manual', now())
      ON CONFLICT ("userId", "teamId") DO NOTHING;
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
