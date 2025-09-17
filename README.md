# SulitServe Café

A minimal, modern café POS built with Next.js 15, Prisma, and PostgreSQL.

- Admin dashboard (products, inventory, staff, activity logs)
- Cashier workspace (orders, products)
- Customer kiosk (menu, cart, checkout, confirmation, tracking)
- Recipe-based stock computation (products consume inventory)

This guide explains how to install, configure, and use the system locally.

---

## 1) Prerequisites

- Node.js 18+ (LTS recommended)
- npm (or pnpm/yarn)
- PostgreSQL 13+ (local or hosted, e.g., Supabase)

Optional tools:
- Git
- Supabase CLI (if you host the database on Supabase)

---

## 2) Clone & Install

```
# Clone the repository
git clone <your-repo-url> sulitserve-cafe
cd sulitserve-cafe

# Install dependencies
npm install
# or: pnpm install / yarn install
```

> Replace `<your-repo-url>` with your GitHub repository URL.

---

## 3) Configure Environment Variables

Create a `.env` file in the project root and set:

```
# PostgreSQL connection string
POSTGRES_URL=postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DB_NAME>

# Public base URL for client-side API calls
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Notes:
- For Supabase, use the database connection string from the dashboard.
- Ensure the database exists and is reachable from your machine.

---

## 4) Database Setup (Prisma)

```
# Generate Prisma client
npx prisma generate

# Push schema to your database
npx prisma db push
```

Inspect data with Prisma Studio:
```
npx prisma studio
```

> On Windows, if you see occasional EPERM warnings, re-run the command or restart the dev server.

---

## 5) Run the App

```
# Development
npm run dev
# Then open http://localhost:3000

# Production build
npm run build
npm start
```

---

## 6) App Structure & URLs

- Landing page: `/`
- Admin dashboard: `/admin`
  - Products: `/admin/products`
  - Inventory: `/admin/inventory`
  - Staff: `/admin/staff`
  - Logs: `/admin/logs`
  - Archive: `/admin/archive`
- Cashier workspace: `/cashier`
  - Cashier products: `/cashier/products`
- Customer kiosk:
  - Welcome: `/kiosk`
  - Menu: `/kiosk/menu`
  - Checkout: `/kiosk/checkout`
  - Confirmation: `/kiosk/confirmation`
  - Track order: `/kiosk/track/[orderNumber]`

---

## 7) Core Concepts

### Products & Recipes
- Products can have a recipe (`ProductRecipe`) consisting of ingredient rows (`RecipeIngredient`).
- Each ingredient links to an `InventoryItem` with a unit and quantity.
- Stock availability is computed as the minimum of all `floor(available / needed)` per ingredient.

### Inventory
- Adjust stock at `/admin/inventory` via “Adjust Stock”.
- Each item shows usage (“Used by (N)”) grouped by product category.

### Activity Logs
- Admin actions are stored in `ActivityLog`.
- Staff login/logout and actions are stored in `StaffActivityLog`.

---

## 8) Using the System

1. Add inventory items (name, unit, quantity, low-stock threshold).
2. Add products; define recipes for items that should track stock.
3. Use the kiosk to place orders; completing orders deducts inventory.
4. Use the cashier dashboard to progress orders from `pending → preparing → ready → completed`.

---

## 9) Environment & Config Reference

- `POSTGRES_URL` – PostgreSQL connection string (required)
- `NEXT_PUBLIC_BASE_URL` – Base URL used by client components for API calls (optional; defaults to `http://localhost:3000`)

---

## 10) Common Commands

```
# Generate prisma client
npx prisma generate

# Push schema changes to DB
npx prisma db push

# Open prisma GUI
npx prisma studio

# Start dev server
npm run dev
```

---

## 11) Troubleshooting

- Prisma EPERM on Windows: Usually transient; re-run `npx prisma db push` or restart `npm run dev`.
- “Unknown field” errors after schema changes: run `npx prisma generate`.
- API 500 during product creation: ensure DB URL is set and API routes use Prisma.

---

## 12) Tech Stack

- Framework: Next.js 15 (App Router)
- ORM: Prisma
- DB: PostgreSQL (works well with Supabase)
- Styling: Tailwind CSS

---

## 13) License

This project is provided as-is for demonstration and internal use. Add a license of your choice if you plan to distribute.
