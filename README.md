# ResearchMind - راهنمای راه‌اندازی (Supabase)

⚠️ **بسیار مهم:** برای اینکه برنامه کار کند، باید ابتدا تنظیمات Supabase را انجام دهید.

## ۱. تنظیم متغیرهای محیطی (Secrets)

در پنل **Settings > Secrets** در AI Studio، متغیرهای زیر را اضافه کنید:

- `VITE_SUPABASE_URL`: آدرس پروژه شما (مثلاً `https://xyz.supabase.co`)
- `VITE_SUPABASE_ANON_KEY`: کلید `anon public` شما.
- `GEMINI_API_KEY`: کلید API گوگل شما.

## ۲. ساخت جداول دیتابیس

در بخش **SQL Editor** پروژه Supabase خود، کدهای زیر را اجرا کنید تا جداول مورد نیاز ساخته شوند:

```sql
-- جدول تحقیقات
create table researches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  query text not null,
  depth text not null,
  status text not null,
  report text,
  summary text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- جدول پیام‌های چت
create table messages (
  id uuid default gen_random_uuid() primary key,
  research_id uuid references researches on delete cascade not null,
  user_id uuid references auth.users not null,
  role text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- جدول پروفایل‌ها (اختیاری)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- فعال‌سازی Row Level Security (RLS)
alter table researches enable row level security;
alter table messages enable row level security;
alter table profiles enable row level security;

-- ایجاد سیاست‌های دسترسی
create policy "Users can see their own researches" on researches for select using (auth.uid() = user_id);
create policy "Users can insert their own researches" on researches for insert with check (auth.uid() = user_id);
create policy "Users can update their own researches" on researches for update using (auth.uid() = user_id);
create policy "Users can delete their own researches" on researches for delete using (auth.uid() = user_id);

create policy "Users can see messages of their researches" on messages for select using (auth.uid() = user_id);
create policy "Users can insert messages to their researches" on messages for insert with check (auth.uid() = user_id);
```

---

## متغیرهای محیطی (Environment Variables)

- `GEMINI_API_KEY`: کلید API گوگل شما.
- `VITE_SUPABASE_URL`: آدرس پروژه Supabase.
- `VITE_SUPABASE_ANON_KEY`: کلید عمومی Supabase.
