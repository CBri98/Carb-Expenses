CREATE INDEX `expenses_dashboard_period_idx`
  ON `expenses`(`user_id`, `status`, `expense_date`, `deleted_at`);

CREATE INDEX `expenses_dashboard_recent_idx`
  ON `expenses`(`user_id`, `created_at`, `deleted_at`);
