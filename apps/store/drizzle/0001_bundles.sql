CREATE TABLE `bundles` (
	`id` text PRIMARY KEY NOT NULL,
	`ddf_uuid` text NOT NULL,
	`date_created` text NOT NULL,
	`source_last_modified` text NOT NULL,
	`vendor` text NOT NULL,
	`product` text NOT NULL,
	`version_deconz` text NOT NULL,
	`info` text,
	`content` blob NOT NULL,
	`content_size` integer NOT NULL,
	`file_count` integer NOT NULL,
	`content_hash` text NOT NULL,
	`deprecation_message` text,
	FOREIGN KEY (`ddf_uuid`) REFERENCES `ddf_uuids`(`id`) ON UPDATE no action ON DELETE no action
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
	`date_created` text NOT NULL,
	`expire_at` text
);
--> statement-breakpoint
CREATE TABLE `device_identifiers` (
	`id` text PRIMARY KEY NOT NULL,
	`manufacturer` text NOT NULL,
	`model` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `device_identifiers_manufacturer_model_unique` ON `device_identifiers` (`manufacturer`,`model`);--> statement-breakpoint
CREATE TABLE `signatures` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`bundle` text NOT NULL,
	`type` text NOT NULL,
	FOREIGN KEY (`bundle`) REFERENCES `bundles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `signatures_bundle_idx` ON `signatures` (`bundle`);--> statement-breakpoint
CREATE INDEX `signatures_key_idx` ON `signatures` (`key`);