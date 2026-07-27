CREATE TABLE `user_preferences` (
  `user_id` VARCHAR(36) NOT NULL,
  `theme_mode` ENUM('LIGHT', 'DARK', 'SYSTEM') NOT NULL DEFAULT 'SYSTEM',
  `accent_color` ENUM('INDIGO', 'LAVENDER', 'SKY', 'MINT', 'CORAL', 'ROSE') NOT NULL DEFAULT 'INDIGO',
  `sidebar_collapsed_by_default` BOOLEAN NOT NULL DEFAULT false,
  `compact_tables` BOOLEAN NOT NULL DEFAULT false,
  `default_page_size` INTEGER NOT NULL DEFAULT 20,
  `remember_expense_filters` BOOLEAN NOT NULL DEFAULT true,
  `default_expense_status` ENUM('COMPLETED', 'PLANNED', 'CANCELLED') NOT NULL DEFAULT 'COMPLETED',
  `default_payment_method` ENUM(
    'CASH',
    'DEBIT_CARD',
    'CREDIT_CARD',
    'BANK_TRANSFER',
    'DIRECT_DEBIT',
    'DIGITAL_WALLET',
    'CHECK',
    'OTHER'
  ) NULL,
  `default_calendar_view` ENUM('MONTH', 'WEEK', 'LIST') NOT NULL DEFAULT 'MONTH',
  `dashboard_trend_months` INTEGER NOT NULL DEFAULT 6,
  `default_reminder_time` TIME(0) NOT NULL DEFAULT '09:00:00',
  `default_reminder_types` JSON NULL,
  `due_today_enabled` BOOLEAN NOT NULL DEFAULT true,
  `overdue_enabled` BOOLEAN NOT NULL DEFAULT true,
  `enabled_category_icons` JSON NULL,
  `enabled_label_icons` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_preferences_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
