-- Limpieza adicional: catálogo compartido legacy (productos de prueba)
do $$
begin
  if to_regclass('public.product_sales_channel') is not null then
    delete from public.product_sales_channel where true;
  end if;
  if to_regclass('public.product_category_product') is not null then
    delete from public.product_category_product where true;
  end if;
  if to_regclass('public.product_variant') is not null then
    delete from public.product_variant where true;
  end if;
  if to_regclass('public.product') is not null then
    delete from public.product where true;
  end if;
  if to_regclass('public.product_category') is not null then
    delete from public.product_category where true;
  end if;
end $$;
