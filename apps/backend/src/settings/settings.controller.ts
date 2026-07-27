import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { AuthCookieService } from '../auth/auth-cookie.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { PublicUser } from '../users/user.types';
import {
  ChangePasswordDto,
  UpdateAccountDto,
  UpdateAppearancePreferencesDto,
  UpdateExperiencePreferencesDto,
  UpdateIconPreferencesDto,
  UpdateNotificationPreferencesDto,
} from './dto/settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('Impostazioni')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Access token assente, scaduto o non valido' })
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly authCookie: AuthCookieService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Restituisce account e preferenze dell’utente autenticato' })
  @ApiOkResponse({ description: 'Preferenze complete con valori predefiniti applicati' })
  get(@CurrentUser() user: PublicUser) {
    return this.settings.get(user.id);
  }

  @Patch('account')
  @ApiOperation({ summary: 'Aggiorna nome, cognome o email dell’account' })
  @ApiOkResponse({ description: 'Impostazioni aggiornate' })
  @ApiConflictResponse({ description: 'Email non disponibile' })
  updateAccount(
    @CurrentUser() user: PublicUser,
    @Body() dto: UpdateAccountDto,
    @Req() request: Request,
  ) {
    return this.settings.updateAccount(user.id, dto, this.authCookie.read(request));
  }

  @Patch('account/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambia password e revoca tutte le sessioni' })
  @ApiOkResponse({ description: 'Password aggiornata; è richiesto un nuovo accesso' })
  async changePassword(
    @CurrentUser() user: PublicUser,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.settings.changePassword(user.id, dto);
    this.authCookie.clear(response);
    return result;
  }

  @Post('account/revoke-other-sessions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoca le altre sessioni mantenendo quella corrente quando disponibile' })
  @ApiOkResponse({ description: 'Numero di sessioni revocate' })
  revokeOtherSessions(
    @CurrentUser() user: PublicUser,
    @Req() request: Request,
  ) {
    return this.settings.revokeOtherSessions(user.id, this.authCookie.read(request));
  }

  @Patch('appearance')
  @ApiOperation({ summary: 'Aggiorna tema e colore principale controllato' })
  updateAppearance(
    @CurrentUser() user: PublicUser,
    @Body() dto: UpdateAppearancePreferencesDto,
  ) {
    return this.settings.updateAppearance(user.id, dto);
  }

  @Patch('experience')
  @ApiOperation({ summary: 'Aggiorna preferenze di navigazione e form' })
  updateExperience(
    @CurrentUser() user: PublicUser,
    @Body() dto: UpdateExperiencePreferencesDto,
  ) {
    return this.settings.updateExperience(user.id, dto);
  }

  @Patch('icons')
  @ApiOperation({ summary: 'Aggiorna le icone disponibili nei selettori' })
  updateIcons(
    @CurrentUser() user: PublicUser,
    @Body() dto: UpdateIconPreferencesDto,
  ) {
    return this.settings.updateIcons(user.id, dto);
  }

  @Patch('notifications')
  @ApiOperation({ summary: 'Aggiorna i valori predefiniti dei promemoria' })
  updateNotifications(
    @CurrentUser() user: PublicUser,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.settings.updateNotifications(user.id, dto);
  }

  @Post('preferences/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ripristina esclusivamente le preferenze iniziali' })
  reset(@CurrentUser() user: PublicUser) {
    return this.settings.reset(user.id);
  }
}
