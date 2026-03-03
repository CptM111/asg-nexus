import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  float,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  bio: text("bio"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── AI Personas ──────────────────────────────────────────────────────────────
export const personas = mysqlTable("personas", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // owner
  name: varchar("name", { length: 128 }).notNull(),
  avatar: text("avatar"),
  systemPrompt: text("systemPrompt").notNull(),
  traits: json("traits").$type<string[]>(),
  bio: text("bio"),
  alignmentScore: float("alignmentScore").default(0),
  memoryCount: int("memoryCount").default(0),
  isPublic: boolean("isPublic").default(true).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  autoCommentEnabled: boolean("autoCommentEnabled").default(true).notNull(),
  autoCommentFrequency: mysqlEnum("autoCommentFrequency", ["low", "medium", "high"]).default("medium"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Persona = typeof personas.$inferSelect;
export type InsertPersona = typeof personas.$inferInsert;

// ─── Persona Memories ─────────────────────────────────────────────────────────
export const personaMemories = mysqlTable("persona_memories", {
  id: int("id").autoincrement().primaryKey(),
  personaId: int("personaId").notNull(),
  content: text("content").notNull(),
  embedding: json("embedding").$type<number[]>(),
  memoryType: mysqlEnum("memoryType", ["knowledge", "conversation", "feedback", "alignment"]).default("knowledge").notNull(),
  importance: float("importance").default(1.0).notNull(),
  sourceType: varchar("sourceType", { length: 64 }), // "upload", "chat", "post", "comment"
  sourceId: varchar("sourceId", { length: 64 }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PersonaMemory = typeof personaMemories.$inferSelect;
export type InsertPersonaMemory = typeof personaMemories.$inferInsert;

// ─── Knowledge Documents ──────────────────────────────────────────────────────
export const knowledgeDocs = mysqlTable("knowledge_docs", {
  id: int("id").autoincrement().primaryKey(),
  personaId: int("personaId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  content: text("content").notNull(),
  fileUrl: text("fileUrl"),
  chunkCount: int("chunkCount").default(0),
  status: mysqlEnum("status", ["pending", "processing", "done", "error"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type KnowledgeDoc = typeof knowledgeDocs.$inferSelect;
export type InsertKnowledgeDoc = typeof knowledgeDocs.$inferInsert;

// ─── Chat Conversations ───────────────────────────────────────────────────────
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["user_persona", "user_user", "persona_persona"]).notNull(),
  participant1Id: int("participant1Id").notNull(), // userId or personaId
  participant1Type: mysqlEnum("participant1Type", ["user", "persona"]).notNull(),
  participant2Id: int("participant2Id").notNull(),
  participant2Type: mysqlEnum("participant2Type", ["user", "persona"]).notNull(),
  encryptionKeyHash: varchar("encryptionKeyHash", { length: 128 }),
  lastMessageAt: timestamp("lastMessageAt").defaultNow(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

// ─── Chat Messages ────────────────────────────────────────────────────────────
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderId: int("senderId").notNull(),
  senderType: mysqlEnum("senderType", ["user", "persona"]).notNull(),
  content: text("content").notNull(), // encrypted ciphertext
  contentIv: varchar("contentIv", { length: 64 }), // AES-GCM IV
  isEncrypted: boolean("isEncrypted").default(true).notNull(),
  isBlocked: boolean("isBlocked").default(false).notNull(),
  blockReason: text("blockReason"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─── Moments / Feed Posts ─────────────────────────────────────────────────────
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull(),
  authorType: mysqlEnum("authorType", ["user", "persona"]).notNull(),
  content: text("content").notNull(),
  mediaUrls: json("mediaUrls").$type<string[]>(),
  tags: json("tags").$type<string[]>(),
  visibility: mysqlEnum("visibility", ["public", "friends", "private"]).default("public").notNull(),
  likeCount: int("likeCount").default(0).notNull(),
  commentCount: int("commentCount").default(0).notNull(),
  alignmentDataUsed: boolean("alignmentDataUsed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

// ─── Post Comments ────────────────────────────────────────────────────────────
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  authorId: int("authorId").notNull(),
  authorType: mysqlEnum("authorType", ["user", "persona"]).notNull(),
  content: text("content").notNull(),
  isAiGenerated: boolean("isAiGenerated").default(false).notNull(),
  usedAsAlignment: boolean("usedAsAlignment").default(false),
  parentCommentId: int("parentCommentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

// ─── Post Likes ───────────────────────────────────────────────────────────────
export const postLikes = mysqlTable("post_likes", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId"),
  personaId: int("personaId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Persona Social Graph (interactions) ─────────────────────────────────────
export const personaInteractions = mysqlTable("persona_interactions", {
  id: int("id").autoincrement().primaryKey(),
  fromPersonaId: int("fromPersonaId").notNull(),
  toPersonaId: int("toPersonaId"),
  toUserId: int("toUserId"),
  interactionType: mysqlEnum("interactionType", ["comment", "like", "chat", "alignment"]).notNull(),
  count: int("count").default(1).notNull(),
  lastInteractedAt: timestamp("lastInteractedAt").defaultNow().notNull(),
});

export type PersonaInteraction = typeof personaInteractions.$inferSelect;

// ─── Security Logs ────────────────────────────────────────────────────────────
export const securityLogs = mysqlTable("security_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  personaId: int("personaId"),
  action: varchar("action", { length: 128 }).notNull(),
  inputHash: varchar("inputHash", { length: 128 }),
  blocked: boolean("blocked").default(false).notNull(),
  threatTypes: json("threatTypes").$type<string[]>(),
  confidence: float("confidence").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Persona Follows ──────────────────────────────────────────────────────────
export const personaFollows = mysqlTable("persona_follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),    // user id
  personaId: int("personaId").notNull(),       // persona being followed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PersonaFollow = typeof personaFollows.$inferSelect;
export type InsertPersonaFollow = typeof personaFollows.$inferInsert;
