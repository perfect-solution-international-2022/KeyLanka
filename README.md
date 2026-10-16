This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Configure `DATABASE_URL` in `.env` using `.env.example`, then apply the MySQL
migrations and generate Prisma Client:

```powershell
npx.cmd prisma migrate dev
```

The migration history supports replay into an empty database, including Prisma's
shadow database. The July 28 reconciliation only removes optional legacy objects;
earlier migrations already create the product, shipping, and security fields.
The July 31 restore migration supplies the missing locksmith, payment, wholesale,
and featured-product schema before the performance indexes are created.

If another database already applied the original July 22 user-role or July 28
reconciliation migration, these corrected files will differ from its recorded
checksums. Databases that received the restored fields manually also need a
schema/history reconciliation before applying the restore migration. Do not reset
a populated database to clear those warnings; review its schema and migration
records first. See [Prisma migration troubleshooting](https://www.prisma.io/docs/orm/prisma-migrate/workflows/troubleshooting).

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
