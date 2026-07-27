import { Module } from '@nestjs/common';

import { RecurrenceCalculatorService } from './recurrence-calculator.service';
import { RecurrenceGeneratorService } from './recurrence-generator.service';
import { RecurrenceSchedulerService } from './recurrence-scheduler.service';
import { RecurrencesController } from './recurrences.controller';
import { RecurrencesService } from './recurrences.service';

@Module({
  controllers: [RecurrencesController],
  providers: [
    RecurrenceCalculatorService,
    RecurrenceGeneratorService,
    RecurrenceSchedulerService,
    RecurrencesService,
  ],
  exports: [
    RecurrenceCalculatorService,
    RecurrenceGeneratorService,
    RecurrenceSchedulerService,
    RecurrencesService,
  ],
})
export class RecurrencesModule {}
