import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { PublicUser } from '../users/user.types';
import { DashboardService } from './dashboard.service';
import { DashboardListQueryDto } from './dto/dashboard-list-query.dto';
import { DashboardPeriodQueryDto } from './dto/dashboard-period-query.dto';
import { MonthlyTrendQueryDto } from './dto/monthly-trend-query.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Access token assente, scaduto o non valido' })
@ApiInternalServerErrorResponse({ description: 'Errore interno non previsto' })
@ApiBadRequestResponse({ description: 'Periodo, intervallo storico o limite non valido' })
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'KPI del mese; include solo COMPLETED e pianificate future separate' })
  @ApiOkResponse({ description: 'Totali Decimal serializzati come stringhe; media sui giorni trascorsi per il mese corrente' })
  summary(@CurrentUser() user: PublicUser, @Query() query: DashboardPeriodQueryDto) {
    return this.dashboard.summary(user.id, query);
  }

  @Get('daily-trend')
  @ApiOperation({ summary: 'Andamento giornaliero completo, inclusi i giorni a zero' })
  dailyTrend(@CurrentUser() user: PublicUser, @Query() query: DashboardPeriodQueryDto) {
    return this.dashboard.dailyTrend(user.id, query);
  }

  @Get('category-distribution')
  @ApiOperation({ summary: 'Distribuzione decrescente delle spese completate per categoria' })
  categoryDistribution(@CurrentUser() user: PublicUser, @Query() query: DashboardPeriodQueryDto) {
    return this.dashboard.categoryDistribution(user.id, query);
  }

  @Get('monthly-trend')
  @ApiOperation({ summary: 'Andamento da 1 a 24 mesi, concluso nel mese selezionato' })
  monthlyTrend(@CurrentUser() user: PublicUser, @Query() query: MonthlyTrendQueryDto) {
    return this.dashboard.monthlyTrend(user.id, query);
  }

  @Get('recent-expenses')
  @ApiOperation({ summary: 'Ultimi inserimenti ordinati per createdAt, massimo 20' })
  recentExpenses(@CurrentUser() user: PublicUser, @Query() query: DashboardListQueryDto) {
    return this.dashboard.recentExpenses(user.id, query);
  }

  @Get('upcoming-expenses')
  @ApiOperation({ summary: 'Spese PLANNED da oggi in avanti, massimo 20' })
  upcomingExpenses(@CurrentUser() user: PublicUser, @Query() query: DashboardListQueryDto) {
    return this.dashboard.upcomingExpenses(user.id, query);
  }
}
