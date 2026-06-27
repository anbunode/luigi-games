import { Migration } from "@mikro-orm/migrations"

export class Migration20260627000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`create table if not exists "macro_region" ("id" text not null, "name" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "macro_region_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_macro_region_deleted_at" ON "macro_region" ("deleted_at") WHERE deleted_at IS NULL;`)
  }

  async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_macro_region_deleted_at";`)
    this.addSql(`drop table if exists "macro_region" cascade;`)
  }
}
