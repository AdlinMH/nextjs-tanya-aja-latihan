-- TanyaAja! — migrasi tambahan untuk halaman /share-coding
-- Jalankan SETELAH supabase/setup.sql, di Supabase Dashboard > SQL Editor.
-- Migrasi ini aditif: hanya membuat tabel share_coding_posts beserta indeks,
-- trigger updated_at, RLS, dan hak aksesnya. Tabel TanyaAja! lain tidak diubah.
-- Aman dijalankan ulang. Semua langkah berada dalam satu transaksi.
--
-- Model akses sama dengan setup.sql:
-- - Hanya server Next.js (secret key / service_role) yang membaca dan menulis.
-- - anon dan authenticated tidak punya hak apa pun. RLS aktif tanpa policy.
-- - Pembatasan per kelompok (group_id) dilakukan di lib/share-coding.js.

begin;

create table if not exists public.share_coding_posts (
  id         uuid primary key default gen_random_uuid(),
  group_id   text not null,
  title      text not null,
  -- Dokumen rich text terstruktur (Tiptap/ProseMirror JSON), bukan HTML.
  content    jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint share_coding_posts_group_id_format
    check (group_id ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
  -- judul: 1–120 karakter, tidak boleh hanya spasi
  constraint share_coding_posts_title_length
    check (char_length(btrim(title)) between 1 and 120),
  -- isi harus dokumen ({"type":"doc", ...})
  constraint share_coding_posts_content_doc
    check (jsonb_typeof(content) = 'object' and content ->> 'type' = 'doc'),
  -- batas ukuran isi (aplikasi membatasi lebih ketat)
  constraint share_coding_posts_content_size
    check (octet_length(content::text) <= 200000)
);

-- Daftar per kelompok, urut dari yang paling awal dibuat
create index if not exists share_coding_posts_group_created_idx
  on public.share_coding_posts (group_id, created_at, id);

-- updated_at otomatis (fungsi dibuat oleh setup.sql)
drop trigger if exists share_coding_posts_set_updated_at on public.share_coding_posts;
create trigger share_coding_posts_set_updated_at
  before update on public.share_coding_posts
  for each row execute function public.tanyaaja_set_updated_at();

-- Hak akses
alter table public.share_coding_posts enable row level security;

revoke all on table public.share_coding_posts from public, anon, authenticated;
grant select, insert, update, delete on table public.share_coding_posts to service_role;

commit;

-- Pemeriksaan setelah dijalankan (hanya membaca, tidak menambah data):
--
-- select relname, relrowsecurity from pg_class
--   where oid = 'public.share_coding_posts'::regclass;
--   -> relrowsecurity = true
--
-- select grantee, privilege_type from information_schema.role_table_grants
--   where table_schema = 'public' and table_name = 'share_coding_posts'
--   order by grantee, privilege_type;
--   -> hanya postgres dan service_role (tidak ada anon/authenticated)
--
-- select count(*) from pg_policies
--   where schemaname = 'public' and tablename = 'share_coding_posts';
--   -> 0
