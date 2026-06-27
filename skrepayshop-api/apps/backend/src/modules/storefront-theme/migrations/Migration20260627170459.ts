import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260627170459 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "storefront_theme" add column if not exists "main_banner_image_url" text not null, add column if not exists "main_banner_product_handle" text not null, add column if not exists "tenant_id" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "storefront_theme" drop column if exists "main_banner_image_url", drop column if exists "main_banner_product_handle", drop column if exists "tenant_id";`);
  }

}
