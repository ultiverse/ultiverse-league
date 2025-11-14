import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTeamsAndMemberships1760480500000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get schema from connection configuration
    const schema = (
      queryRunner.connection.driver.options as { schema?: string }
    ).schema;
    const schemaPrefix = schema ? `"${schema}".` : '';

    // Enable citext extension for case-insensitive email
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS citext`);

    // Canonical teams table - skip if already exists (entity may have created it)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ${schemaPrefix}teams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "organizationId" UUID NOT NULL,
        name TEXT NOT NULL,
        location TEXT,
        "seasonStart" DATE NOT NULL,
        "seasonEnd" DATE,
        "createdByUserId" UUID REFERENCES ${schemaPrefix}accounts(id),
        "sourceType" TEXT NOT NULL DEFAULT 'ultiverse',
        "isEditable" BOOLEAN NOT NULL DEFAULT true,
        colour TEXT DEFAULT '#000000',
        "altColour" TEXT DEFAULT '#ffffff',
        "createdAt" TIMESTAMPTZ DEFAULT now(),
        "updatedAt" TIMESTAMPTZ DEFAULT now(),
        UNIQUE ("organizationId", name, "seasonStart")
      )
    `);

    // Players table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ${schemaPrefix}players (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID REFERENCES ${schemaPrefix}accounts(id),
        "fullName" TEXT,
        "primaryEmail" CITEXT,
        "createdAt" TIMESTAMPTZ DEFAULT now(),
        "updatedAt" TIMESTAMPTZ DEFAULT now(),
        UNIQUE ("primaryEmail")
      )
    `);

    // User-team memberships (for past teams view)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ${schemaPrefix}user_team_memberships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL REFERENCES ${schemaPrefix}accounts(id) ON DELETE CASCADE,
        "teamId" UUID NOT NULL REFERENCES ${schemaPrefix}teams(id) ON DELETE CASCADE,
        role TEXT,
        "joinedVia" TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT now(),
        UNIQUE ("userId", "teamId")
      )
    `);

    // External team sources (de-duplication and caching)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ${schemaPrefix}external_team_sources (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "teamId" UUID NOT NULL REFERENCES ${schemaPrefix}teams(id) ON DELETE CASCADE,
        source TEXT NOT NULL,
        "externalId" TEXT NOT NULL,
        "rawData" JSONB NOT NULL,
        "lastSyncedAt" TIMESTAMPTZ,
        "syncStatus" TEXT,
        etag TEXT,
        "lastModified" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ DEFAULT now(),
        "updatedAt" TIMESTAMPTZ DEFAULT now(),
        UNIQUE (source, "externalId")
      )
    `);

    // Indexes for performance
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_teams_organization_season ON ${schemaPrefix}teams("organizationId", "seasonStart" DESC, "seasonEnd" DESC NULLS LAST)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_user_team_memberships_user ON ${schemaPrefix}user_team_memberships("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_user_team_memberships_team ON ${schemaPrefix}user_team_memberships("teamId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_external_team_sources_lookup ON ${schemaPrefix}external_team_sources(source, "externalId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_external_team_sources_team ON ${schemaPrefix}external_team_sources("teamId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get schema from connection configuration
    const schema = (
      queryRunner.connection.driver.options as { schema?: string }
    ).schema;
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
