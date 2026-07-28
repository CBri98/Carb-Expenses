UPDATE `expense_reminders` AS `reminder`
INNER JOIN `expenses` AS `expense` ON `expense`.`id` = `reminder`.`expense_id`
SET `reminder`.`source` = 'RECURRENCE'
WHERE `expense`.`generated_by_recurrence` = TRUE
  AND `expense`.`recurrence_rule_id` IS NOT NULL;
