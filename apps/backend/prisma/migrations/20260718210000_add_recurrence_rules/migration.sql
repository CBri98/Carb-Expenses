CREATE TABLE `recurrence_rules` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `category_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` VARCHAR(150) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `merchant` VARCHAR(150) NULL,
  `payment_method` ENUM(
    'CASH',
    'DEBIT_CARD',
    'CREDIT_CARD',
    'BANK_TRANSFER',
    'DIRECT_DEBIT',
    'DIGITAL_WALLET',
    'CHECK',
    'OTHER'
  ) NOT NULL DEFAULT 'OTHER',
  `notes` TEXT NULL,
  `frequency` ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY') NOT NULL,
  `interval` INTEGER NOT NULL DEFAULT 1,
  `status` ENUM('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `start_date` DATE NOT NULL,
  `end_date` DATE NULL,
  `next_occurrence_date` DATE NULL,
  `last_generated_date` DATE NULL,
  `max_occurrences` INTEGER NULL,
  `generated_count` INTEGER NOT NULL DEFAULT 0,
  `expense_time` TIME(0) NULL,
  `generate_days_ahead` INTEGER NOT NULL DEFAULT 30,
  `paused_at` DATETIME(3) NULL,
  `completed_at` DATETIME(3) NULL,
  `cancelled_at` DATETIME(3) NULL,
  `generation_version` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `recurrence_rules_user_status_deleted_idx` (`user_id`, `status`, `deleted_at`),
  INDEX `recurrence_rules_scheduler_idx` (`status`, `next_occurrence_date`, `deleted_at`),
  INDEX `recurrence_rules_user_category_idx` (`user_id`, `category_id`),
  CONSTRAINT `recurrence_rules_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `recurrence_rules_category_id_fkey`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `recurrence_rule_labels` (
  `recurrence_rule_id` VARCHAR(36) NOT NULL,
  `label_id` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`recurrence_rule_id`, `label_id`),
  INDEX `recurrence_rule_labels_label_id_idx` (`label_id`),
  CONSTRAINT `recurrence_rule_labels_recurrence_rule_id_fkey`
    FOREIGN KEY (`recurrence_rule_id`) REFERENCES `recurrence_rules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `recurrence_rule_labels_label_id_fkey`
    FOREIGN KEY (`label_id`) REFERENCES `labels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `recurrence_reminder_templates` (
  `id` VARCHAR(36) NOT NULL,
  `recurrence_rule_id` VARCHAR(36) NOT NULL,
  `type` ENUM(
    'SAME_DAY',
    'ONE_DAY_BEFORE',
    'THREE_DAYS_BEFORE',
    'SEVEN_DAYS_BEFORE',
    'CUSTOM'
  ) NOT NULL,
  `offset_minutes` INTEGER NOT NULL,
  `reminder_time` TIME(0) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `recurrence_reminder_templates_rule_type_key` (`recurrence_rule_id`, `type`),
  INDEX `recurrence_reminder_templates_rule_id_idx` (`recurrence_rule_id`),
  CONSTRAINT `recurrence_reminder_templates_recurrence_rule_id_fkey`
    FOREIGN KEY (`recurrence_rule_id`) REFERENCES `recurrence_rules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `recurrence_exceptions` (
  `id` VARCHAR(36) NOT NULL,
  `recurrence_rule_id` VARCHAR(36) NOT NULL,
  `occurrence_date` DATE NOT NULL,
  `reason` VARCHAR(255) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `recurrence_exceptions_rule_date_key` (`recurrence_rule_id`, `occurrence_date`),
  INDEX `recurrence_exceptions_rule_id_idx` (`recurrence_rule_id`),
  CONSTRAINT `recurrence_exceptions_recurrence_rule_id_fkey`
    FOREIGN KEY (`recurrence_rule_id`) REFERENCES `recurrence_rules` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `expenses`
  ADD COLUMN `recurrence_rule_id` VARCHAR(36) NULL,
  ADD COLUMN `occurrence_date` DATE NULL,
  ADD COLUMN `generated_by_recurrence` BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX `expenses_recurrence_occurrence_key`
  ON `expenses`(`recurrence_rule_id`, `occurrence_date`);

CREATE INDEX `expenses_recurrence_date_status_idx`
  ON `expenses`(`recurrence_rule_id`, `expense_date`, `status`, `deleted_at`);

ALTER TABLE `expenses`
  ADD CONSTRAINT `expenses_recurrence_rule_id_fkey`
  FOREIGN KEY (`recurrence_rule_id`) REFERENCES `recurrence_rules` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
