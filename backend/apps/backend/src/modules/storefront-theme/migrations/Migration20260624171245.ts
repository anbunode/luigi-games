import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260624171245 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "storefront_theme" ("id" text not null, "store_name" text not null, "accent_color" text not null, "hero_title" text not null, "hero_subtitle" text not null, "hero_badge" text not null, "hero_cta_label" text not null, "hero_cta_url" text not null, "promo_title" text not null, "promo_cta_label" text not null, "promo_cta_url" text not null, "show_promo_banner" boolean not null, "show_bestsellers" boolean not null, "show_featured_deals" boolean not null, "show_hero_carousel" boolean not null, "show_category_pills" boolean not null, "show_product_list" boolean not null, "show_genre_grid" boolean not null, "storefront_preview_url" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "storefront_theme_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_theme_deleted_at" ON "storefront_theme" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "storefront_theme" cascade;`);
  }

}
