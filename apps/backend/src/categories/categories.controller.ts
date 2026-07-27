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
import { CategoriesService } from './categories.service';
import {
  CategoryQueryDto,
  CreateCategoryDto,
  ReorderCategoriesDto,
  UpdateCategoryDto,
  UpdateCategoryStatusDto,
} from './dto/category.dto';

@ApiTags('Categorie')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Elenca categorie globali e personali visibili' })
  @ApiOkResponse({ description: 'Categorie con preferenze effettive dell’utente' })
  findAll(@CurrentUser() user: PublicUser, @Query() query: CategoryQueryDto) {
    return this.categories.findAll(user.id, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Restituisce i contatori delle categorie filtrate' })
  summary(@CurrentUser() user: PublicUser, @Query() query: CategoryQueryDto) {
    return this.categories.summary(user.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Crea una categoria personale' })
  @ApiCreatedResponse({ description: 'Categoria creata' })
  create(@CurrentUser() user: PublicUser, @Body() dto: CreateCategoryDto) {
    return this.categories.create(user.id, dto);
  }

  @Patch('reorder')
  @ApiOperation({ summary: 'Riordina in blocco le categorie visibili' })
  reorder(@CurrentUser() user: PublicUser, @Body() dto: ReorderCategoriesDto) {
    return this.categories.reorder(user.id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Attiva o disattiva una categoria per l’utente' })
  setStatus(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCategoryStatusDto,
  ) {
    return this.categories.setStatus(user.id, id, dto.isActive);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifica una categoria personale' })
  update(
    @CurrentUser() user: PublicUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categories.update(user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Elimina logicamente una categoria personale non usata' })
  remove(@CurrentUser() user: PublicUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.categories.remove(user.id, id);
  }
}
