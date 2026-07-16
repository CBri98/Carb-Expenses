import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiEnvelope } from '../auth/auth.models';
import type {
  CategoryDistributionItem,
  DailyTrendPoint,
  DashboardData,
  DashboardPeriodQuery,
  DashboardSummary,
  MonthlyTrendPoint,
  RecentExpense,
  UpcomingExpense,
} from '../../shared/models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/dashboard`;

  summary(query: DashboardPeriodQuery): Observable<DashboardSummary> {
    return this.get<DashboardSummary>('summary', query);
  }
  dailyTrend(query: DashboardPeriodQuery): Observable<DailyTrendPoint[]> {
    return this.get<DailyTrendPoint[]>('daily-trend', query);
  }
  categoryDistribution(query: DashboardPeriodQuery): Observable<CategoryDistributionItem[]> {
    return this.get<CategoryDistributionItem[]>('category-distribution', query);
  }
  monthlyTrend(query: DashboardPeriodQuery, months: number): Observable<MonthlyTrendPoint[]> {
    return this.get<MonthlyTrendPoint[]>('monthly-trend', { ...query, months });
  }
  recentExpenses(limit = 5): Observable<RecentExpense[]> {
    return this.get<RecentExpense[]>('recent-expenses', { limit });
  }
  upcomingExpenses(limit = 5): Observable<UpcomingExpense[]> {
    return this.get<UpcomingExpense[]>('upcoming-expenses', { limit });
  }
  load(query: DashboardPeriodQuery, trendYear: number): Observable<DashboardData> {
    return forkJoin({
      summary: this.summary(query),
      dailyTrend: this.dailyTrend(query),
      categoryDistribution: this.categoryDistribution(query),
      monthlyTrend: this.monthlyTrend({ month: 12, year: trendYear }, 12),
      recentExpenses: this.recentExpenses(),
      upcomingExpenses: this.upcomingExpenses(),
    });
  }

  private get<T>(endpoint: string, query: { month?: number; year?: number; months?: number; limit?: number }): Observable<T> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) params = params.set(key, value);
    return this.http
      .get<ApiEnvelope<T>>(`${this.baseUrl}/${endpoint}`, { params })
      .pipe(map((response) => response.data));
  }
}
