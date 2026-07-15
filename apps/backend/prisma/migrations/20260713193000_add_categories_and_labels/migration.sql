DROP INDEX `categories_slug_key` ON `categories`;

ALTER TABLE `categories`
  MODIFY `name` VARCHAR(100) NOT NULL,
  MODIFY `slug` VARCHAR(120) NOT NULL,
  MODIFY `icon` VARCHAR(100) NOT NULL,
  ADD COLUMN `description` VARCHAR(255) NULL,
  ADD COLUMN `deleted_at` DATETIME(3) NULL;

CREATE UNIQUE INDEX `categories_user_slug_key` ON `categories`(`user_id`, `slug`);
CREATE INDEX `categories_is_default_idx` ON `categories`(`is_default`);

CREATE TABLE `user_category_preferences` (
  `user_id` VARCHAR(36) NOT NULL,
  `category_id` VARCHAR(36) NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`user_id`, `category_id`),
  INDEX `user_category_preferences_category_id_idx` (`category_id`),
  CONSTRAINT `user_category_preferences_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_category_preferences_category_id_fkey`
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `labels` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `category_id` VARCHAR(36) NULL,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(120) NOT NULL,
  `description` VARCHAR(255) NULL,
  `color` VARCHAR(7) NOT NULL,
  `icon` VARCHAR(100) NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  `deleted_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `labels_user_slug_key` (`user_id`, `slug`),
  INDEX `labels_user_deleted_idx` (`user_id`, `deleted_at`),
  INDEX `labels_category_id_idx` (`category_id`),
  INDEX `labels_is_active_idx` (`is_active`),
  CONSTRAINT `labels_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `labels_category_id_fkey`
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
