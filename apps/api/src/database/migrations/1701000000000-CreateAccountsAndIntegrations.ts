import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateAccountsAndIntegrations1701000000000
  implements MigrationInterface
{
  name = 'CreateAccountsAndIntegrations1701000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create accounts table
    await queryRunner.createTable(
      new Table({
        name: 'accounts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'passwordHash',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'suspended', 'deleted'],
            default: "'active'",
          },
          {
            name: 'lastLoginAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'lastLoginProvider',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create profiles table
    await queryRunner.createTable(
      new Table({
        name: 'profiles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'accountId',
            type: 'uuid',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'firstName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'lastName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'displayName',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'avatarUrl',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'phoneNumber',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'dateOfBirth',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'location',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'bio',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'preferences',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'socialLinks',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create integration_connections table
    await queryRunner.createTable(
      new Table({
        name: 'integration_connections',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'accountId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'provider',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'isConnected',
            type: 'boolean',
            default: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['connected', 'disconnected', 'error', 'pending'],
            default: "'disconnected'",
          },
          {
            name: 'externalUserId',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'connectedEmail',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'connectedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'lastSyncAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'errorMessage',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'encryptedAccessToken',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'encryptedRefreshToken',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'tokenExpiresAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'providerData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign key relationships
    await queryRunner.createForeignKey(
      'profiles',
      new TableForeignKey({
        name: 'FK_profiles_accountId',
        columnNames: ['accountId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'accounts',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'integration_connections',
      new TableForeignKey({
        name: 'FK_integration_connections_accountId',
        columnNames: ['accountId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'accounts',
        onDelete: 'CASCADE',
      }),
    );

    // Create unique index for account-provider combination
    await queryRunner.createIndex(
      'integration_connections',
      new TableIndex({
        name: 'IDX_integration_connections_account_provider',
        columnNames: ['accountId', 'provider'],
        isUnique: true,
      }),
    );

    // Create index for email lookups
    await queryRunner.createIndex(
      'accounts',
      new TableIndex({
        name: 'IDX_accounts_email',
        columnNames: ['email'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys by name
    await queryRunner.dropForeignKey(
      'integration_connections',
      'FK_integration_connections_accountId',
    );
    await queryRunner.dropForeignKey('profiles', 'FK_profiles_accountId');

    // Drop indexes
    await queryRunner.dropIndex(
      'integration_connections',
      'IDX_integration_connections_account_provider',
    );
    await queryRunner.dropIndex('accounts', 'IDX_accounts_email');

    // Drop tables
    await queryRunner.dropTable('integration_connections');
    await queryRunner.dropTable('profiles');
    await queryRunner.dropTable('accounts');
  }
}
