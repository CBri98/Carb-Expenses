import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { PublicUser } from '../users/user.types';
import {
  CreateExpenseReminderDto,
  UpdateExpenseReminderDto,
} from './dto/notification.dto';
import { NotificationRemindersService } from './notification-reminders.service';

@ApiTags('Promemoria spese')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Access token assente, scaduto o non valido' })
@UseGuards(JwtAuthGuard)
@Controller('expenses/:expenseId/reminders')
export class ExpenseRemindersController {
  constructor(private readonly reminders: NotificationRemindersService) {}

  @Get()
  @ApiOperation({ summary: 'Elenca i promemoria della spesa dell’utente' })
  @ApiOkResponse({ description: 'Include attivi, disattivati e processati' })
  @ApiNotFoundResponse({ description: 'Spesa inesistente o appartenente a un altro utente' })
  list(
    @CurrentUser() user: PublicUser,
    @Param('expenseId', new ParseUUIDPipe()) expenseId: string,
  ) {
    return this.reminders.list(user.id, expenseId);
  }

  @Post()
  @ApiOperation({
    summary: 'Crea un promemoria preset o personalizzato',
    description:
      'I preset sono calcolati in Europe/Rome (o nel fuso utente) e la chiave univoca impedisce duplicati equivalenti.',
  })
  @ApiCreatedResponse({ description: 'Promemoria creato' })
  @ApiBadRequestResponse({ description: 'Stato spesa o data promemoria non validi' })
  @ApiNotFoundResponse({ description: 'Spesa non trovata' })
  @ApiConflictResponse({ description: 'Promemoria equivalente già presente' })
  create(
    @CurrentUser() user: PublicUser,
    @Param('expenseId', new ParseUUIDPipe()) expenseId: string,
    @Body() dto: CreateExpenseReminderDto,
  ) {
    return this.reminders.create(user.id, expenseId, dto);
  }

  @Patch(':reminderId')
  @ApiOperation({ summary: 'Modifica tipo, data personalizzata o attivazione del promemoria' })
  @ApiOkResponse({ description: 'Promemoria aggiornato' })
  @ApiBadRequestResponse({ description: 'Modifica non valida rispetto alla scadenza' })
  @ApiNotFoundResponse({ description: 'Spesa o promemoria non trovati' })
  @ApiConflictResponse({ description: 'Promemoria processato o equivalente già presente' })
  update(
    @CurrentUser() user: PublicUser,
    @Param('expenseId', new ParseUUIDPipe()) expenseId: string,
    @Param('reminderId', new ParseUUIDPipe()) reminderId: string,
    @Body() dto: UpdateExpenseReminderDto,
  ) {
    return this.reminders.update(user.id, expenseId, reminderId, dto);
  }

  @Delete(':reminderId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disattiva il promemoria mantenendone lo storico' })
  @ApiNoContentResponse({ description: 'Promemoria disattivato' })
  @ApiNotFoundResponse({ description: 'Spesa o promemoria non trovati' })
  async remove(
    @CurrentUser() user: PublicUser,
    @Param('expenseId', new ParseUUIDPipe()) expenseId: string,
    @Param('reminderId', new ParseUUIDPipe()) reminderId: string,
  ): Promise<void> {
    await this.reminders.remove(user.id, expenseId, reminderId);
  }
}
