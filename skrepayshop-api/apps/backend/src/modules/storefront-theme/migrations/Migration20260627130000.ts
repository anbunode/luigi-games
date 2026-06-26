import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260627130000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "storefront_theme" add column if not exists "tenant_id" text null;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_storefront_theme_tenant_id" ON "storefront_theme" ("tenant_id") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_storefront_theme_tenant_id";`)
    this.addSql(
      `alter table if exists "storefront_theme" drop column if exists "tenant_id";`
    )
  }
}
