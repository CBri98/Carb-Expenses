import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiEnvelope } from '../auth/auth.models';
import type { ExpenseListItem, PaginationMeta } from '../../shared/models/expense.models';
import type {
  CategoryComparisonItem,
  DailyComparisonPoint,
  MonthComparison,
  MonthComparisonQuery,
  MonthlyExpenseResult,
  MonthlyExpensesQuery,
  MonthlyReport,
  MonthlyReportQuery,
} from '../../shared/models/report.models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/reports`;

  monthly(query: MonthlyReportQuery): Observable<MonthlyReport> {
    return this.get<MonthlyReport>('monthly', query);
  }

  monthlyExpenses(query: MonthlyExpensesQuery): Observable<MonthlyExpenseResult> {
    return this.http
      .get<ApiEnvelope<ExpenseListItem[]>>(`${this.baseUrl}/monthly/expenses`, {
        params: reportParams(query),
      })
      .pipe(map((response) => ({ items: response.data, meta: paginationMeta(response.meta) })));
  }

  monthComparison(query: MonthComparisonQuery): Observable<MonthComparison> {
    return this.get<MonthComparison>('month-comparison', query);
  }

  categoryComparison(query: MonthComparisonQuery): Observable<CategoryComparisonItem[]> {
    return this.get<CategoryComparisonItem[]>('category-comparison', query);
  }

  dailyComparison(query: MonthComparisonQuery): Observable<DailyComparisonPoint[]> {
    return this.get<DailyComparisonPoint[]>('daily-comparison', {
      ...query,
      mode: 'CALENDAR_DAY',
    });
  }

  private get<T>(
    endpoint: string,
    query: Record<string, string | number> | MonthlyReportQuery | MonthComparisonQuery,
  ): Observable<T> {
    return this.http
      .get<ApiEnvelope<T>>(`${this.baseUrl}/${endpoint}`, { params: reportParams(query) })
      .pipe(map((response) => response.data));
  }
}

function reportParams(query: object): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) continue;
    params = params.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  return params;
}

function paginationMeta(meta: Record<string, unknown>): PaginationMeta {
  return {
    page: numeric(meta['page'], 1),
    pageSize: numeric(meta['pageSize'], 20),
    totalItems: numeric(meta['totalItems'], 0),
    totalPages: numeric(meta['totalPages'], 0),
  };
}

function numeric(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
