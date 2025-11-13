import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrganizationToAccount1763010000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add organizationId column to accounts table
    await queryRunner.query(`
      ALTER TABLE "public".accounts
        ADD COLUMN IF NOT EXISTS "organizationId" UUID
    `);

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "public".accounts
        ADD CONSTRAINT "FK_02663e39fff0b001faf6dd6df56"
        FOREIGN KEY ("organizationId")
        REFERENCES "public".organizations(id)
        ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "public".accounts
        DROP CONSTRAINT IF EXISTS "FK_02663e39fff0b001faf6dd6df56"
    `);

    // Drop organizationId column
    await queryRunner.query(`
      ALTER TABLE "public".accounts
        DROP COLUMN IF EXISTS "organizationId"
    `);
  }
}
