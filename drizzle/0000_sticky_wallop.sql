CREATE TABLE IF NOT EXISTS `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`authorId` int NOT NULL,
	`authorType` enum('user','persona') NOT NULL,
	`content` text NOT NULL,
	`isAiGenerated` boolean NOT NULL DEFAULT false,
	`usedAsAlignment` boolean DEFAULT false,
	`parentCommentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('user_persona','user_user','persona_persona') NOT NULL,
	`participant1Id` int NOT NULL,
	`participant1Type` enum('user','persona') NOT NULL,
	`participant2Id` int NOT NULL,
	`participant2Type` enum('user','persona') NOT NULL,
	`encryptionKeyHash` varchar(128),
	`lastMessageAt` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `knowledge_docs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personaId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`content` text NOT NULL,
	`fileUrl` text,
	`chunkCount` int DEFAULT 0,
	`status` enum('pending','processing','done','error') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `knowledge_docs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`senderId` int NOT NULL,
	`senderType` enum('user','persona') NOT NULL,
	`content` text NOT NULL,
	`contentIv` varchar(64),
	`isEncrypted` boolean NOT NULL DEFAULT true,
	`isBlocked` boolean NOT NULL DEFAULT false,
	`blockReason` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `persona_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromPersonaId` int NOT NULL,
	`toPersonaId` int,
	`toUserId` int,
	`interactionType` enum('comment','like','chat','alignment') NOT NULL,
	`count` int NOT NULL DEFAULT 1,
	`lastInteractedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `persona_interactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `persona_memories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`personaId` int NOT NULL,
	`content` text NOT NULL,
	`embedding` json,
	`memoryType` enum('knowledge','conversation','feedback','alignment') NOT NULL DEFAULT 'knowledge',
	`importance` float NOT NULL DEFAULT 1,
	`sourceType` varchar(64),
	`sourceId` varchar(64),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `persona_memories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `personas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`avatar` text,
	`systemPrompt` text NOT NULL,
	`traits` json,
	`bio` text,
	`alignmentScore` float DEFAULT 0,
	`memoryCount` int DEFAULT 0,
	`isPublic` boolean NOT NULL DEFAULT true,
	`isActive` boolean NOT NULL DEFAULT true,
	`autoCommentEnabled` boolean NOT NULL DEFAULT true,
	`autoCommentFrequency` enum('low','medium','high') DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `personas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `post_likes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`userId` int,
	`personaId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `post_likes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`authorType` enum('user','persona') NOT NULL,
	`content` text NOT NULL,
	`mediaUrls` json,
	`tags` json,
	`visibility` enum('public','friends','private') NOT NULL DEFAULT 'public',
	`likeCount` int NOT NULL DEFAULT 0,
	`commentCount` int NOT NULL DEFAULT 0,
	`alignmentDataUsed` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `security_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`personaId` int,
	`action` varchar(128) NOT NULL,
	`inputHash` varchar(128),
	`blocked` boolean NOT NULL DEFAULT false,
	`threatTypes` json,
	`confidence` float DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `security_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`avatar` text,
	`bio` text,
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
