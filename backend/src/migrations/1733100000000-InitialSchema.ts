import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1733100000000 implements MigrationInterface {
  name = 'InitialSchema1733100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_role_enum" AS ENUM('user', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "content_type_enum" AS ENUM('bible', 'novel', 'poem', 'essay');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" varchar NOT NULL UNIQUE,
        "nickname" varchar,
        "provider" varchar NOT NULL DEFAULT 'google',
        "avatar_url" varchar,
        "role" "user_role_enum" NOT NULL DEFAULT 'user',
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create bible table (legacy, for backward compatibility)
    await queryRunner.query(`
      CREATE TABLE "bible" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "book" varchar NOT NULL,
        "chapter" integer NOT NULL,
        "verse" integer NOT NULL,
        "content" text NOT NULL
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_bible_book_chapter_verse" ON "bible" ("book", "chapter", "verse")
    `);

    // Create content table
    await queryRunner.query(`
      CREATE TABLE "content" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "content_type" "content_type_enum" NOT NULL,
        "work_title" varchar NOT NULL,
        "author" varchar,
        "chapter" integer NOT NULL DEFAULT 1,
        "section" integer NOT NULL DEFAULT 1,
        "content" text NOT NULL,
        "display_reference" varchar,
        "publication_year" integer,
        "is_public_domain" boolean NOT NULL DEFAULT true,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_content_type_work_chapter_section" ON "content" ("content_type", "work_title", "chapter", "section")
    `);

    // Create typing_progress table
    await queryRunner.query(`
      CREATE TABLE "typing_progress" (
        "user_id" uuid PRIMARY KEY,
        "content_type" "content_type_enum" NOT NULL DEFAULT 'bible',
        "work_title" varchar NOT NULL,
        "chapter" integer NOT NULL,
        "section" integer NOT NULL DEFAULT 1,
        "cursor_pos" integer NOT NULL DEFAULT 0,
        "last_updated" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_typing_progress_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create typing_stats table
    await queryRunner.query(`
      CREATE TABLE "typing_stats" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "content_id" uuid NOT NULL,
        "cpm" integer NOT NULL,
        "accuracy" decimal(5,2) NOT NULL,
        "verse_count" integer NOT NULL,
        "session_date" date NOT NULL DEFAULT CURRENT_DATE,
        CONSTRAINT "FK_typing_stats_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_typing_stats_content" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE CASCADE
      )
    `);

    // Enable uuid-ossp extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "typing_stats"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "typing_progress"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "content"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bible"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "content_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}
