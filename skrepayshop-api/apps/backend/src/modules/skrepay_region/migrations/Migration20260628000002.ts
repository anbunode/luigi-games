import { Migration } from "@mikro-orm/migrations"

export class Migration20260628000002 extends Migration {
  async up(): Promise<void> {
    // Add tenant_id to main region table
    this.addSql(`
      ALTER TABLE "skrepay_region"
        ADD COLUMN IF NOT EXISTS "tenant_id" TEXT NOT NULL DEFAULT '';
    `)
    this.addSql(`
      CREATE INDEX IF NOT EXISTS "IDX_skrepay_region_tenant_id"
        ON "skrepay_region" ("tenant_id");
    `)

    // Remove the DEFAULT after adding so future inserts must provide it
    this.addSql(`
      ALTER TABLE "skrepay_region"
        ALTER COLUMN "tenant_id" DROP DEFAULT;
    `)
  }

  async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_skrepay_region_tenant_id";`)
    this.addSql(`ALTER TABLE "skrepay_region" DROP COLUMN IF EXISTS "tenant_id";`)
  }
}
