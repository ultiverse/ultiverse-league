import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixOrganizationsTimestamps1760485000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get schema from connection configuration
    const schema = (
      queryRunner.connection.driver.options as { schema?: string }
    ).schema;
    const schemaPrefix = schema ? `"${schema}".` : '';

    // Rename created_at to createdAt
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}organizations
        RENAME COLUMN created_at TO "createdAt"
    `);

    // Rename updated_at to updatedAt
    await queryRunner.query(`
      ALTER TABLE ${schemaPrefix}organizations
        RENAME COLUMN updated_at TO "updatedAt"
    `);
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
