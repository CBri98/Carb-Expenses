import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { PublicUser } from '../users/user.types';
import { DailyComparisonQueryDto, MonthComparisonQueryDto } from './dto/month-comparison-query.dto';
import { MonthlyExpensesQueryDto } from './dto/monthly-expenses-query.dto';
import { MonthlyReportQueryDto } from './dto/monthly-report-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('Report mensili')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Access token assente, scaduto o non valido' })
@ApiBadRequestResponse({ description: 'Periodo, filtri o paginazione non validi' })
@ApiInternalServerErrorResponse({ description: 'Errore interno non previsto' })
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('monthly')
  @ApiOperation({
    summary: 'Report completo di un mese',
    description: 'COMPLETED alimenta totali e medie; PLANNED resta separato; CANCELLED è solo conteggiato. Gli importi sono stringhe Decimal.',
  })
  @ApiOkResponse({ description: 'Metriche, massimi, categorie, giorni e metodi di pagamento' })
  monthly(@CurrentUser() user: PublicUser, @Query() query: MonthlyReportQueryDto) {
    return this.reports.monthly(user.id, query);
  }

  @Get('monthly/expenses')
  @ApiOperation({ summary: 'Elenco paginato e filtrabile delle spese del mese' })
  @ApiOkResponse({ description: 'Lista con paginazione server-side; soft deleted escluse' })
  monthlyExpenses(@CurrentUser() user: PublicUser, @Query() query: MonthlyExpensesQueryDto) {
    return this.reports.monthlyExpenses(user.id, query);
  }

  @Get('month-comparison')
  @ApiOperation({ summary: 'Confronto completo tra due mesi' })
  @ApiOkResponse({
    description: 'Otto metriche, categorie, giorni e metodi; percentuali nullable',
    schema: {
      example: {
        data: {
          periodA: { month: 6, year: 2026, label: 'Giugno 2026', daysInMonth: 30 },
          periodB: { month: 7, year: 2026, label: 'Luglio 2026', daysInMonth: 31 },
          samePeriod: false,
          metrics: [{
            metric: 'COMPLETED_TOTAL',
            valueKind: 'MONEY',
            periodAValue: '1160.00',
            periodBValue: '1284.50',
            absoluteChange: '124.50',
            percentageChange: 10.73,
            direction: 'INCREASE',
          }],
          categories: [],
          daily: [{ day: 31, periodATotal: null, periodBTotal: '24.00' }],
          paymentMethods: [],
        },
        meta: {},
        message: 'Operazione completata',
      },
    },
  })
  monthComparison(@CurrentUser() user: PublicUser, @Query() query: MonthComparisonQueryDto) {
    return this.reports.monthComparison(user.id, query);
  }

  @Get('category-comparison')
  @ApiOperation({ summary: 'Confronto dell’unione delle categorie di due mesi' })
  @ApiOkResponse({ description: 'Zero per la categoria assente in un periodo' })
  categoryComparison(@CurrentUser() user: PublicUser, @Query() query: MonthComparisonQueryDto) {
    return this.reports.categoryComparison(user.id, query);
  }

  @Get('daily-comparison')
  @ApiOperation({ summary: 'Confronto giornaliero CALENDAR_DAY' })
  @ApiOkResponse({ description: 'Giorni inesistenti rappresentati con null' })
  dailyComparison(@CurrentUser() user: PublicUser, @Query() query: DailyComparisonQueryDto) {
    return this.reports.dailyComparison(user.id, query);
  }
}
