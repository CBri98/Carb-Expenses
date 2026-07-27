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
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { PublicUser } from '../users/user.types';
import {
  CreateLabelDto,
  LabelQueryDto,
  ReorderLabelsDto,
  UpdateLabelDto,
  UpdateLabelStatusDto,
} from './dto/label.dto';
import { LabelsService } from './labels.service';

@ApiTags('Etichette')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('labels')
export class LabelsController {
  constructor(private readonly labels: LabelsService) {}

  @Get()
  @ApiOperation({ summary: 'Elenca le etichette dell’utente' })
  @ApiOkResponse({ description: 'Etichette filtrate e ordinate' })
  findAll(@CurrentUser() user: PublicUser, @Query() query: LabelQueryDto) {
    return this.labels.findAll(user.id, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Restituisce i contatori delle etichette filtrate' })
  summary(@CurrentUser() user: PublicUser, @Query() query: LabelQueryDto) {
    return this.labels.summary(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mostra il dettaglio di un’etichetta' })
  findOne(@CurrentUser() user: PublicUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.labels.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Crea un’etichetta personale' })
  @ApiCreatedResponse({ description: 'Etichetta creata' })
  create(@CurrentUser() user: PublicUser, @Body() dto: CreateLabelDto) {
    return this.labels.create(user.id, dto);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Riordina in blocco le etichette' })
  reorder(@CurrentUser() user: PublicUser, @Body() dto: ReorderLabelsDto) {
    return this.labels.reorder(user.id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Attiva o disattiva un’etichetta' })
  setStatus(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateLabelStatusDto,
  ) {
    return this.labels.setStatus(user.id, id, dto.isActive);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifica un’etichetta personale' })
  update(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateLabelDto,
  ) {
    return this.labels.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Elimina logicamente un’etichetta' })
  remove(@CurrentUser() user: PublicUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.labels.remove(user.id, id);
  }
}
