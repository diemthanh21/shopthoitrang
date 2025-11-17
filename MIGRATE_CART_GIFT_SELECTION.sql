-- Track gift selection override per cart item

create table if not exists cart_gift_selection (
  id bigserial primary key,
  machitietdonhang integer not null
    references chitietdonhang(machitietdonhang) on delete cascade,
  gift_variant_id integer not null
    references chitietsanpham(machitietsanpham),
  gift_size_bridge_id integer null
    references chitietsanpham_kichthuoc(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (machitietdonhang)
);

create index if not exists idx_cart_gift_selection_variant
  on cart_gift_selection(gift_variant_id);

create or replace function set_cart_gift_selection_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_cart_gift_selection_updated_at
  on cart_gift_selection;

create trigger trg_cart_gift_selection_updated_at
before update on cart_gift_selection
for each row
execute function set_cart_gift_selection_updated_at();
