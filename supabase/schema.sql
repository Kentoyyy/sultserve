-- POS + Inventory + Loyalty schema for SulitServe Cafe
-- Execute in Supabase SQL editor. Idempotent where possible.

-- ROLES & STAFF
create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  code text unique not null, -- 'admin', 'cashier', 'inventory_clerk'
  name text not null,
  created_at timestamptz default now()
);

create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text not null,
  role_id uuid references roles(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- CATEGORIES & PRODUCTS
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  price_cents int not null check (price_cents >= 0),
  category_id uuid references categories(id) on delete set null,
  status text not null default 'available', -- 'available' | 'out_of_stock'
  created_at timestamptz default now()
);

-- OPTIONS / ADD-ONS (sugar level, size, toppings, dips)
create table if not exists product_option_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  name text not null, -- e.g. Size, Sugar Level, Toppings
  type text not null default 'single', -- 'single' | 'multiple'
  required boolean default false,
  max_select int,
  created_at timestamptz default now()
);

create table if not exists product_options (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references product_option_groups(id) on delete cascade,
  name text not null, -- e.g. Large, 50%, Pearl, Cheese Dip
  price_delta_cents int not null default 0,
  sort_order int default 0
);

-- SUPPLIERS & INVENTORY
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_info jsonb,
  created_at timestamptz default now()
);

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null, -- e.g. L, kg, pcs
  quantity numeric not null default 0,
  low_stock_threshold numeric default 0,
  supplier_id uuid references suppliers(id) on delete set null,
  expiry_days int, -- for expiry monitoring
  created_at timestamptz default now()
);

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid references inventory_items(id) on delete cascade,
  change numeric not null, -- + added, - deducted
  reason text not null, -- e.g. purchase, sale_auto_deduction, spoilage, manual_adjustment
  reference_id uuid, -- e.g. order_id
  created_by uuid references staff(id) on delete set null,
  created_at timestamptz default now()
);

-- Product to inventory usage mapping for auto-deduction
create table if not exists product_ingredients (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  inventory_item_id uuid references inventory_items(id) on delete cascade,
  quantity_per_unit numeric not null -- how much inventory per 1 product sold
);

-- ORDERS & PAYMENTS
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigserial unique,
  status text not null default 'pending', -- pending, paid, preparing, completed, voided, refunded
  channel text not null default 'pos', -- pos | kiosk
  customer_phone text,
  notes text,
  subtotal_cents int not null default 0,
  discount_cents int not null default 0,
  total_cents int not null default 0,
  created_by uuid references staff(id) on delete set null, -- null for kiosk
  created_at timestamptz default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  name_snapshot text not null,
  unit_price_cents int not null,
  quantity int not null check (quantity > 0),
  line_total_cents int not null
);

create table if not exists order_item_options (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid references order_items(id) on delete cascade,
  group_name text not null,
  option_name text not null,
  price_delta_cents int not null default 0
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  method text not null, -- cash, gcash, card
  amount_cents int not null,
  approved_by uuid references staff(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  amount_cents int not null,
  reason text,
  approved_by uuid references staff(id) on delete set null,
  created_at timestamptz default now()
);

-- ACTIVITY LOGS
create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staff(id) on delete set null,
  action text not null,
  details jsonb,
  created_at timestamptz default now()
);

-- LOYALTY
create table if not exists loyalty_customers (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  name text,
  points int not null default 0,
  created_at timestamptz default now()
);

create table if not exists loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  loyalty_customer_id uuid references loyalty_customers(id) on delete cascade,
  order_id uuid references orders(id) on delete set null,
  points_change int not null, -- + earn, - redeem
  reason text,
  created_at timestamptz default now()
);

create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  type text not null, -- percent | fixed | free_item
  value numeric not null, -- percent or fixed amount; semantics by type
  active boolean default true,
  starts_at timestamptz,
  ends_at timestamptz
);

-- STAFF SCHEDULING & ATTENDANCE
create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staff(id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null
);

create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staff(id) on delete cascade,
  clock_in timestamptz not null,
  clock_out timestamptz
);

-- VIEWS for reports (simplified examples)
create or replace view v_sales_daily as
select date_trunc('day', created_at) as day,
       sum(total_cents) as total_cents,
       count(*) as orders_count
from orders
where status in ('paid','preparing','completed','refunded')
group by 1
order by 1 desc;

create or replace view v_bestsellers as
select oi.product_id, p.name, sum(oi.quantity) as qty
from order_items oi
left join products p on p.id = oi.product_id
group by 1,2
order by qty desc;

-- basic seed roles
insert into roles (code, name)
values ('admin','Administrator'),('cashier','Cashier'),('inventory_clerk','Inventory Clerk')
on conflict (code) do nothing;


