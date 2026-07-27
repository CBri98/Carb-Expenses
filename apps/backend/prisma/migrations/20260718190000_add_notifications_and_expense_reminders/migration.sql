ALTER TABLE `expenses`
  ADD COLUMN `overdue_notified_for_date` DATE NULL;

CREATE INDEX `expenses_overdue_scheduler_idx`
  ON `expenses`(`status`, `expense_date`, `overdue_notified_for_date`, `deleted_at`);

CREATE TABLE `expense_reminders` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `expense_id` VARCHAR(36) NOT NULL,
  `type` ENUM(
    'SAME_DAY',
    'ONE_DAY_BEFORE',
    'THREE_DAYS_BEFORE',
    'SEVEN_DAYS_BEFORE',
    'CUSTOM'
  ) NOT NULL,
  `offset_minutes` INTEGER NULL,
  `scheduled_at` DATETIME(3) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `processed_at` DATETIME(3) NULL,
  `cancelled_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `expense_reminders_equivalent_key` (`expense_id`, `type`, `scheduled_at`),
  INDEX `expense_reminders_user_id_idx` (`user_id`),
  INDEX `expense_reminders_expense_id_idx` (`expense_id`),
  INDEX `expense_reminders_scheduler_idx` (`is_active`, `processed_at`, `scheduled_at`),
  CONSTRAINT `expense_reminders_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `expense_reminders_expense_id_fkey`
    FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `expense_id` VARCHAR(36) NULL,
  `reminder_id` VARCHAR(36) NULL,
  `type` ENUM(
    'EXPENSE_REMINDER',
    'EXPENSE_DUE_TODAY',
    'EXPENSE_OVERDUE'
  ) NOT NULL,
  `status` ENUM('UNREAD', 'READ', 'ARCHIVED') NOT NULL DEFAULT 'UNREAD',
  `title` VARCHAR(150) NOT NULL,
  `message` VARCHAR(500) NOT NULL,
  `scheduled_at` DATETIME(3) NOT NULL,
  `deduplication_key` VARCHAR(255) NOT NULL,
  `read_at` DATETIME(3) NULL,
  `archived_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `notifications_deduplication_key` (`deduplication_key`),
  INDEX `notifications_user_status_created_idx` (`user_id`, `status`, `created_at`),
  INDEX `notifications_user_created_idx` (`user_id`, `created_at`),
  INDEX `notifications_expense_id_idx` (`expense_id`),
  INDEX `notifications_reminder_id_idx` (`reminder_id`),
  CONSTRAINT `notifications_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `notifications_expense_id_fkey`
    FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `notifications_reminder_id_fkey`
    FOREIGN KEY (`reminder_id`) REFERENCES `expense_reminders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
