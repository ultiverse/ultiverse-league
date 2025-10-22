import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceMemberships1760484000000 implements MigrationInterface {
  name = 'EnhanceMemberships1760484000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get schema from connection configuration
    const schema = (queryRunner.connection.driver.options as { schema?: string })
      .schema;
    const schemaPrefix = schema ? `"${schema}".` : '';

    // Rename table to memberships
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}user_team_memberships
        RENAME TO memberships
    `);

    // Add new columns
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}memberships
        ADD COLUMN "playerId" UUID REFERENCES ${schemaPrefix}players(id),
        ADD COLUMN "leagueId" UUID REFERENCES ${schemaPrefix}leagues(id),
        ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true
    `);

    // Add check constraint (must have userId OR playerId)
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}memberships
        ADD CONSTRAINT check_membership_identity
        CHECK ("userId" IS NOT NULL OR "playerId" IS NOT NULL)
    `);

    // Drop old unique constraint (it's actually a constraint, not just an index)
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}memberships
        DROP CONSTRAINT IF EXISTS "user_team_memberships_userId_teamId_key"
    `);

    // Create new unique indexes
    // For user-based memberships (authenticated users)
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_memberships_user_unique
        ON ${schemaPrefix}memberships("userId", "teamId", "leagueId")
        WHERE "userId" IS NOT NULL AND "isActive" = true
    `);

    // For player-based memberships (roster imports)
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_memberships_player_unique
        ON ${schemaPrefix}memberships("playerId", "teamId", "leagueId")
        WHERE "playerId" IS NOT NULL AND "isActive" = true
    `);

    // Create indexes for lookups
    await queryRunner.query(`
      CREATE INDEX idx_memberships_user
        ON ${schemaPrefix}memberships("userId")
        WHERE "userId" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_memberships_player
        ON ${schemaPrefix}memberships("playerId")
        WHERE "playerId" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_memberships_team
        ON ${schemaPrefix}memberships("teamId")
    `);

    await queryRunner.query(`
      CREATE INDEX idx_memberships_league
        ON ${schemaPrefix}memberships("leagueId")
        WHERE "leagueId" IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_memberships_active
        ON ${schemaPrefix}memberships("isActive", "userId", "teamId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get schema from connection configuration
    const schema = (queryRunner.connection.driver.options as { schema?: string })
      .schema;
    const schemaPrefix = schema ? `"${schema}".` : '';

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS ${schemaPrefix}idx_memberships_active
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS ${schemaPrefix}idx_memberships_league
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS ${schemaPrefix}idx_memberships_team
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS ${schemaPrefix}idx_memberships_player
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS ${schemaPrefix}idx_memberships_user
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS ${schemaPrefix}idx_memberships_player_unique
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS ${schemaPrefix}idx_memberships_user_unique
    `);

    // Drop check constraint
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}memberships
        DROP CONSTRAINT IF EXISTS check_membership_identity
    `);

    // Drop new columns
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}memberships
        DROP COLUMN IF EXISTS "isActive",
        DROP COLUMN IF EXISTS "leagueId",
        DROP COLUMN IF EXISTS "playerId"
    `);

    // Rename table back
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}memberships
        RENAME TO user_team_memberships
    `);

    // Restore old unique constraint
    await queryRunner.query(`
      CREATE UNIQUE INDEX "user_team_memberships_userId_teamId_key"
        ON ${schemaPrefix}user_team_memberships("userId", "teamId")
    `);
  }
}
