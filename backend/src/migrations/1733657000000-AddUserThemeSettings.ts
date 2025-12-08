import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserThemeSettings1733657000000 implements MigrationInterface {
  name = 'AddUserThemeSettings1733657000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "font_family" varchar DEFAULT 'Nanum Myeongjo',
      ADD COLUMN IF NOT EXISTS "font_size" integer DEFAULT 36,
      ADD COLUMN IF NOT EXISTS "font_color" varchar DEFAULT '#374151',
      ADD COLUMN IF NOT EXISTS "background_color" varchar DEFAULT '#FFFFFF'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "font_family",
      DROP COLUMN IF EXISTS "font_size",
      DROP COLUMN IF EXISTS "font_color",
      DROP COLUMN IF EXISTS "background_color"
    `);
  }
}
