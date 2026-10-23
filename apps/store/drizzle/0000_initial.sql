CREATE TABLE `account_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`purpose` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_tokens_token_hash_unique` ON `account_tokens` (`token_hash`);--> statement-breakpoint
CREATE TABLE `api_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`token_prefix` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_used_at` integer,
	`revoked_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_tokens_token_hash_unique` ON `api_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `api_tokens_user_idx` ON `api_tokens` (`user_id`);--> statement-breakpoint
CREATE TABLE `bundles` (
	`id` text PRIMARY KEY NOT NULL,
	`ddf_uuid` text NOT NULL,
	`vendor` text NOT NULL,
	`product` text NOT NULL,
	`version_deconz` text NOT NULL,
	`user_created` text,
	`date_created` integer NOT NULL,
	`info` text,
	`deprecation_message` text,
	`content` blob NOT NULL,
	`content_size` integer NOT NULL,
	`file_count` integer NOT NULL,
	`content_hash` text NOT NULL,
	`source_last_modified` integer NOT NULL,
	FOREIGN KEY (`ddf_uuid`) REFERENCES `ddf_uuids`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_created`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `bundles_ddf_uuid_idx` ON `bundles` (`ddf_uuid`,`source_last_modified`,`date_created`);--> statement-breakpoint
CREATE TABLE `bundles_device_identifiers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bundles_id` text NOT NULL,
	`device_identifiers_id` text NOT NULL,
	FOREIGN KEY (`bundles_id`) REFERENCES `bundles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`device_identifiers_id`) REFERENCES `device_identifiers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bundles_device_identifiers_bundle_idx` ON `bundles_device_identifiers` (`bundles_id`);--> statement-breakpoint
CREATE TABLE `ddf_uuids` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text,
	`date_created` integer NOT NULL,
	`expire_at` integer
);
--> statement-breakpoint
CREATE TABLE `device_identifiers` (
	`id` text PRIMARY KEY NOT NULL,
	`manufacturer` text NOT NULL,
	`model` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `device_identifiers_manufacturer_model_unique` ON `device_identifiers` (`manufacturer`,`model`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`window_started_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE TABLE `signatures` (
	`id` text PRIMARY KEY NOT NULL,
	`bundle` text NOT NULL,
	`key` text NOT NULL,
	`type` text NOT NULL,
	FOREIGN KEY (`bundle`) REFERENCES `bundles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `signatures_bundle_idx` ON `signatures` (`bundle`);--> statement-breakpoint
CREATE INDEX `signatures_key_idx` ON `signatures` (`key`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`username` text,
	`avatar_url` text,
	`is_contributor` integer DEFAULT false NOT NULL,
	`public_key` text,
	`private_key` text,
	`email_verified_at` integer,
	`last_login_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_public_key_unique` ON `users` (`public_key`);