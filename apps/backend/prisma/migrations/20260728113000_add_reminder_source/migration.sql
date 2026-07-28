ALTER TABLE `expense_reminders`
  ADD COLUMN `source` ENUM('MANUAL', 'RECURRENCE', 'SYSTEM') NOT NULL DEFAULT 'MANUAL';

CREATE INDEX `expense_reminders_user_scheduled_idx`
  ON `expense_reminders`(`user_id`, `scheduled_at`);

CREATE INDEX `expense_reminders_user_source_idx`
  ON `expense_reminders`(`user_id`, `source`);
