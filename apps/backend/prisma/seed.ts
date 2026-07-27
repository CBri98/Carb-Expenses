import {
  ExpenseStatus,
  NotificationStatus,
  NotificationType,
  PaymentMethod,
  PrismaClient,
  RecurrenceFrequency,
  RecurrenceStatus,
  ReminderType,
} from '@prisma/client';
import { argon2id, hash } from 'argon2';

import {
  localCalendarDate,
  localDateTimeToUtc,
  REMINDER_OFFSET_MINUTES,
} from '../src/notifications/notification-time.utils';
import { RecurrenceCalculatorService } from '../src/recurrences/recurrence-calculator.service';
import { defaultPreferenceData } from '../src/settings/settings.defaults';

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
    await seedDemoNotifications(demoUser.id);
    await seedDemoRecurrences(demoUser.id);
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

  const preferenceDefaults = defaultPreferenceData();
  await prisma.userPreference.upsert({
    where: { userId: user.id },
    create: { ...preferenceDefaults, userId: user.id },
    update: { dashboardTrendMonths: preferenceDefaults.dashboardTrendMonths },
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
  ['21', 'Affitto aprile', '850.00', '2026-04-01', 'Affitto', PaymentMethod.BANK_TRANSFER, ExpenseStatus.COMPLETED, []],
  ['22', 'Cinema', '24.00', '2026-04-18', 'Intrattenimento', PaymentMethod.DIGITAL_WALLET, ExpenseStatus.COMPLETED, []],
  ['23', 'Affitto marzo', '850.00', '2026-03-01', 'Affitto', PaymentMethod.BANK_TRANSFER, ExpenseStatus.COMPLETED, []],
  ['24', 'Bolletta gas', '112.40', '2026-02-12', 'Bollette', PaymentMethod.DIRECT_DEBIT, ExpenseStatus.COMPLETED, []],
  ['25', 'Caffè del mattino', '2.20', '2026-07-10', 'Caffè e bar', PaymentMethod.CASH, ExpenseStatus.COMPLETED, []],
] as const;

async function seedDemoExpenses(userId: string): Promise<void> {
  const categories = await prisma.category.findMany({
    where: { userId: null, isDefault: true, deletedAt: null },
  });
  const categoryByName = new Map(categories.map((category) => [category.name, category]));
  const customCategory = await prisma.category.upsert({
    where: { userId_slug: { userId, slug: 'caffe-e-bar' } },
    create: { userId, name: 'Caffè e bar', slug: 'caffe-e-bar', icon: 'bi-cup-hot', color: '#92400E', sortOrder: 1 },
    update: { name: 'Caffè e bar', icon: 'bi-cup-hot', color: '#92400E', isActive: true, deletedAt: null },
  });
  categoryByName.set(customCategory.name, customCategory);
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

async function seedDemoNotifications(userId: string): Promise<void> {
  const categories = await prisma.category.findMany({
    where: { userId: null, name: { in: ['Bollette', 'Auto', 'Casa'] }, deletedAt: null },
  });
  const categoryByName = new Map(categories.map((category) => [category.name, category.id]));
  const timezone = process.env['DEFAULT_TIMEZONE'] ?? 'Europe/Rome';
  const defaultTime = process.env['DEFAULT_EXPENSE_REMINDER_TIME'] ?? '09:00';
  const today = localCalendarDate(new Date(), timezone);
  const definitions = [
    {
      id: '40000000-0000-4000-8000-000000000026',
      description: 'Assicurazione casa tra 7 giorni',
      amount: '245.00',
      date: addLocalDays(today, 7),
      category: 'Casa',
    },
    {
      id: '40000000-0000-4000-8000-000000000027',
      description: 'Bolletta internet tra 3 giorni',
      amount: '39.90',
      date: addLocalDays(today, 3),
      category: 'Bollette',
    },
    {
      id: '40000000-0000-4000-8000-000000000028',
      description: 'Bollo auto previsto oggi',
      amount: '198.40',
      date: today,
      category: 'Auto',
    },
    {
      id: '40000000-0000-4000-8000-000000000029',
      description: 'Bolletta acqua scaduta',
      amount: '71.25',
      date: addLocalDays(today, -2),
      category: 'Bollette',
    },
  ] as const;

  for (const definition of definitions) {
    const categoryId = categoryByName.get(definition.category);
    if (!categoryId) throw new Error(`Categoria demo non trovata: ${definition.category}`);
    await prisma.expense.upsert({
      where: { id: definition.id },
      create: {
        id: definition.id,
        userId,
        categoryId,
        description: definition.description,
        amount: definition.amount,
        expenseDate: new Date(`${definition.date}T00:00:00.000Z`),
        paymentMethod: PaymentMethod.DIRECT_DEBIT,
        status: ExpenseStatus.PLANNED,
        overdueNotifiedForDate:
          definition.id.endsWith('29') ? new Date(`${definition.date}T00:00:00.000Z`) : null,
      },
      update: {
        categoryId,
        description: definition.description,
        amount: definition.amount,
        expenseDate: new Date(`${definition.date}T00:00:00.000Z`),
        paymentMethod: PaymentMethod.DIRECT_DEBIT,
        status: ExpenseStatus.PLANNED,
        deletedAt: null,
        overdueNotifiedForDate:
          definition.id.endsWith('29') ? new Date(`${definition.date}T00:00:00.000Z`) : null,
      },
    });
  }

  const deadline = (date: string): Date => localDateTimeToUtc(date, defaultTime, timezone);
  const reminderDefinitions = [
    {
      id: '50000000-0000-4000-8000-000000000001',
      expenseId: definitions[0].id,
      type: ReminderType.SEVEN_DAYS_BEFORE,
      scheduledAt: offsetDate(deadline(definitions[0].date), REMINDER_OFFSET_MINUTES.SEVEN_DAYS_BEFORE),
      processedAt: null,
    },
    {
      id: '50000000-0000-4000-8000-000000000002',
      expenseId: definitions[0].id,
      type: ReminderType.THREE_DAYS_BEFORE,
      scheduledAt: offsetDate(deadline(definitions[0].date), REMINDER_OFFSET_MINUTES.THREE_DAYS_BEFORE),
      processedAt: null,
    },
    {
      id: '50000000-0000-4000-8000-000000000003',
      expenseId: definitions[1].id,
      type: ReminderType.ONE_DAY_BEFORE,
      scheduledAt: offsetDate(deadline(definitions[1].date), REMINDER_OFFSET_MINUTES.ONE_DAY_BEFORE),
      processedAt: null,
    },
    {
      id: '50000000-0000-4000-8000-000000000004',
      expenseId: definitions[2].id,
      type: ReminderType.SAME_DAY,
      scheduledAt: deadline(definitions[2].date),
      processedAt: new Date(),
    },
  ] as const;

  for (const reminder of reminderDefinitions) {
    await prisma.expenseReminder.upsert({
      where: { id: reminder.id },
      create: {
        id: reminder.id,
        userId,
        expenseId: reminder.expenseId,
        type: reminder.type,
        offsetMinutes: REMINDER_OFFSET_MINUTES[reminder.type],
        scheduledAt: reminder.scheduledAt,
        processedAt: reminder.processedAt,
      },
      update: {
        type: reminder.type,
        offsetMinutes: REMINDER_OFFSET_MINUTES[reminder.type],
        scheduledAt: reminder.scheduledAt,
        processedAt: reminder.processedAt,
        isActive: true,
        cancelledAt: null,
      },
    });
  }

  const notifications = [
    {
      id: '60000000-0000-4000-8000-000000000001',
      expenseId: definitions[2].id,
      reminderId: reminderDefinitions[3].id,
      type: NotificationType.EXPENSE_DUE_TODAY,
      status: NotificationStatus.UNREAD,
      title: 'Spesa prevista oggi',
      message: `La spesa “${definitions[2].description}” è prevista per oggi.`,
      scheduledAt: deadline(definitions[2].date),
      deduplicationKey: `expense-due-today:${definitions[2].id}:${definitions[2].date}`,
    },
    {
      id: '60000000-0000-4000-8000-000000000002',
      expenseId: definitions[1].id,
      reminderId: null,
      type: NotificationType.EXPENSE_REMINDER,
      status: NotificationStatus.READ,
      title: 'Promemoria registrato',
      message: `Hai configurato i promemoria per “${definitions[1].description}”.`,
      scheduledAt: new Date(),
      deduplicationKey: `seed-reminder-read:${definitions[1].id}`,
    },
    {
      id: '60000000-0000-4000-8000-000000000003',
      expenseId: definitions[0].id,
      reminderId: null,
      type: NotificationType.EXPENSE_REMINDER,
      status: NotificationStatus.ARCHIVED,
      title: 'Promemoria archiviato',
      message: `Notifica dimostrativa per “${definitions[0].description}”.`,
      scheduledAt: new Date(),
      deduplicationKey: `seed-reminder-archived:${definitions[0].id}`,
    },
    {
      id: '60000000-0000-4000-8000-000000000004',
      expenseId: definitions[3].id,
      reminderId: null,
      type: NotificationType.EXPENSE_OVERDUE,
      status: NotificationStatus.UNREAD,
      title: 'Spesa scaduta',
      message: `La spesa “${definitions[3].description}” risulta scaduta.`,
      scheduledAt: deadline(definitions[3].date),
      deduplicationKey: `expense-overdue:${definitions[3].id}:${definitions[3].date}`,
    },
  ] as const;

  for (const notification of notifications) {
    const readAt = notification.status === NotificationStatus.READ ? new Date() : null;
    const archivedAt = notification.status === NotificationStatus.ARCHIVED ? new Date() : null;
    await prisma.notification.upsert({
      where: { id: notification.id },
      create: { ...notification, userId, readAt, archivedAt },
      update: { ...notification, userId, readAt, archivedAt },
    });
  }
  console.info('Promemoria e notifiche demo disponibili');
}

async function seedDemoRecurrences(userId: string): Promise<void> {
  const categories = await prisma.category.findMany({
    where: {
      deletedAt: null,
      OR: [
        { userId: null, name: { in: ['Affitto', 'Abbonamenti', 'Auto', 'Casa'] } },
        { userId, slug: 'caffe-e-bar' },
      ],
    },
  });
  const categoryByName = new Map(categories.map((category) => [category.name, category.id]));
  const labels = await prisma.label.findMany({
    where: { userId, slug: { in: ['spese-condivise', 'casa-nuova'] }, deletedAt: null },
  });
  const labelBySlug = new Map(labels.map((label) => [label.slug, label.id]));
  const timezone = process.env['DEFAULT_TIMEZONE'] ?? 'Europe/Rome';
  const today = localCalendarDate(new Date(), timezone);
  const calculator = new RecurrenceCalculatorService();
  const definitions = [
    {
      suffix: '01',
      name: 'Affitto appartamento',
      description: 'Affitto mensile',
      amount: '850.00',
      category: 'Affitto',
      frequency: RecurrenceFrequency.MONTHLY,
      interval: 1,
      startDate: addLocalDays(today, 5),
      status: RecurrenceStatus.ACTIVE,
      maxOccurrences: null,
      labels: ['spese-condivise'],
      reminders: [ReminderType.THREE_DAYS_BEFORE, ReminderType.SAME_DAY],
    },
    {
      suffix: '02',
      name: 'Streaming famiglia',
      description: 'Abbonamento streaming',
      amount: '12.99',
      category: 'Abbonamenti',
      frequency: RecurrenceFrequency.MONTHLY,
      interval: 1,
      startDate: addLocalDays(today, 8),
      status: RecurrenceStatus.ACTIVE,
      maxOccurrences: null,
      labels: [],
      reminders: [ReminderType.ONE_DAY_BEFORE],
    },
    {
      suffix: '03',
      name: 'Rata auto',
      description: 'Rata finanziamento auto',
      amount: '315.00',
      category: 'Auto',
      frequency: RecurrenceFrequency.MONTHLY,
      interval: 1,
      startDate: addLocalDays(today, 12),
      status: RecurrenceStatus.ACTIVE,
      maxOccurrences: 36,
      labels: [],
      reminders: [ReminderType.THREE_DAYS_BEFORE],
    },
    {
      suffix: '04',
      name: 'Assicurazione casa',
      description: 'Premio assicurazione casa',
      amount: '245.00',
      category: 'Casa',
      frequency: RecurrenceFrequency.YEARLY,
      interval: 1,
      startDate: addLocalDays(today, 20),
      status: RecurrenceStatus.ACTIVE,
      maxOccurrences: null,
      labels: ['casa-nuova'],
      reminders: [ReminderType.SEVEN_DAYS_BEFORE],
    },
    {
      suffix: '05',
      name: 'Pulizie domestiche',
      description: 'Servizio pulizie',
      amount: '45.00',
      category: 'Casa',
      frequency: RecurrenceFrequency.WEEKLY,
      interval: 2,
      startDate: addLocalDays(today, 3),
      status: RecurrenceStatus.ACTIVE,
      maxOccurrences: null,
      labels: [],
      reminders: [ReminderType.ONE_DAY_BEFORE],
    },
    {
      suffix: '06',
      name: 'Consegna caffè',
      description: 'Abbonamento caffè',
      amount: '18.50',
      category: 'Caffè e bar',
      frequency: RecurrenceFrequency.MONTHLY,
      interval: 1,
      startDate: addLocalDays(today, 15),
      status: RecurrenceStatus.PAUSED,
      maxOccurrences: null,
      labels: [],
      reminders: [],
    },
    {
      suffix: '07',
      name: 'Corso online concluso',
      description: 'Rata corso online',
      amount: '60.00',
      category: 'Abbonamenti',
      frequency: RecurrenceFrequency.MONTHLY,
      interval: 1,
      startDate: addLocalDays(today, -10),
      status: RecurrenceStatus.COMPLETED,
      maxOccurrences: 1,
      labels: [],
      reminders: [],
    },
  ] as const;

  for (const definition of definitions) {
    const categoryId = categoryByName.get(definition.category);
    if (!categoryId) throw new Error(`Categoria ricorrenza demo non trovata: ${definition.category}`);
    const ruleId = `70000000-0000-4000-8000-${definition.suffix.padStart(12, '0')}`;
    const expenseId = `80000000-0000-4000-8000-${definition.suffix.padStart(12, '0')}`;
    const startDate = new Date(`${definition.startDate}T00:00:00.000Z`);
    const schedule = {
      frequency: definition.frequency,
      interval: definition.interval,
      startDate,
      endDate: null,
      maxOccurrences: definition.maxOccurrences,
    };
    const nextOccurrenceDate =
      definition.status === RecurrenceStatus.COMPLETED
        ? null
        : calculator.next(startDate, schedule);
    const labelIds = definition.labels
      .map((slug) => labelBySlug.get(slug))
      .filter((id): id is string => Boolean(id));

    await prisma.recurrenceRule.upsert({
      where: { id: ruleId },
      create: {
        id: ruleId,
        userId,
        categoryId,
        name: definition.name,
        description: definition.description,
        amount: definition.amount,
        paymentMethod: PaymentMethod.DIRECT_DEBIT,
        frequency: definition.frequency,
        interval: definition.interval,
        status: definition.status,
        startDate,
        nextOccurrenceDate,
        lastGeneratedDate: startDate,
        maxOccurrences: definition.maxOccurrences,
        generatedCount: 1,
        expenseTime: new Date('1970-01-01T09:00:00.000Z'),
        generateDaysAhead: 60,
        pausedAt: definition.status === RecurrenceStatus.PAUSED ? new Date() : null,
        completedAt: definition.status === RecurrenceStatus.COMPLETED ? new Date() : null,
      },
      update: {
        categoryId,
        name: definition.name,
        description: definition.description,
        amount: definition.amount,
        paymentMethod: PaymentMethod.DIRECT_DEBIT,
        frequency: definition.frequency,
        interval: definition.interval,
        status: definition.status,
        startDate,
        nextOccurrenceDate,
        lastGeneratedDate: startDate,
        maxOccurrences: definition.maxOccurrences,
        generatedCount: 1,
        expenseTime: new Date('1970-01-01T09:00:00.000Z'),
        generateDaysAhead: 60,
        pausedAt: definition.status === RecurrenceStatus.PAUSED ? new Date() : null,
        completedAt: definition.status === RecurrenceStatus.COMPLETED ? new Date() : null,
        cancelledAt: null,
        deletedAt: null,
      },
    });
    await prisma.recurrenceRuleLabel.deleteMany({ where: { recurrenceRuleId: ruleId } });
    if (labelIds.length > 0) {
      await prisma.recurrenceRuleLabel.createMany({
        data: labelIds.map((labelId) => ({ recurrenceRuleId: ruleId, labelId })),
      });
    }
    await prisma.recurrenceReminderTemplate.deleteMany({
      where: { recurrenceRuleId: ruleId },
    });
    if (definition.reminders.length > 0) {
      await prisma.recurrenceReminderTemplate.createMany({
        data: definition.reminders.map((type) => ({
          recurrenceRuleId: ruleId,
          type,
          offsetMinutes: REMINDER_OFFSET_MINUTES[type],
          reminderTime: new Date('1970-01-01T09:00:00.000Z'),
        })),
      });
    }
    await prisma.expense.upsert({
      where: { id: expenseId },
      create: {
        id: expenseId,
        userId,
        categoryId,
        description: definition.description,
        amount: definition.amount,
        expenseDate: startDate,
        expenseTime: new Date('1970-01-01T09:00:00.000Z'),
        paymentMethod: PaymentMethod.DIRECT_DEBIT,
        status: ExpenseStatus.PLANNED,
        recurrenceRuleId: ruleId,
        occurrenceDate: startDate,
        generatedByRecurrence: true,
        labels: { create: labelIds.map((labelId) => ({ labelId })) },
      },
      update: {
        categoryId,
        description: definition.description,
        amount: definition.amount,
        expenseDate: startDate,
        expenseTime: new Date('1970-01-01T09:00:00.000Z'),
        paymentMethod: PaymentMethod.DIRECT_DEBIT,
        recurrenceRuleId: ruleId,
        occurrenceDate: startDate,
        generatedByRecurrence: true,
        labels: {
          deleteMany: {},
          create: labelIds.map((labelId) => ({ labelId })),
        },
      },
    });
    for (const type of definition.reminders) {
      const deadline = localDateTimeToUtc(definition.startDate, '09:00', timezone);
      const scheduledAt = offsetDate(deadline, REMINDER_OFFSET_MINUTES[type]);
      await prisma.expenseReminder.upsert({
        where: {
          expenseId_type_scheduledAt: {
            expenseId,
            type,
            scheduledAt,
          },
        },
        create: {
          userId,
          expenseId,
          type,
          offsetMinutes: REMINDER_OFFSET_MINUTES[type],
          scheduledAt,
          isActive: scheduledAt >= new Date(),
          cancelledAt: scheduledAt < new Date() ? new Date() : null,
        },
        update: {},
      });
    }
  }
  console.info(`Ricorrenze demo disponibili: ${definitions.length}`);
}

function addLocalDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function offsetDate(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * 60_000);
}

seed()
  .catch((error: unknown) => {
    console.error('Seed non riuscito', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
