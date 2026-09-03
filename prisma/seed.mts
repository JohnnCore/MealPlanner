/**
 * Seeds reference data that the app expects to already exist.
 *
 * This script runs outside the Next.js app (via `npx prisma db seed`), before any
 * request lifecycle exists, so it is the one sanctioned place that talks to Prisma
 * without going through `src/server/<domain>/`. It is self-contained on purpose —
 * `@/` path aliases are not resolvable when Node runs this file directly.
 *
 * Idempotent: safe to re-run at any time.
 */
import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

/** The eight major allergens surfaced in the profile's allergy picker. */
const DEFAULT_ALLERGIES = [
  'Dairy',
  'Eggs',
  'Fish',
  'Shellfish',
  'Tree Nuts',
  'Peanuts',
  'Wheat',
  'Soy',
];

/**
 * A starter set of common global ingredients (createdByUserId left unset = shared
 * catalog) so a fresh environment's pantry/recipe ingredient search isn't empty.
 * The catalog also grows organically from user-created private ingredients and
 * AI-generated recipes — this is just enough to make the search box useful on day one.
 */
const DEFAULT_INGREDIENTS = [
  { name: 'Tomato', category: 'VEGETABLE', icon: '🍅' },
  { name: 'Onion', category: 'VEGETABLE', icon: '🧅' },
  { name: 'Carrot', category: 'VEGETABLE', icon: '🥕' },
  { name: 'Potato', category: 'VEGETABLE', icon: '🥔' },
  { name: 'Spinach', category: 'VEGETABLE', icon: '🥬' },
  { name: 'Bell Pepper', category: 'VEGETABLE', icon: '🫑' },
  { name: 'Broccoli', category: 'VEGETABLE', icon: '🥦' },
  { name: 'Garlic', category: 'VEGETABLE', icon: '🧄' },
  { name: 'Apple', category: 'FRUIT', icon: '🍎' },
  { name: 'Banana', category: 'FRUIT', icon: '🍌' },
  { name: 'Lemon', category: 'FRUIT', icon: '🍋' },
  { name: 'Avocado', category: 'FRUIT', icon: '🥑' },
  { name: 'Chicken Breast', category: 'MEAT', icon: '🍗' },
  { name: 'Ground Beef', category: 'MEAT', icon: '🥩' },
  { name: 'Bacon', category: 'MEAT', icon: '🥓' },
  { name: 'Salmon', category: 'FISH', icon: '🐟' },
  { name: 'Shrimp', category: 'FISH', icon: '🦐' },
  { name: 'Milk', category: 'DAIRY', icon: '🥛' },
  { name: 'Cheese', category: 'DAIRY', icon: '🧀' },
  { name: 'Butter', category: 'DAIRY', icon: '🧈' },
  { name: 'Eggs', category: 'DAIRY', icon: '🥚' },
  { name: 'Yogurt', category: 'DAIRY', icon: '🥣' },
  { name: 'Rice', category: 'GRAIN', icon: '🌾' },
  { name: 'Pasta', category: 'GRAIN', icon: '🍝' },
  { name: 'Bread', category: 'GRAIN', icon: '🍞' },
  { name: 'Flour', category: 'GRAIN', icon: '🌾' },
  { name: 'Black Beans', category: 'LEGUME', icon: '🫘' },
  { name: 'Chickpeas', category: 'LEGUME', icon: '🫘' },
  { name: 'Salt', category: 'SPICE', icon: '🧂' },
  { name: 'Black Pepper', category: 'SPICE', icon: '🧂' },
  { name: 'Olive Oil', category: 'OIL', icon: '🫒' },
] as const;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    await prisma.allergy.createMany({
      data: DEFAULT_ALLERGIES.map(name => ({ name })),
      skipDuplicates: true,
    });

    const allergyCount = await prisma.allergy.count();
    process.stdout.write(`Seeded allergies — ${allergyCount} total in database.\n`);

    // `skipDuplicates` can't be used here: Ingredient's unique constraint is
    // (name, createdByUserId), and Postgres treats NULL (the global catalog's
    // createdByUserId) as distinct from itself, so it wouldn't dedupe re-runs.
    // Filter against existing global names ourselves instead.
    const existingGlobal = await prisma.ingredient.findMany({
      where: { createdByUserId: null },
      select: { name: true },
    });
    const existingNames = new Set(existingGlobal.map(i => i.name.toLowerCase()));

    const newIngredients = DEFAULT_INGREDIENTS.filter(
      i => !existingNames.has(i.name.toLowerCase()),
    );

    if (newIngredients.length > 0) {
      await prisma.ingredient.createMany({ data: newIngredients });
    }

    const ingredientCount = await prisma.ingredient.count({ where: { createdByUserId: null } });
    process.stdout.write(`Seeded ingredients — ${ingredientCount} global ingredients in database.\n`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

await main();
