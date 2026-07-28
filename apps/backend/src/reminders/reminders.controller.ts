import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
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
  ReminderBulkActionDto,
  ReminderQueryDto,
  ReminderSummaryQueryDto,
  UpdateGlobalReminderDto,
} from './dto/reminder.dto';
import { RemindersService } from './reminders.service';

@ApiTags('Promemoria')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Access token assente, scaduto o non valido' })
@UseGuards(JwtAuthGuard)
@Controller('reminders')
export class RemindersController {
  constructor(private readonly reminders: RemindersService) {}

  @Get()
  @ApiOperation({ summary: 'Elenca tutti i promemoria dell’utente con filtri e paginazione' })
  @ApiOkResponse({ description: 'Lista globale con spesa, origine, stato e azioni consentite' })
  findAll(@CurrentUser() user: PublicUser, @Query() query: ReminderQueryDto) {
    return this.reminders.findAll(user.id, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Restituisce i conteggi globali e il prossimo promemoria' })
  summary(@CurrentUser() user: PublicUser, @Query() query: ReminderSummaryQueryDto) {
    return this.reminders.summary(user.id, query.upcomingDays);
  }

  @Patch('bulk/cancel')
  @ApiOperation({ summary: 'Annulla fino a 100 promemoria con risultato parziale' })
  bulkCancel(@CurrentUser() user: PublicUser, @Body() dto: ReminderBulkActionDto) {
    return this.reminders.bulk(user.id, dto.ids, 'cancel');
  }

  @Patch('bulk/reactivate')
  @ApiOperation({ summary: 'Riattiva fino a 100 promemoria validi' })
  bulkReactivate(@CurrentUser() user: PublicUser, @Body() dto: ReminderBulkActionDto) {
    return this.reminders.bulk(user.id, dto.ids, 'reactivate');
  }

  @Delete('bulk')
  @ApiOperation({ summary: 'Elimina fino a 100 promemoria eliminabili' })
  bulkDelete(@CurrentUser() user: PublicUser, @Body() dto: ReminderBulkActionDto) {
    return this.reminders.bulk(user.id, dto.ids, 'delete');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mostra il dettaglio completo di un promemoria' })
  @ApiNotFoundResponse({ description: 'Promemoria inesistente o appartenente a un altro utente' })
  findOne(@CurrentUser() user: PublicUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.reminders.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifica tipo o data di un promemoria non processato' })
  @ApiBadRequestResponse({ description: 'Payload o data non validi' })
  @ApiConflictResponse({ description: 'Promemoria non modificabile o duplicato' })
  update(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateGlobalReminderDto,
  ) {
    return this.reminders.update(user.id, id, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Annulla in modo idempotente un promemoria' })
  cancel(@CurrentUser() user: PublicUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.reminders.cancel(user.id, id);
  }

  @Patch(':id/reactivate')
  @ApiOperation({ summary: 'Riattiva un promemoria futuro ancora valido' })
  @ApiConflictResponse({ description: 'Data trascorsa, spesa non valida o duplicato' })
  reactivate(@CurrentUser() user: PublicUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.reminders.reactivate(user.id, id);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Elimina fisicamente un promemoria senza storico' })
  @ApiConflictResponse({ description: 'Promemoria storico, notificato o gestito da ricorrenza' })
  remove(@CurrentUser() user: PublicUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.reminders.remove(user.id, id);
  }
}
