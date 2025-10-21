import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTeamsAndMemberships1760477810171
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get schema from connection configuration
    const schema = (queryRunner.connection.driver.options as { schema?: string })
      .schema;
    const schemaPrefix = schema ? `"${schema}".` : '';

    // Enable citext extension for case-insensitive email
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS citext`);

    // Canonical teams table
    await queryRunner.query(`
      CREATE TABLE ${schemaPrefix}teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        name TEXT NOT NULL,
        location TEXT,
        season_start DATE NOT NULL,
        season_end DATE,
        created_by_user_id UUID REFERENCES ${schemaPrefix}accounts(id),
        source_type TEXT NOT NULL DEFAULT 'ultiverse',
        is_editable BOOLEAN NOT NULL DEFAULT true,
        colour TEXT DEFAULT '#000000',
        alt_colour TEXT DEFAULT '#ffffff',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (organization_id, name, season_start)
      )
    `);

    // Players table
    await queryRunner.query(`
      CREATE TABLE ${schemaPrefix}players (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES ${schemaPrefix}accounts(id),
        full_name TEXT,
        primary_email CITEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (primary_email)
      )
    `);

    // User-team memberships (for past teams view)
    await queryRunner.query(`
      CREATE TABLE ${schemaPrefix}user_team_memberships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES ${schemaPrefix}accounts(id) ON DELETE CASCADE,
        team_id UUID NOT NULL REFERENCES ${schemaPrefix}teams(id) ON DELETE CASCADE,
        role TEXT,
        joined_via TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (user_id, team_id)
      )
    `);

    // External team sources (de-duplication and caching)
    await queryRunner.query(`
      CREATE TABLE ${schemaPrefix}external_team_sources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id UUID NOT NULL REFERENCES ${schemaPrefix}teams(id) ON DELETE CASCADE,
        source TEXT NOT NULL,
        external_id TEXT NOT NULL,
        raw_data JSONB NOT NULL,
        last_synced_at TIMESTAMPTZ,
        sync_status TEXT,
        etag TEXT,
        last_modified TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (source, external_id)
      )
    `);

    // Indexes for performance
    await queryRunner.query(
      `CREATE INDEX idx_teams_organization_season ON ${schemaPrefix}teams(organization_id, season_start DESC, season_end DESC NULLS LAST)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_user_team_memberships_user ON ${schemaPrefix}user_team_memberships(user_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_user_team_memberships_team ON ${schemaPrefix}user_team_memberships(team_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_external_team_sources_lookup ON ${schemaPrefix}external_team_sources(source, external_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_external_team_sources_team ON ${schemaPrefix}external_team_sources(team_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get schema from connection configuration
    const schema = (queryRunner.connection.driver.options as { schema?: string })
      .schema;
    const schemaPrefix = schema ? `"${schema}".` : '';

    // Drop tables in reverse order (respecting foreign keys)
    await queryRunner.query(
      `DROP TABLE IF EXISTS ${schemaPrefix}external_team_sources`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS ${schemaPrefix}user_team_memberships`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS ${schemaPrefix}players`);
    await queryRunner.query(`DROP TABLE IF EXISTS ${schemaPrefix}teams`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS citext`);
  }
}
