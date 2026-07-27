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
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { PublicUser } from '../users/user.types';
import {
  CancelRecurrenceDto,
  CreateRecurrenceDto,
  CreateRecurrenceExceptionDto,
  PauseRecurrenceDto,
  RecurrenceExpensesQueryDto,
  RecurrencePreviewDto,
  RecurrenceQueryDto,
  SavedRecurrencePreviewQueryDto,
  UpdateRecurrenceDto,
} from './dto/recurrence.dto';
import { RecurrencesService } from './recurrences.service';

@ApiTags('Ricorrenze')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Access token assente, scaduto o non valido' })
@ApiInternalServerErrorResponse({ description: 'Errore interno non previsto' })
@UseGuards(JwtAuthGuard)
@Controller('recurrences')
export class RecurrencesController {
  constructor(private readonly recurrences: RecurrencesService) {}

  @Get()
  @ApiOperation({ summary: 'Elenca le ricorrenze con filtri e paginazione server-side' })
  @ApiOkResponse({ description: 'Lista delle sole ricorrenze appartenenti all’utente' })
  findAll(@CurrentUser() user: PublicUser, @Query() query: RecurrenceQueryDto) {
    return this.recurrences.findAll(user.id, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Restituisce il riepilogo leggero delle ricorrenze' })
  @ApiOkResponse({ description: 'Conteggi e totale delle occorrenze generate nei prossimi 30 giorni' })
  summary(@CurrentUser() user: PublicUser) {
    return this.recurrences.summary(user.id);
  }

  @Post('preview')
  @ApiOperation({
    summary: 'Calcola un’anteprima senza salvare',
    description:
      'Il giorno 31 usa l’ultimo giorno disponibile; il 29 febbraio usa il 28 negli anni non bisestili.',
  })
  @ApiOkResponse({ description: 'Da 1 a 50 date calcolate con lo stesso algoritmo dello scheduler' })
  @ApiBadRequestResponse({ description: 'Frequenza, intervallo o date non validi' })
  preview(@Body() dto: RecurrencePreviewDto) {
    return this.recurrences.preview(dto);
  }

  @Post()
  @ApiOperation({
    summary: 'Crea una ricorrenza e genera le occorrenze nel suo orizzonte',
    description:
      'Le occorrenze sono normali spese PLANNED, protette da vincolo univoco regola/data.',
  })
  @ApiCreatedResponse({ description: 'Ricorrenza creata' })
  @ApiBadRequestResponse({ description: 'DTO, categoria, etichette o promemoria non validi' })
  @ApiConflictResponse({ description: 'Conflitto di integrità concorrente' })
  create(@CurrentUser() user: PublicUser, @Body() dto: CreateRecurrenceDto) {
    return this.recurrences.create(user.id, dto);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Mostra le prossime date di una ricorrenza salvata' })
  @ApiOkResponse({ description: 'Anteprima senza creazione di spese' })
  @ApiNotFoundResponse({ description: 'Ricorrenza inesistente, eliminata o altrui' })
  previewSaved(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: SavedRecurrencePreviewQueryDto,
  ) {
    return this.recurrences.previewSaved(user.id, id, query.limit);
  }

  @Get(':id/expenses')
  @ApiOperation({ summary: 'Elenca le normali spese generate dalla ricorrenza' })
  @ApiOkResponse({ description: 'Spese paginate mappate tramite il mapper del CRUD spese' })
  @ApiBadRequestResponse({ description: 'Filtri data o paginazione non validi' })
  @ApiNotFoundResponse({ description: 'Ricorrenza inesistente, eliminata o altrui' })
  expenses(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: RecurrenceExpensesQueryDto,
  ) {
    return this.recurrences.expenses(user.id, id, query);
  }

  @Post(':id/exceptions')
  @ApiOperation({ summary: 'Salta definitivamente una futura occorrenza' })
  @ApiCreatedResponse({ description: 'Eccezione registrata; la data non verrà generata' })
  @ApiBadRequestResponse({ description: 'La data non appartiene alla serie' })
  @ApiConflictResponse({ description: 'Occorrenza già elaborata, generata o esclusa' })
  skip(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateRecurrenceExceptionDto,
  ) {
    return this.recurrences.skipOccurrence(user.id, id, dto);
  }

  @Patch(':id/pause')
  @ApiOperation({ summary: 'Sospende una ricorrenza attiva' })
  @ApiOkResponse({ description: 'Ricorrenza sospesa senza eliminare le spese generate' })
  @ApiConflictResponse({ description: 'La ricorrenza non è attiva' })
  pause(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: PauseRecurrenceDto,
  ) {
    return this.recurrences.pause(user.id, id, dto);
  }

  @Patch(':id/resume')
  @ApiOperation({
    summary: 'Riattiva senza arretrati',
    description: 'Riparte dalla prima data valida non precedente a oggi.',
  })
  @ApiOkResponse({ description: 'Ricorrenza riattivata o completata se non ha più date valide' })
  @ApiConflictResponse({ description: 'La ricorrenza non è in pausa' })
  resume(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.recurrences.resume(user.id, id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Termina definitivamente una ricorrenza' })
  @ApiOkResponse({
    description:
      'Le spese restano; opzionalmente le future PLANNED vengono impostate CANCELLED',
  })
  @ApiConflictResponse({ description: 'La ricorrenza è già conclusa' })
  cancel(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CancelRecurrenceDto,
  ) {
    return this.recurrences.cancel(user.id, id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mostra dettaglio, template, eccezioni e anteprima' })
  @ApiOkResponse({ description: 'Dettaglio completo della ricorrenza' })
  @ApiNotFoundResponse({ description: 'Ricorrenza inesistente, eliminata o altrui' })
  findOne(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.recurrences.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Modifica una regola',
    description:
      'RULE_ONLY modifica solo la regola; RULE_AND_FUTURE_PLANNED_EXPENSES aggiorna anche le future pianificate, mai completate o annullate.',
  })
  @ApiOkResponse({ description: 'Ricorrenza aggiornata' })
  @ApiBadRequestResponse({ description: 'DTO o date non validi' })
  @ApiConflictResponse({ description: 'Data iniziale bloccata dopo la prima generazione' })
  update(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRecurrenceDto,
  ) {
    return this.recurrences.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Elimina logicamente una regola mai utilizzata' })
  @ApiOkResponse({ description: 'Soft delete completato' })
  @ApiConflictResponse({ description: 'Le regole con spese devono essere terminate' })
  remove(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.recurrences.remove(user.id, id);
  }
}
