ALTER TABLE `ddf_uuids` ADD `owner_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `is_contributor` integer DEFAULT false NOT NULL;