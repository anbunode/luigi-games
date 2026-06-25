import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260623180000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table if exists "storefront_theme" add column if not exists "main_banner_image_url" text not null default '';`
    )
    this.addSql(
      `alter table if exists "storefront_theme" add column if not exists "main_banner_product_handle" text not null default '';`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "storefront_theme" drop column if exists "main_banner_image_url";`
    )
    this.addSql(
      `alter table if exists "storefront_theme" drop column if exists "main_banner_product_handle";`
    )
  }
}
