import { Module } from '@nestjs/common';

import { ExpenseRemindersController } from './expense-reminders.controller';
import { NotificationRemindersService } from './notification-reminders.service';
import { NotificationSchedulerService } from './notification-scheduler.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController, ExpenseRemindersController],
  providers: [
    NotificationsService,
    NotificationRemindersService,
    NotificationSchedulerService,
  ],
  exports: [NotificationRemindersService, NotificationSchedulerService],
})
export class NotificationsModule {}
