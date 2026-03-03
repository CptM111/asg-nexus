import { and, desc, eq, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Comment,
  InsertComment,
  InsertConversation,
  InsertKnowledgeDoc,
  InsertMessage,
  InsertPersona,
  InsertPersonaMemory,
  InsertPost,
  InsertUser,
  KnowledgeDoc,
  Message,
  Persona,
  PersonaMemory,
  Post,
  comments,
  conversations,
  knowledgeDocs,
  messages,
  personaInteractions,
  personaMemories,
  personas,
  postLikes,
  posts,
  securityLogs,
  users,
  personaFollows,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  for (const field of ["name", "email", "loginMethod", "avatar", "bio"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

// ─── Personas ─────────────────────────────────────────────────────────────────
export async function createPersona(data: InsertPersona): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(personas).values(data);
  return (result[0] as any).insertId;
}

export async function getPersonaById(id: number): Promise<Persona | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(personas).where(eq(personas.id, id)).limit(1);
  return result[0];
}

export async function getPersonasByUser(userId: number): Promise<Persona[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(personas).where(eq(personas.userId, userId)).orderBy(desc(personas.updatedAt));
}

export async function getPublicPersonas(): Promise<Persona[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(personas).where(and(eq(personas.isPublic, true), eq(personas.isActive, true))).orderBy(desc(personas.updatedAt));
}

export async function updatePersona(id: number, data: Partial<InsertPersona>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(personas).set(data).where(eq(personas.id, id));
}

export async function deletePersona(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(personaMemories).where(eq(personaMemories.personaId, id));
  await db.delete(personas).where(eq(personas.id, id));
}

// ─── Persona Memories ─────────────────────────────────────────────────────────
export async function addMemory(data: InsertPersonaMemory): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(personaMemories).values(data);
  // Update memory count
  await db.execute(sql`UPDATE personas SET memoryCount = memoryCount + 1 WHERE id = ${data.personaId}`);
  return (result[0] as any).insertId;
}

export async function getMemoriesByPersona(personaId: number, memoryType?: string): Promise<PersonaMemory[]> {
  const db = await getDb();
  if (!db) return [];
  if (memoryType) {
    return db.select().from(personaMemories).where(and(eq(personaMemories.personaId, personaId), eq(personaMemories.memoryType, memoryType as any))).orderBy(desc(personaMemories.createdAt));
  }
  return db.select().from(personaMemories).where(eq(personaMemories.personaId, personaId)).orderBy(desc(personaMemories.createdAt));
}

export async function getMemoryCount(personaId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(personaMemories).where(eq(personaMemories.personaId, personaId));
  return result[0]?.count ?? 0;
}

// ─── Knowledge Docs ───────────────────────────────────────────────────────────
export async function createKnowledgeDoc(data: InsertKnowledgeDoc): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(knowledgeDocs).values(data);
  return (result[0] as any).insertId;
}

export async function getKnowledgeDocsByPersona(personaId: number): Promise<KnowledgeDoc[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(knowledgeDocs).where(eq(knowledgeDocs.personaId, personaId)).orderBy(desc(knowledgeDocs.createdAt));
}

export async function updateKnowledgeDocStatus(id: number, status: KnowledgeDoc["status"], chunkCount?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(knowledgeDocs).set({ status, ...(chunkCount !== undefined ? { chunkCount } : {}) }).where(eq(knowledgeDocs.id, id));
}

// ─── Conversations ────────────────────────────────────────────────────────────
export async function findOrCreateConversation(data: InsertConversation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await db.select().from(conversations).where(
    or(
      and(eq(conversations.participant1Id, data.participant1Id), eq(conversations.participant1Type, data.participant1Type), eq(conversations.participant2Id, data.participant2Id), eq(conversations.participant2Type, data.participant2Type)),
      and(eq(conversations.participant1Id, data.participant2Id), eq(conversations.participant1Type, data.participant2Type), eq(conversations.participant2Id, data.participant1Id), eq(conversations.participant2Type, data.participant1Type)),
    )
  ).limit(1);
  if (existing[0]) return existing[0].id;
  const result = await db.insert(conversations).values(data);
  return (result[0] as any).insertId;
}

export async function getConversationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations).where(
    or(
      and(eq(conversations.participant1Id, userId), eq(conversations.participant1Type, "user")),
      and(eq(conversations.participant2Id, userId), eq(conversations.participant2Type, "user")),
    )
  ).orderBy(desc(conversations.lastMessageAt));
}

export async function getConversationsByPersona(personaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations).where(
    or(
      and(eq(conversations.participant1Id, personaId), eq(conversations.participant1Type, "persona")),
      and(eq(conversations.participant2Id, personaId), eq(conversations.participant2Type, "persona")),
    )
  ).orderBy(desc(conversations.lastMessageAt));
}

// ─── Messages ─────────────────────────────────────────────────────────────────
export async function createMessage(data: InsertMessage): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(messages).values(data);
  await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, data.conversationId));
  return (result[0] as any).insertId;
}

export async function getMessagesByConversation(conversationId: number, limit = 50): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(desc(messages.createdAt)).limit(limit);
}

// ─── Posts ────────────────────────────────────────────────────────────────────
export async function createPost(data: InsertPost): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(posts).values(data);
  return (result[0] as any).insertId;
}

export async function getPublicFeed(limit = 20, offset = 0): Promise<Post[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posts).where(eq(posts.visibility, "public")).orderBy(desc(posts.createdAt)).limit(limit).offset(offset);
}

export async function getPostById(id: number): Promise<Post | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return result[0];
}

export async function getPostsByAuthor(authorId: number, authorType: "user" | "persona"): Promise<Post[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posts).where(and(eq(posts.authorId, authorId), eq(posts.authorType, authorType))).orderBy(desc(posts.createdAt));
}

export async function likePost(postId: number, userId?: number, personaId?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(postLikes).values({ postId, userId, personaId });
  await db.execute(sql`UPDATE posts SET likeCount = likeCount + 1 WHERE id = ${postId}`);
}

// ─── Comments ─────────────────────────────────────────────────────────────────
export async function createComment(data: InsertComment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(comments).values(data);
  await db.execute(sql`UPDATE posts SET commentCount = commentCount + 1 WHERE id = ${data.postId}`);
  return (result[0] as any).insertId;
}

export async function getCommentsByPost(postId: number): Promise<Comment[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(comments).where(eq(comments.postId, postId)).orderBy(comments.createdAt);
}

// ─── Persona Interactions ─────────────────────────────────────────────────────
export async function recordInteraction(fromPersonaId: number, toPersonaId?: number, toUserId?: number, type: "comment" | "like" | "chat" | "alignment" = "comment"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(personaInteractions).values({ fromPersonaId, toPersonaId, toUserId, interactionType: type, count: 1, lastInteractedAt: new Date() }).onDuplicateKeyUpdate({ set: { count: sql`count + 1`, lastInteractedAt: new Date() } });
}

export async function getPersonaGraph(personaId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(personaInteractions).where(eq(personaInteractions.fromPersonaId, personaId)).orderBy(desc(personaInteractions.count));
}

export async function getAllInteractions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(personaInteractions).orderBy(desc(personaInteractions.count)).limit(200);
}

// ─── Security Logs ────────────────────────────────────────────────────────────
export async function logSecurity(data: { userId?: number; personaId?: number; action: string; inputHash?: string; blocked: boolean; threatTypes?: string[]; confidence?: number }): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(securityLogs).values({ ...data, threatTypes: data.threatTypes ?? [] });
}

// ─── User Profile ─────────────────────────────────────────────────────────────
export async function updateUser(id: number, data: { name?: string; bio?: string; avatar?: string }): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id));
}

export async function getUserPersonaAlignmentHistory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: personas.id,
      name: personas.name,
      alignmentScore: personas.alignmentScore,
      memoryCount: personas.memoryCount,
      updatedAt: personas.updatedAt,
    })
    .from(personas)
    .where(eq(personas.userId, userId))
    .orderBy(desc(personas.alignmentScore));
}

// ─── Persona Follows ──────────────────────────────────────────────────────────
export async function followPersona(followerId: number, personaId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(personaFollows).values({ followerId, personaId }).onDuplicateKeyUpdate({ set: { followerId } });
}

export async function unfollowPersona(followerId: number, personaId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(personaFollows).where(and(eq(personaFollows.followerId, followerId), eq(personaFollows.personaId, personaId)));
}

export async function getFollowedPersonas(followerId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ personaId: personaFollows.personaId }).from(personaFollows).where(eq(personaFollows.followerId, followerId));
  return rows.map(r => r.personaId);
}

export async function getPersonaFollowerCount(personaId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ count: sql<number>`count(*)` }).from(personaFollows).where(eq(personaFollows.personaId, personaId));
  return Number(rows[0]?.count ?? 0);
}
