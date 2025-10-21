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
        ADD COLUMN player_id UUID REFERENCES ${schemaPrefix}players(id),
        ADD COLUMN league_id UUID REFERENCES ${schemaPrefix}leagues(id),
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true
    `);

    // Add check constraint (must have user_id OR player_id)
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}memberships
        ADD CONSTRAINT check_membership_identity
        CHECK (user_id IS NOT NULL OR player_id IS NOT NULL)
    `);

    // Drop old unique constraint (it's actually a constraint, not just an index)
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}memberships
        DROP CONSTRAINT IF EXISTS user_team_memberships_user_id_team_id_key
    `);

    // Create new unique indexes
    // For user-based memberships (authenticated users)
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_memberships_user_unique
        ON ${schemaPrefix}memberships(user_id, team_id, league_id)
        WHERE user_id IS NOT NULL AND is_active = true
    `);

    // For player-based memberships (roster imports)
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_memberships_player_unique
        ON ${schemaPrefix}memberships(player_id, team_id, league_id)
        WHERE player_id IS NOT NULL AND is_active = true
    `);

    // Create indexes for lookups
    await queryRunner.query(`
      CREATE INDEX idx_memberships_user
        ON ${schemaPrefix}memberships(user_id)
        WHERE user_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_memberships_player
        ON ${schemaPrefix}memberships(player_id)
        WHERE player_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_memberships_team
        ON ${schemaPrefix}memberships(team_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_memberships_league
        ON ${schemaPrefix}memberships(league_id)
        WHERE league_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX idx_memberships_active
        ON ${schemaPrefix}memberships(is_active, user_id, team_id)
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
        DROP COLUMN IF EXISTS is_active,
        DROP COLUMN IF EXISTS league_id,
        DROP COLUMN IF EXISTS player_id
    `);

    // Rename table back
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}memberships
        RENAME TO user_team_memberships
    `);

    // Restore old unique constraint
    await queryRunner.query(`
      CREATE UNIQUE INDEX user_team_memberships_user_id_team_id_key
        ON ${schemaPrefix}user_team_memberships(user_id, team_id)
    `);
  }
}
