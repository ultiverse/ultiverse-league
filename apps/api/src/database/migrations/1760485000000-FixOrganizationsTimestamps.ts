import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixOrganizationsTimestamps1760485000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get schema from connection configuration
    const schema = (
      queryRunner.connection.driver.options as { schema?: string }
    ).schema;
    const schemaPrefix = schema ? `"${schema}".` : '"public".';

    // Check if columns exist before renaming (they may already be correct)
    const result = (await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'organizations'
        AND column_name IN ('created_at', 'updated_at', 'createdAt', 'updatedAt')
    `)) as Array<{ column_name: string }>;

    const columnNames: string[] = result.map((row) => row.column_name);

    // Only rename if old column names exist
    if (columnNames.includes('created_at')) {
      await queryRunner.query(`
        ALTER TABLE ${schemaPrefix}organizations
          RENAME COLUMN created_at TO "createdAt"
      `);
    }

    if (columnNames.includes('updated_at')) {
      await queryRunner.query(`
        ALTER TABLE ${schemaPrefix}organizations
          RENAME COLUMN updated_at TO "updatedAt"
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get schema from connection configuration
    const schema = (
      queryRunner.connection.driver.options as { schema?: string }
    ).schema;
    const schemaPrefix = schema ? `"${schema}".` : '';

    // Revert createdAt to created_at
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}organizations
        RENAME COLUMN "createdAt" TO created_at
    `);

    // Revert updatedAt to updated_at
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}organizations
        RENAME COLUMN "updatedAt" TO updated_at
    `);
  }
}
