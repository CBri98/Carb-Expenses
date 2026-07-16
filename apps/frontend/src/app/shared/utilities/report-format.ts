import type {
  CategoryComparisonItem,
  ComparisonDirection,
  ComparisonMetric,
  ComparisonMetricName,
  DailyComparisonPoint,
  MonthComparison,
  MonthlyReportQuery,
} from '../models/report.models';
import { dashboardPeriodLabel } from './dashboard-format';
import { formatEuroAmount } from './expense-format';

export const REPORT_METRIC_LABELS: Record<ComparisonMetricName, string> = {
  COMPLETED_TOTAL: 'Totale speso',
  PLANNED_TOTAL: 'Totale pianificato',
  COMPLETED_COUNT: 'Spese completate',
  PLANNED_COUNT: 'Spese pianificate',
  DAILY_AVERAGE: 'Media giornaliera',
  TRANSACTION_AVERAGE: 'Media per transazione',
  HIGHEST_EXPENSE: 'Spesa più alta',
  CATEGORY_COUNT: 'Categorie utilizzate',
};

export function currentReportPeriod(now = new Date()): MonthlyReportQuery {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);
  const value = (type: 'year' | 'month'): number =>
    Number(parts.find((part) => part.type === type)?.value);
  return { month: value('month'), year: value('year') };
}

export function reportPeriodFromParams(
  monthValue: string | null,
  yearValue: string | null,
  fallback: MonthlyReportQuery,
): MonthlyReportQuery {
  const month = Number(monthValue);
  const year = Number(yearValue);
  return Number.isInteger(month) && month >= 1 && month <= 12 &&
    Number.isInteger(year) && year >= 2000 && year <= 2100
    ? { month, year }
    : fallback;
}

export function comparisonDirectionLabel(direction: ComparisonDirection): string {
  if (direction === 'INCREASE') return 'Aumento';
  if (direction === 'DECREASE') return 'Diminuzione';
  if (direction === 'NOT_COMPARABLE') return 'Non confrontabile';
  return 'Invariato';
}

export function percentageLabel(value: number | null): string {
  return value === null
    ? 'non confrontabile'
    : `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 }).format(value)}%`;
}

export function comparisonMetricValue(metric: ComparisonMetric, value: string): string {
  return metric.valueKind === 'MONEY' ? formatEuroAmount(value) : value;
}

export function comparisonNarrative(comparison: MonthComparison): string[] {
  const completed = comparison.metrics.find((metric) => metric.metric === 'COMPLETED_TOTAL');
  if (!completed) return [];
  if (completed.direction === 'UNCHANGED') {
    return [`La spesa completata è invariata tra ${comparison.periodA.label} e ${comparison.periodB.label}.`];
  }
  if (completed.direction === 'NOT_COMPARABLE') {
    return [`Non è possibile calcolare la variazione percentuale perché ${comparison.periodA.label} non contiene spese completate.`];
  }
  const more = completed.direction === 'INCREASE' ? 'in più' : 'in meno';
  const result = [
    `A ${comparison.periodB.label.toLocaleLowerCase('it-IT')} hai registrato ${formatEuroAmount(String(Math.abs(Number(completed.absoluteChange))))} ${more} rispetto a ${comparison.periodA.label.toLocaleLowerCase('it-IT')}.`,
  ];
  const changed = comparison.categories
    .filter((item) => item.direction === 'INCREASE' || item.direction === 'DECREASE')
    .sort((a, b) => Math.abs(Number(b.absoluteChange)) - Math.abs(Number(a.absoluteChange)))[0];
  if (changed) {
    result.push(
      `La variazione assoluta maggiore riguarda ${changed.name}: ${formatEuroAmount(String(Math.abs(Number(changed.absoluteChange))))} ${changed.direction === 'INCREASE' ? 'in più' : 'in meno'}.`,
    );
  }
  return result;
}

export function filteredCategories(
  items: readonly CategoryComparisonItem[],
  direction: ComparisonDirection | 'ALL',
  sort: 'CHANGE' | 'PERIOD_A' | 'PERIOD_B' | 'NAME',
): CategoryComparisonItem[] {
  const filtered = direction === 'ALL' ? [...items] : items.filter((item) => item.direction === direction);
  return filtered.sort((a, b) => {
    if (sort === 'NAME') return a.name.localeCompare(b.name, 'it');
    if (sort === 'PERIOD_A') return Number(b.periodATotal) - Number(a.periodATotal);
    if (sort === 'PERIOD_B') return Number(b.periodBTotal) - Number(a.periodBTotal);
    return Math.abs(Number(b.absoluteChange)) - Math.abs(Number(a.absoluteChange));
  });
}

export function dailyComparisonValues(
  points: readonly DailyComparisonPoint[],
  period: 'A' | 'B',
): Array<number | null> {
  return points.map((point) => {
    const value = period === 'A' ? point.periodATotal : point.periodBTotal;
    return value === null ? null : Number(value);
  });
}

export function periodLabel(period: MonthlyReportQuery): string {
  return dashboardPeriodLabel(period.month, period.year);
}
