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
import { CalendarService } from './calendar.service';
import { CalendarExpensesQueryDto } from './dto/calendar-expenses-query.dto';

@ApiTags('Calendario')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Access token assente, scaduto o non valido' })
@ApiBadRequestResponse({
  description: 'Date non valide, end non successiva a start o intervallo superiore a 366 giorni',
})
@ApiInternalServerErrorResponse({ description: 'Errore interno non previsto' })
@UseGuards(JwtAuthGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendar: CalendarService) {}

  @Get('expenses')
  @ApiOperation({
    summary: 'Spese nell’intervallo visibile del calendario',
    description:
      'start è inclusivo, end è esclusivo. Default: PLANNED e COMPLETED. Ownership e soft delete sono applicati server-side.',
  })
  @ApiOkResponse({
    description: 'Eventi ordinati per data, ora e creazione; importi Decimal come stringhe',
    schema: {
      example: {
        data: [{
          id: 'expense-uuid',
          expenseId: 'expense-uuid',
          title: 'Assicurazione auto',
          amount: '320.00',
          expenseDate: '2026-07-20',
          expenseTime: null,
          allDay: true,
          status: 'PLANNED',
          isOverdue: false,
          merchant: 'Compagnia assicurativa',
          category: {
            id: 'category-uuid',
            name: 'Auto',
            color: '#9BAFD6',
            icon: 'bi-car-front',
          },
          labels: [],
          paymentMethod: 'DIRECT_DEBIT',
        }],
        meta: {},
        message: 'Operazione completata',
      },
    },
  })
  expenses(@CurrentUser() user: PublicUser, @Query() query: CalendarExpensesQueryDto) {
    return this.calendar.expenses(user.id, query);
  }
}
