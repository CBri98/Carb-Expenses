import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { PublicUser } from '../users/user.types';
import {
  CreateExpenseDto,
  DuplicateExpenseDto,
  ExpenseExportQueryDto,
  ExpenseQueryDto,
  UpdateExpenseDto,
  UpdateExpenseStatusDto,
} from './dto/expense.dto';
import { ExpensesService } from './expenses.service';

const EXPENSE_EXAMPLE = {
  id: '30000000-0000-4000-8000-000000000001',
  description: 'Spesa supermercato',
  amount: '86.45',
  expenseDate: '2026-07-14',
  expenseTime: '18:30',
  merchant: 'Supermercato',
  paymentMethod: 'DEBIT_CARD',
  notes: 'Spesa settimanale',
  status: 'COMPLETED',
  category: {
    id: '10000000-0000-4000-8000-000000000001',
    name: 'Spesa alimentare',
    color: '#16A34A',
    icon: 'bi-basket',
    isActive: true,
  },
  labels: [],
  createdAt: '2026-07-14T16:31:00.000Z',
  updatedAt: '2026-07-14T16:31:00.000Z',
};

const EXPENSE_ENVELOPE_EXAMPLE = {
  data: EXPENSE_EXAMPLE,
  meta: {},
  message: 'Operazione completata',
};

const PAGINATED_EXPENSE_EXAMPLE = {
  data: [EXPENSE_EXAMPLE],
  meta: { page: 1, pageSize: 20, totalItems: 43, totalPages: 3 },
  message: 'Operazione completata',
};

@ApiTags('Spese')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Access token assente, scaduto o non valido' })
@ApiInternalServerErrorResponse({ description: 'Errore interno non previsto' })
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  @ApiOperation({ summary: 'Elenca le spese con filtri e paginazione server-side' })
  @ApiOkResponse({
    description: 'Lista paginata delle sole spese appartenenti all’utente',
    schema: { example: PAGINATED_EXPENSE_EXAMPLE },
  })
  @ApiBadRequestResponse({ description: 'Filtri, date, importi o ordinamento non validi' })
  findAll(@CurrentUser() user: PublicUser, @Query() query: ExpenseQueryDto) {
    return this.expenses.findAll(user.id, query);
  }

  @Get('export')
  @ApiOperation({ summary: 'Esporta in CSV UTF-8 le spese filtrate' })
  @ApiProduces('text/csv')
  @ApiOkResponse({ description: 'CSV UTF-8 con BOM e separatore punto e virgola' })
  @ApiBadRequestResponse({ description: 'Filtri di esportazione non validi' })
  async export(
    @CurrentUser() user: PublicUser,
    @Query() query: ExpenseExportQueryDto,
    @Res() response: Response,
  ): Promise<void> {
    const csv = await this.expenses.exportCsv(user.id, query);
    response.setHeader('Content-Type', 'text/csv; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${csv.filename}"`);
    response.send(csv.content);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mostra il dettaglio di una spesa' })
  @ApiOkResponse({
    description: 'Dettaglio completo della spesa',
    schema: { example: EXPENSE_ENVELOPE_EXAMPLE },
  })
  @ApiNotFoundResponse({
    description: 'Spesa inesistente, eliminata o appartenente a un altro utente',
  })
  findOne(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.expenses.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Crea una spesa' })
  @ApiCreatedResponse({
    description: 'Spesa creata',
    schema: { example: EXPENSE_ENVELOPE_EXAMPLE },
  })
  @ApiBadRequestResponse({ description: 'DTO, categoria o etichette non validi' })
  @ApiConflictResponse({
    description: 'Conflitto di integrità durante una modifica concorrente del catalogo',
  })
  create(@CurrentUser() user: PublicUser, @Body() dto: CreateExpenseDto) {
    return this.expenses.create(user.id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Aggiorna rapidamente lo stato della spesa' })
  @ApiOkResponse({
    description: 'Stato aggiornato',
    schema: { example: EXPENSE_ENVELOPE_EXAMPLE },
  })
  @ApiBadRequestResponse({ description: 'Stato non valido' })
  @ApiNotFoundResponse({ description: 'Spesa non trovata' })
  setStatus(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateExpenseStatusDto,
  ) {
    return this.expenses.setStatus(user.id, id, dto.status);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplica una spesa, opzionalmente su una nuova data' })
  @ApiCreatedResponse({
    description: 'Nuova spesa duplicata',
    schema: { example: EXPENSE_ENVELOPE_EXAMPLE },
  })
  @ApiBadRequestResponse({ description: 'Nuova data non valida' })
  @ApiNotFoundResponse({ description: 'Spesa di origine non trovata' })
  duplicate(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: DuplicateExpenseDto,
  ) {
    return this.expenses.duplicate(user.id, id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifica una spesa e le relative etichette' })
  @ApiOkResponse({
    description: 'Spesa aggiornata',
    schema: { example: EXPENSE_ENVELOPE_EXAMPLE },
  })
  @ApiBadRequestResponse({ description: 'DTO, categoria o etichette non validi' })
  @ApiNotFoundResponse({ description: 'Spesa non trovata' })
  @ApiConflictResponse({
    description: 'Conflitto di integrità durante una modifica concorrente del catalogo',
  })
  update(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expenses.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Elimina logicamente una spesa' })
  @ApiOkResponse({
    description: 'Soft delete completato',
    schema: {
      example: { data: { deleted: true }, meta: {}, message: 'Operazione completata' },
    },
  })
  @ApiNotFoundResponse({ description: 'Spesa non trovata o già eliminata' })
  remove(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.expenses.remove(user.id, id);
  }
}
