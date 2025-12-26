-- Create payment_requests table
create type payment_status as enum ('pending', 'verified', 'rejected');

create table if not exists public.payment_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  plan text not null,
  payment_method text not null,
  phone_number text,
  receipt_url text,
  amount numeric,
  status payment_status default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.payment_requests enable row level security;

-- Policies for payment_requests
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'payment_requests' and policyname = 'Users can view their own payment requests') then
    create policy "Users can view their own payment requests"
      on public.payment_requests for select
      using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'payment_requests' and policyname = 'Users can insert their own payment requests') then
    create policy "Users can insert their own payment requests"
      on public.payment_requests for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Create storage bucket for payment proofs
insert into storage.buckets (id, name, public)
values ('payment_proofs', 'payment_proofs', true)
on conflict (id) do nothing;

-- Storage policies
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'Payment proofs are publicly accessible') then
    create policy "Payment proofs are publicly accessible"
      on storage.objects for select
      using ( bucket_id = 'payment_proofs' );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'Users can upload payment proofs') then
    create policy "Users can upload payment proofs"
      on storage.objects for insert
      with check (
        bucket_id = 'payment_proofs' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
      );
  end if;
end $$;
