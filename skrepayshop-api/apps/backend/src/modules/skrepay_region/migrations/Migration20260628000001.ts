import { Migration } from "@mikro-orm/migrations"

export class Migration20260628000001 extends Migration {
  async up(): Promise<void> {
    // Main region table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "skrepay_region" (
        "id"         TEXT NOT NULL,
        "name"       TEXT NOT NULL,
        "status"     TEXT NOT NULL DEFAULT 'draft',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ NULL,
        CONSTRAINT "skrepay_region_pkey" PRIMARY KEY ("id")
      );
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_skrepay_region_deleted_at"
        ON "skrepay_region" ("deleted_at") WHERE deleted_at IS NULL;
    `)

    // Countries join table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "skrepay_region_country" (
        "id"                TEXT NOT NULL,
        "skrepay_region_id" TEXT NOT NULL,
        "iso_2"             TEXT NOT NULL,
        "display_name"      TEXT NOT NULL,
        "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at"        TIMESTAMPTZ NULL,
        CONSTRAINT "skrepay_region_country_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "skrepay_region_country_region_fk"
          FOREIGN KEY ("skrepay_region_id")
          REFERENCES "skrepay_region"("id")
          ON DELETE CASCADE,
        CONSTRAINT "skrepay_region_country_unique"
          UNIQUE ("skrepay_region_id", "iso_2")
      );
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_skrepay_region_country_deleted_at"
        ON "skrepay_region_country" ("deleted_at") WHERE deleted_at IS NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_skrepay_region_country_region_id"
        ON "skrepay_region_country" ("skrepay_region_id");
    `)

    // Currencies join table
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "skrepay_region_currency" (
        "id"                TEXT NOT NULL,
        "skrepay_region_id" TEXT NOT NULL,
        "currency_code"     TEXT NOT NULL,
        "is_default"        BOOLEAN NOT NULL DEFAULT false,
        "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at"        TIMESTAMPTZ NULL,
        CONSTRAINT "skrepay_region_currency_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "skrepay_region_currency_region_fk"
          FOREIGN KEY ("skrepay_region_id")
          REFERENCES "skrepay_region"("id")
          ON DELETE CASCADE,
        CONSTRAINT "skrepay_region_currency_unique"
          UNIQUE ("skrepay_region_id", "currency_code")
      );
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_skrepay_region_currency_deleted_at"
        ON "skrepay_region_currency" ("deleted_at") WHERE deleted_at IS NULL;
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_skrepay_region_currency_region_id"
        ON "skrepay_region_currency" ("skrepay_region_id");
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_skrepay_region_currency_region_id";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_skrepay_region_currency_deleted_at";`)
    this.addSql(`DROP TABLE IF EXISTS "skrepay_region_currency" CASCADE;`)

    this.addSql(`DROP INDEX IF EXISTS "IDX_skrepay_region_country_region_id";`)
    this.addSql(`DROP INDEX IF EXISTS "IDX_skrepay_region_country_deleted_at";`)
    this.addSql(`DROP TABLE IF EXISTS "skrepay_region_country" CASCADE;`)

    this.addSql(`DROP INDEX IF EXISTS "IDX_skrepay_region_deleted_at";`)
    this.addSql(`DROP TABLE IF EXISTS "skrepay_region" CASCADE;`)
  }
}
