import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { LabelsController } from './labels.controller';
import { LabelsService } from './labels.service';

@Module({
  imports: [CategoriesModule],
  controllers: [LabelsController],
  providers: [LabelsService]
})
export class LabelsModule {}
