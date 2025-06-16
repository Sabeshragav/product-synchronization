# Product Synchronization with Medusa and Directus

This project demonstrates a system for synchronizing product data between a Directus instance (acting as a PIM or data source) and a MedusaJS e-commerce platform. It also includes a Next.js storefront powered by the Medusa backend.

## Overview

The primary goal of this project is to maintain product consistency between an external product information management system (Directus) and an e-commerce backend (Medusa). Changes made to products in Directus (creations, updates, deletions) are reflected in Medusa via a synchronization script. The Medusa instance then serves a Next.js storefront, allowing customers to browse and purchase these products.

## Components

The project is structured into three main parts:

1.  **`product-sync` (Medusa Backend)**

    - The core e-commerce platform built with MedusaJS (compatible with Medusa v2+).
    - Handles product management, orders, customers, and other e-commerce functionalities.
    - For more details, see the [`product-sync/README.md`](./product-sync/README.md).

2.  **`product-sync-storefront` (Next.js Storefront)**

    - A modern, performant e-commerce storefront built with Next.js 15.
    - Consumes data from the `product-sync` Medusa backend.
    - For more details, see the [`product-sync-storefront/README.md`](./product-sync-storefront/README.md).

3.  **`sync-product.js` (Synchronization Script)**
    - A Node.js script responsible for synchronizing product data from Directus to Medusa.
    - It connects to both Directus and Medusa admin APIs to:
      - Fetch products from Directus.
      - Create new products in Medusa if they don't exist.
      - Update existing products in Medusa if changes are detected in Directus.
      - Delete products from Medusa if they are no longer present in Directus.
      - Handles image uploads from Directus to Medusa.

## Prerequisites

- Node.js (>= v20, as specified in `product-sync/package.json`)
- Yarn (for `product-sync-storefront` and potentially `product-sync` if preferred for consistency)
- NPM (for root project dependencies)
- A running Directus instance (e.g., via Docker). You can use a command similar to the one in `medusa.txt` or refer to the [Directus documentation](https://docs.directus.io/getting-started/installation/docker.html).
  - Directus should have a "products" collection with fields like `name`, `description`, `price`, and `images`.
- A running PostgreSQL database for the Medusa backend.

## Setup and Running

### 1. Setup Directus

- Ensure your Directus instance is running and accessible (default `http://localhost:8055`).
- Configure a "products" collection with the necessary fields (e.g., `name`, `description`, `price`, `images`).
- Obtain admin credentials (email and password) for Directus.

### 2. Setup `product-sync` (Medusa Backend)

- Navigate to the `product-sync` directory: `cd product-sync`
- Install dependencies: `yarn install` (or `npm install`)
- Configure environment variables. Create a `.env` file in the `product-sync` directory. Key variables include:
  ```env
  DATABASE_URL=your_postgresql_connection_string
  JWT_SECRET=supersecretjwt
  COOKIE_SECRET=supersecretcookie
  STORE_CORS=http://localhost:8000
  ADMIN_CORS=http://localhost:7001
  # Ensure other Medusa-specific variables are set as needed.
  ```
- Run database migrations: `npx medusa migrations run` (or `yarn medusa migrations run`)
- (Optional) Seed data: `yarn seed` (or `npx medusa exec ./src/scripts/seed.ts`)
- Start the Medusa backend: `yarn dev` (runs on `http://localhost:9000` by default)
- Obtain Medusa admin credentials (email and password).

### 3. Setup `product-sync-storefront` (Next.js Storefront)

- Navigate to the `product-sync-storefront` directory: `cd product-sync-storefront`
- Install dependencies: `yarn install`
- Configure environment variables. As per its README, copy `.env.template` to `.env.local`:
  ```shell
  mv .env.template .env.local
  ```
  Ensure `NEXT_PUBLIC_MEDUSA_BACKEND_URL` in `.env.local` points to your Medusa backend (e.g., `http://localhost:9000`).
  ```env
  NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
  # Add NEXT_PUBLIC_STRIPE_KEY if you plan to use Stripe, as per its README
  # NEXT_PUBLIC_STRIPE_KEY=your-stripe-public-key
  ```
- Start the storefront: `yarn dev` (runs on `http://localhost:8000` by default)

### 4. Configure and Run `sync-product.js`

- Navigate to the root project directory (`product-synchronization`).
- Install root dependencies: `npm install`
- Create a `.env` file in the root directory (`product-synchronization/.env`) with the following credentials:
  ```env
  DIRECTUS_EMAIL=your_directus_admin_email
  DIRECTUS_PASS=your_directus_admin_password
  MEDUSA_EMAIL=your_medusa_admin_email
  MEDUSA_PASS=your_medusa_admin_password
  ```
- Run the synchronization script: `node sync-product.js`

## Key Technologies

- **MedusaJS**: Open-source composable commerce engine.
- **Directus**: Open-source data platform (used here as a Headless CMS/PIM).
- **Next.js**: React framework for building server-side rendered and static web applications.
- **Node.js**: JavaScript runtime environment.
- **TypeScript**: Superset of JavaScript that adds static typing.
- **PostgreSQL**: Database for Medusa.

## Project Structure

```
product-synchronization/
├── .env                        # For sync-product.js credentials (GITIGNORED)
├── product-sync/               # Medusa backend
│   ├── .env                    # For Medusa backend config (GITIGNORED)
│   ├── src/
│   ├── package.json
│   └── README.md
├── product-sync-storefront/    # Next.js storefront
│   ├── .env.local              # For Next.js storefront config (GITIGNORED)
│   ├── src/
│   ├── package.json
│   └── README.md
├── sync-product.js             # Product synchronization script
├── medusa.txt                  # Notes on Medusa and Directus
├── package.json                # Root dependencies for sync script
└── README.md                   # This file
```
