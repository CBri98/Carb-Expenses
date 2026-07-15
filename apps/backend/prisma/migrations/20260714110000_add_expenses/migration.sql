CREATE TABLE `expenses` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `category_id` VARCHAR(36) NOT NULL,
  `description` VARCHAR(150) NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `expense_date` DATE NOT NULL,
  `expense_time` TIME(0) NULL,
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
  `status` ENUM('COMPLETED', 'PLANNED', 'CANCELLED') NOT NULL DEFAULT 'COMPLETED',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `expenses_user_date_idx` (`user_id`, `expense_date`),
  INDEX `expenses_user_status_idx` (`user_id`, `status`),
  INDEX `expenses_user_category_idx` (`user_id`, `category_id`),
  INDEX `expenses_user_payment_idx` (`user_id`, `payment_method`),
  INDEX `expenses_deleted_at_idx` (`deleted_at`),
  CONSTRAINT `expenses_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `expenses_category_id_fkey`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `expense_labels` (
  `expense_id` VARCHAR(36) NOT NULL,
  `label_id` VARCHAR(36) NOT NULL,
  PRIMARY KEY (`expense_id`, `label_id`),
  INDEX `expense_labels_label_id_idx` (`label_id`),
  CONSTRAINT `expense_labels_expense_id_fkey`
    FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `expense_labels_label_id_fkey`
    FOREIGN KEY (`label_id`) REFERENCES `labels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
