import { ExpenseStatus, PaymentMethod, PrismaClient } from '@prisma/client';
import { argon2id, hash } from 'argon2';

const prisma = new PrismaClient();

const defaultCategories = [
  { name: 'Casa', slug: 'casa', icon: 'bi-house', color: '#4F46E5' },
  { name: 'Affitto', slug: 'affitto', icon: 'bi-building', color: '#7C3AED' },
  { name: 'Bollette', slug: 'bollette', icon: 'bi-receipt', color: '#2563EB' },
  {
    name: 'Spesa alimentare',
    slug: 'spesa-alimentare',
    icon: 'bi-basket',
    color: '#16A34A'
  },
  {
    name: 'Ristoranti',
    slug: 'ristoranti',
    icon: 'bi-cup-hot',
    color: '#EA580C'
  },
  {
    name: 'Trasporti',
    slug: 'trasporti',
    icon: 'bi-bus-front',
    color: '#0891B2'
  },
  {
    name: 'Carburante',
    slug: 'carburante',
    icon: 'bi-fuel-pump',
    color: '#0F766E'
  },
  { name: 'Auto', slug: 'auto', icon: 'bi-car-front', color: '#475569' },
  { name: 'Salute', slug: 'salute', icon: 'bi-heart-pulse', color: '#DC2626' },
  { name: 'Farmacia', slug: 'farmacia', icon: 'bi-capsule', color: '#DB2777' },
  { name: 'Shopping', slug: 'shopping', icon: 'bi-bag', color: '#C026D3' },
  {
    name: 'Intrattenimento',
    slug: 'intrattenimento',
    icon: 'bi-controller',
    color: '#9333EA'
  },
  { name: 'Viaggi', slug: 'viaggi', icon: 'bi-airplane', color: '#0284C7' },
  {
    name: 'Abbonamenti',
    slug: 'abbonamenti',
    icon: 'bi-arrow-repeat',
    color: '#6366F1'
  },
  {
    name: 'Istruzione',
    slug: 'istruzione',
    icon: 'bi-mortarboard',
    color: '#CA8A04'
  },
  { name: 'Regali', slug: 'regali', icon: 'bi-gift', color: '#E11D48' },
  { name: 'Tasse', slug: 'tasse', icon: 'bi-bank', color: '#64748B' },
  { name: 'Lavoro', slug: 'lavoro', icon: 'bi-briefcase', color: '#0369A1' },
  { name: 'Animali', slug: 'animali', icon: 'bi-heart', color: '#B45309' },
  { name: 'Altro', slug: 'altro', icon: 'bi-three-dots', color: '#6B7280' }
] as const;

async function seed(): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    for (const [index, category] of defaultCategories.entries()) {
      const existing = await transaction.category.findFirst({
        where: { userId: null, slug: category.slug }
      });
      const data = {
        ...category,
        sortOrder: index + 1,
        isDefault: true,
        isActive: true,
        deletedAt: null
      };

      if (existing) {
        await transaction.category.update({ where: { id: existing.id }, data });
      } else {
        await transaction.category.create({ data });
      }
    }
  });

  if (process.env['NODE_ENV'] === 'development') {
    const demoUser = await seedDemoUser();
    await seedDemoExpenses(demoUser.id);
  }

  console.info(`Seed completato: ${defaultCategories.length} categorie predefinite`);
}

async function seedDemoUser() {
  const email = (process.env['DEMO_USER_EMAIL'] ?? 'demo@expense.local')
    .trim()
    .toLowerCase();
  const password = process.env['DEMO_USER_PASSWORD'] ?? 'DemoExpense2026!';
  const passwordHash = await hash(password, {
    type: argon2id,
    memoryCost: 65_536,
    timeCost: 3,
    parallelism: 1
  });

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      firstName: 'Utente',
      lastName: 'Demo',
      currency: process.env['DEFAULT_CURRENCY'] ?? 'EUR',
      timezone: process.env['DEFAULT_TIMEZONE'] ?? 'Europe/Rome'
    },
    update: {
      firstName: 'Utente',
      lastName: 'Demo',
      currency: process.env['DEFAULT_CURRENCY'] ?? 'EUR',
      timezone: process.env['DEFAULT_TIMEZONE'] ?? 'Europe/Rome'
    }
  });

  console.info(`Utente demo disponibile: ${email}`);
  return user;
}

const demoLabels = [
  { name: 'Spese condivise', slug: 'spese-condivise', color: '#2563EB', icon: 'bi-people' },
  { name: 'Pranzo di lavoro', slug: 'pranzo-di-lavoro', color: '#F59E0B', icon: 'bi-briefcase' },
  { name: 'Casa nuova', slug: 'casa-nuova', color: '#16A34A', icon: 'bi-house-door' },
  { name: 'Spesa straordinaria', slug: 'spesa-straordinaria', color: '#DC2626', icon: 'bi-stars' },
] as const;

const demoExpenses = [
  ['01', 'Affitto luglio', '850.00', '2026-07-01', 'Affitto', PaymentMethod.BANK_TRANSFER, ExpenseStatus.COMPLETED, []],
  ['02', 'Spesa settimanale', '74.65', '2026-07-03', 'Spesa alimentare', PaymentMethod.DEBIT_CARD, ExpenseStatus.COMPLETED, ['spese-condivise']],
  ['03', 'Rifornimento auto', '63.20', '2026-07-05', 'Carburante', PaymentMethod.CREDIT_CARD, ExpenseStatus.COMPLETED, []],
  ['04', 'Cena con amici', '48.00', '2026-07-06', 'Ristoranti', PaymentMethod.DIGITAL_WALLET, ExpenseStatus.COMPLETED, ['spese-condivise']],
  ['05', 'Farmaci', '18.90', '2026-07-08', 'Farmacia', PaymentMethod.CASH, ExpenseStatus.COMPLETED, []],
  ['06', 'Pranzo cliente', '32.50', '2026-07-10', 'Ristoranti', PaymentMethod.CREDIT_CARD, ExpenseStatus.COMPLETED, ['pranzo-di-lavoro']],
  ['07', 'Abbonamento streaming', '12.99', '2026-07-12', 'Abbonamenti', PaymentMethod.DIRECT_DEBIT, ExpenseStatus.COMPLETED, []],
  ['08', 'Bolletta elettrica', '96.40', '2026-07-20', 'Bollette', PaymentMethod.DIRECT_DEBIT, ExpenseStatus.PLANNED, []],
  ['09', 'Weekend al mare', '280.00', '2026-08-01', 'Viaggi', PaymentMethod.CREDIT_CARD, ExpenseStatus.PLANNED, ['spese-condivise']],
  ['10', 'Assicurazione auto', '420.00', '2026-08-15', 'Auto', PaymentMethod.BANK_TRANSFER, ExpenseStatus.PLANNED, ['spesa-straordinaria']],
  ['11', 'Affitto giugno', '850.00', '2026-06-01', 'Affitto', PaymentMethod.BANK_TRANSFER, ExpenseStatus.COMPLETED, []],
  ['12', 'Spesa supermercato', '68.30', '2026-06-07', 'Spesa alimentare', PaymentMethod.DEBIT_CARD, ExpenseStatus.COMPLETED, ['spese-condivise']],
  ['13', 'Visita medica', '120.00', '2026-06-11', 'Salute', PaymentMethod.CASH, ExpenseStatus.COMPLETED, ['spesa-straordinaria']],
  ['14', 'Scarpe', '89.90', '2026-06-16', 'Shopping', PaymentMethod.CREDIT_CARD, ExpenseStatus.CANCELLED, []],
  ['15', 'Biglietti treno', '54.80', '2026-06-22', 'Trasporti', PaymentMethod.DIGITAL_WALLET, ExpenseStatus.COMPLETED, []],
  ['16', 'Affitto maggio', '850.00', '2026-05-01', 'Affitto', PaymentMethod.BANK_TRANSFER, ExpenseStatus.COMPLETED, []],
  ['17', 'Lampada soggiorno', '79.00', '2026-05-09', 'Casa', PaymentMethod.DEBIT_CARD, ExpenseStatus.COMPLETED, ['casa-nuova']],
  ['18', 'Libri corso', '46.50', '2026-05-14', 'Istruzione', PaymentMethod.CREDIT_CARD, ExpenseStatus.COMPLETED, []],
  ['19', 'Regalo compleanno', '55.00', '2026-05-21', 'Regali', PaymentMethod.CASH, ExpenseStatus.COMPLETED, []],
  ['20', 'Veterinario', '92.00', '2026-05-27', 'Animali', PaymentMethod.DEBIT_CARD, ExpenseStatus.COMPLETED, ['spesa-straordinaria']],
] as const;

async function seedDemoExpenses(userId: string): Promise<void> {
  const categories = await prisma.category.findMany({
    where: { userId: null, isDefault: true, deletedAt: null },
  });
  const categoryByName = new Map(categories.map((category) => [category.name, category]));
  const labelsBySlug = new Map<string, string>();

  for (const item of demoLabels) {
    const categoryId = item.slug === 'pranzo-di-lavoro' ? categoryByName.get('Lavoro')?.id : null;
    const label = await prisma.label.upsert({
      where: { userId_slug: { userId, slug: item.slug } },
      create: { userId, categoryId, ...item, sortOrder: labelsBySlug.size + 1 },
      update: { categoryId, ...item, isActive: true, deletedAt: null },
    });
    labelsBySlug.set(item.slug, label.id);
  }

  for (const [suffix, description, amount, expenseDate, categoryName, paymentMethod, status, labelSlugs] of demoExpenses) {
    const category = categoryByName.get(categoryName);
    if (!category) throw new Error(`Categoria demo non trovata: ${categoryName}`);
    const labelIds = labelSlugs.map((slug) => labelsBySlug.get(slug)).filter((id): id is string => Boolean(id));
    const id = `40000000-0000-4000-8000-${suffix.padStart(12, '0')}`;
    const data = {
      userId,
      categoryId: category.id,
      description,
      amount,
      expenseDate: new Date(`${expenseDate}T00:00:00.000Z`),
      expenseTime: null,
      merchant: null,
      paymentMethod,
      notes: null,
      status,
      deletedAt: null,
    };
    await prisma.expense.upsert({
      where: { id },
      create: { ...data, id, labels: { create: labelIds.map((labelId) => ({ labelId })) } },
      update: {
        ...data,
        labels: { deleteMany: {}, create: labelIds.map((labelId) => ({ labelId })) },
      },
    });
  }
  console.info(`Spese demo disponibili: ${demoExpenses.length}`);
}

seed()
  .catch((error: unknown) => {
    console.error('Seed non riuscito', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
