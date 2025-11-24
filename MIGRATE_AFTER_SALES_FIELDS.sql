-- Add extended fields for TRAHANG and DOIHANG workflows

-- TRAHANG
alter table if exists trahang
  add column if not exists ly_do_tu_choi text,
  add column if not exists ly_do_khong_hop_le text,
  add column if not exists diachiguihang text,
  add column if not exists huongdan_donggoi text,
  add column if not exists ngayduyet timestamp with time zone,
  add column if not exists ngaynhanhang timestamp with time zone,
  add column if not exists ngaykiemtra timestamp with time zone,
  add column if not exists trangthaikiemtra text,
  add column if not exists sotien_hoan numeric,
  add column if not exists phuongthuc_hoan text,
  add column if not exists ngayhoantien timestamp with time zone;

-- DOIHANG
alter table if exists doihang
  add column if not exists giacu numeric,
  add column if not exists giamoi numeric,
  add column if not exists chenhlech numeric,
  add column if not exists trangthaitien text,
  add column if not exists phuongthuc_xuly_chenhlech text,
  add column if not exists madonhangmoi integer,
  add column if not exists ngaytaodonmoi timestamp with time zone,
  add column if not exists diachiguihang text,
  add column if not exists huongdan_donggoi text,
  add column if not exists ngayduyet timestamp with time zone,
  add column if not exists ngaynhanhangcu timestamp with time zone,
  add column if not exists ngaykiemtra timestamp with time zone,
  add column if not exists trangthaikiemtra text,
  add column if not exists voucher_code text,
  add column if not exists voucher_amount numeric;

-- Optional: simple voucher table if not existing
create table if not exists magiamgia (
  magiamgia text primary key,
  giatri numeric not null,
  ngaytao timestamp with time zone default now(),
  ghichu text
);

-- Audit log tables
create table if not exists trahang_log (
  id bigserial primary key,
  matrahang integer not null,
  action text not null,
  from_status text,
  to_status text,
  note text,
  actor_type text,
  actor_id integer,
  created_at timestamp with time zone default now()
);

create index if not exists idx_trahang_log_matrahang on trahang_log(matrahang);

create table if not exists doihang_log (
  id bigserial primary key,
  madoihang integer not null,
  action text not null,
  from_status text,
  to_status text,
  note text,
  actor_type text,
  actor_id integer,
  created_at timestamp with time zone default now()
);

create index if not exists idx_doihang_log_madoihang on doihang_log(madoihang);
