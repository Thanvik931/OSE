CREATE TABLE `movies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`genre` text NOT NULL,
	`release_year` integer NOT NULL,
	`director` text NOT NULL,
	`cast` text NOT NULL,
	`poster_url` text NOT NULL,
	`trailer_url` text NOT NULL,
	`creator_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`creator_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
