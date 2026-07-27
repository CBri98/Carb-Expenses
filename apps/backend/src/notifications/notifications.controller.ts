import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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
import { NotificationQueryDto } from './dto/notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifiche')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Access token assente, scaduto o non valido' })
@ApiInternalServerErrorResponse({ description: 'Errore interno non previsto' })
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Elenca le notifiche con filtri e paginazione server-side' })
  @ApiOkResponse({ description: 'Le archiviate sono escluse se status non è specificato' })
  @ApiBadRequestResponse({ description: 'Query parameter non validi' })
  findAll(@CurrentUser() user: PublicUser, @Query() query: NotificationQueryDto) {
    return this.notifications.findAll(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Conta le notifiche non lette dell’utente' })
  @ApiOkResponse({ schema: { example: { data: { count: 4 }, meta: {}, message: 'Operazione completata' } } })
  unreadCount(@CurrentUser() user: PublicUser) {
    return this.notifications.unreadCount(user.id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Segna come lette tutte le notifiche non archiviate' })
  @ApiOkResponse({ schema: { example: { data: { updatedCount: 4 }, meta: {}, message: 'Operazione completata' } } })
  markAllRead(@CurrentUser() user: PublicUser) {
    return this.notifications.markAllRead(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mostra il dettaglio di una notifica' })
  @ApiOkResponse({ description: 'Notifica con eventuale spesa e promemoria collegati' })
  @ApiNotFoundResponse({ description: 'Notifica inesistente o appartenente a un altro utente' })
  findOne(@CurrentUser() user: PublicUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.notifications.findOne(user.id, id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Segna una notifica come letta in modo idempotente' })
  @ApiOkResponse({ description: 'Notifica aggiornata' })
  @ApiNotFoundResponse({ description: 'Notifica non trovata' })
  markRead(@CurrentUser() user: PublicUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.notifications.markRead(user.id, id);
  }

  @Patch(':id/unread')
  @ApiOperation({ summary: 'Riporta una notifica allo stato non letto' })
  @ApiOkResponse({ description: 'Notifica aggiornata' })
  @ApiNotFoundResponse({ description: 'Notifica non trovata' })
  markUnread(@CurrentUser() user: PublicUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.notifications.markUnread(user.id, id);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archivia una notifica senza eliminarla fisicamente' })
  @ApiOkResponse({ description: 'Notifica archiviata' })
  @ApiNotFoundResponse({ description: 'Notifica non trovata' })
  archive(@CurrentUser() user: PublicUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.notifications.archive(user.id, id);
  }

  @Patch(':id/unarchive')
  @ApiOperation({ summary: 'Disarchivia una notifica impostandola come letta' })
  @ApiOkResponse({ description: 'Notifica disarchiviata; operazione idempotente' })
  @ApiNotFoundResponse({ description: 'Notifica non trovata o appartenente a un altro utente' })
  unarchive(@CurrentUser() user: PublicUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.notifications.unarchive(user.id, id);
  }
}
