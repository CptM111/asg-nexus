CREATE TABLE `persona_follows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`followerId` int NOT NULL,
	`personaId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `persona_follows_id` PRIMARY KEY(`id`)
);
