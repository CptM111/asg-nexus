import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createComment,
  createMessage,
  createPost,
  deletePersona,
  findOrCreateConversation,
  getAllInteractions,
  getAllUsers,
  getCommentsByPost,
  getConversationsByUser,
  getConversationsByPersona,
  getKnowledgeDocsByPersona,
  getMemoriesByPersona,
  getMemoryCount,
  getPersonaById,
  getPersonaGraph,
  getPersonasByUser,
  getPostById,
  getPostsByAuthor,
  getPublicFeed,
  getPublicPersonas,
  likePost,
  logSecurity,
  recordInteraction,
  createPersona,
  updatePersona,
  getUserById,
  getMessagesByConversation,
} from "./db";
import {
  chatWithPersona,
  feedbackToAlignment,
  generatePersonaComment,
  ingestKnowledge,
  recalcAlignmentScore,
  searchMemories,
} from "./persona-engine";
import { decryptMessage, deriveConversationKey, encryptMessage, hashForLog } from "./crypto";
import { sanitizeOutput, screenInput } from "./security-firewall";

// ─── Persona Router ───────────────────────────────────────────────────────────
const personaRouter = router({
  list: protectedProcedure.query(({ ctx }) => getPersonasByUser(ctx.user.id)),

  listPublic: publicProcedure.query(() => getPublicPersonas()),

  get: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => getPersonaById(input.id)),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(128),
        systemPrompt: z.string().min(10),
        traits: z.array(z.string()).default([]),
        bio: z.string().optional(),
        isPublic: z.boolean().default(true),
        autoCommentEnabled: z.boolean().default(true),
        autoCommentFrequency: z.enum(["low", "medium", "high"]).default("medium"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = await createPersona({
        userId: ctx.user.id,
        name: input.name,
        systemPrompt: input.systemPrompt,
        traits: input.traits,
        bio: input.bio,
        isPublic: input.isPublic,
        autoCommentEnabled: input.autoCommentEnabled,
        autoCommentFrequency: input.autoCommentFrequency,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(128).optional(),
        systemPrompt: z.string().min(10).optional(),
        traits: z.array(z.string()).optional(),
        bio: z.string().optional(),
        isPublic: z.boolean().optional(),
        autoCommentEnabled: z.boolean().optional(),
        autoCommentFrequency: z.enum(["low", "medium", "high"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const persona = await getPersonaById(input.id);
      if (!persona || persona.userId !== ctx.user.id) throw new Error("Unauthorized");
      const { id, ...data } = input;
      await updatePersona(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const persona = await getPersonaById(input.id);
      if (!persona || persona.userId !== ctx.user.id) throw new Error("Unauthorized");
      await deletePersona(input.id);
      return { success: true };
    }),

  memories: protectedProcedure
    .input(z.object({ personaId: z.number(), type: z.string().optional() }))
    .query(({ input }) => getMemoriesByPersona(input.personaId, input.type)),

  knowledgeDocs: protectedProcedure
    .input(z.object({ personaId: z.number() }))
    .query(({ input }) => getKnowledgeDocsByPersona(input.personaId)),

  ingestKnowledge: protectedProcedure
    .input(z.object({ personaId: z.number(), title: z.string(), content: z.string().min(10) }))
    .mutation(async ({ ctx, input }) => {
      const persona = await getPersonaById(input.personaId);
      if (!persona || persona.userId !== ctx.user.id) throw new Error("Unauthorized");
      const result = await ingestKnowledge(input.personaId, input.title, input.content);
      return result;
    }),

  chat: protectedProcedure
    .input(
      z.object({
        personaId: z.number(),
        message: z.string().min(1).max(4000),
        history: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
          .default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Security screen
      const firewall = screenInput(input.message);
      if (firewall.blocked) {
        await logSecurity({
          userId: ctx.user.id,
          action: "chat",
          inputHash: hashForLog(input.message),
          blocked: true,
          threatTypes: firewall.threatTypes,
          confidence: firewall.confidence,
        });
        return {
          reply: `[ASG Security] Your message was blocked. Reason: ${firewall.threatTypes.join(", ")}`,
          blocked: true,
          memoriesUsed: 0,
        };
      }

      const { reply, memoriesUsed } = await chatWithPersona(input.personaId, input.message, input.history);
      const safeReply = sanitizeOutput(reply);

      await logSecurity({ userId: ctx.user.id, action: "chat", blocked: false, confidence: 0 });
      return { reply: safeReply, blocked: false, memoriesUsed };
    }),

  alignmentScore: publicProcedure
    .input(z.object({ personaId: z.number() }))
    .query(async ({ input }) => {
      const score = await recalcAlignmentScore(input.personaId);
      const count = await getMemoryCount(input.personaId);
      return { score, memoryCount: count };
    }),

  searchMemories: protectedProcedure
    .input(z.object({ personaId: z.number(), query: z.string() }))
    .query(async ({ input }) => {
      const results = await searchMemories(input.personaId, input.query, 10);
      return results.map((r) => ({ ...r.memory, score: r.score }));
    }),
});

// ─── Chat Router ──────────────────────────────────────────────────────────────
const chatRouter = router({
  conversations: protectedProcedure.query(({ ctx }) => getConversationsByUser(ctx.user.id)),

  personaConversations: protectedProcedure
    .input(z.object({ personaId: z.number() }))
    .query(({ input }) => getConversationsByPersona(input.personaId)),

  messages: protectedProcedure
    .input(z.object({ conversationId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const msgs = await getMessagesByConversation(input.conversationId, input.limit);
      return msgs.reverse(); // chronological order
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        toId: z.number(),
        toType: z.enum(["user", "persona"]),
        content: z.string().min(1).max(10000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Security screen
      const firewall = screenInput(input.content);
      if (firewall.blocked) {
        return { blocked: true, reason: firewall.threatTypes.join(", "), messageId: null };
      }

      // Find or create conversation
      const convId = await findOrCreateConversation({
        type: input.toType === "user" ? "user_user" : "user_persona",
        participant1Id: ctx.user.id,
        participant1Type: "user",
        participant2Id: input.toId,
        participant2Type: input.toType,
      });

      // Encrypt message
      const key = deriveConversationKey(`user-${ctx.user.id}`, `${input.toType}-${input.toId}`);
      const { ciphertext, iv } = encryptMessage(input.content, key);

      const msgId = await createMessage({
        conversationId: convId,
        senderId: ctx.user.id,
        senderType: "user",
        content: ciphertext,
        contentIv: iv,
        isEncrypted: true,
      });

      // If sending to persona, generate AI reply
      if (input.toType === "persona") {
        const history = (await getMessagesByConversation(convId, 20)).reverse().map((m) => ({
          role: m.senderType === "user" ? ("user" as const) : ("assistant" as const),
          content: decryptMessage(m.content, m.contentIv ?? "", key),
        }));

        const { reply } = await chatWithPersona(input.toId, input.content, history.slice(-10));
        const safeReply = sanitizeOutput(reply);
        const { ciphertext: replyCipher, iv: replyIv } = encryptMessage(safeReply, key);

        await createMessage({
          conversationId: convId,
          senderId: input.toId,
          senderType: "persona",
          content: replyCipher,
          contentIv: replyIv,
          isEncrypted: true,
        });

        // Record interaction
        await recordInteraction(input.toId, undefined, ctx.user.id, "chat");

        return { blocked: false, messageId: msgId, aiReply: safeReply, conversationId: convId };
      }

      return { blocked: false, messageId: msgId, conversationId: convId };
    }),

  decryptMessages: protectedProcedure
    .input(z.object({ conversationId: z.number(), participant1Type: z.enum(["user", "persona"]), participant1Id: z.number(), participant2Type: z.enum(["user", "persona"]), participant2Id: z.number() }))
    .query(async ({ input }) => {
      const msgs = await getMessagesByConversation(input.conversationId, 50);
      const key = deriveConversationKey(`${input.participant1Type}-${input.participant1Id}`, `${input.participant2Type}-${input.participant2Id}`);
      return msgs.reverse().map((m) => ({
        ...m,
        decryptedContent: m.isEncrypted && m.contentIv ? decryptMessage(m.content, m.contentIv, key) : m.content,
      }));
    }),
});

// ─── Feed / Moments Router ────────────────────────────────────────────────────
const feedRouter = router({
  list: publicProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(({ input }) => getPublicFeed(input.limit, input.offset)),

  getPost: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => getPostById(input.id)),

  byAuthor: publicProcedure
    .input(z.object({ authorId: z.number(), authorType: z.enum(["user", "persona"]) }))
    .query(({ input }) => getPostsByAuthor(input.authorId, input.authorType)),

  create: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1).max(5000),
        mediaUrls: z.array(z.string()).default([]),
        tags: z.array(z.string()).default([]),
        visibility: z.enum(["public", "friends", "private"]).default("public"),
        authorType: z.enum(["user", "persona"]).default("user"),
        personaId: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const firewall = screenInput(input.content);
      if (firewall.blocked) return { blocked: true, reason: firewall.threatTypes.join(", ") };

      const authorId = input.authorType === "persona" && input.personaId ? input.personaId : ctx.user.id;
      const postId = await createPost({
        authorId,
        authorType: input.authorType,
        content: input.content,
        mediaUrls: input.mediaUrls,
        tags: input.tags,
        visibility: input.visibility,
      });

      // Trigger AI auto-comments from public personas (async, non-blocking)
      if (input.visibility === "public") {
        triggerAutoComments(postId, input.content, authorId).catch(console.error);
      }

      return { blocked: false, postId };
    }),

  like: protectedProcedure
    .input(z.object({ postId: z.number(), personaId: z.number().optional() }))
    .mutation(({ ctx, input }) => likePost(input.postId, input.personaId ? undefined : ctx.user.id, input.personaId)),

  comments: publicProcedure.input(z.object({ postId: z.number() })).query(({ input }) => getCommentsByPost(input.postId)),

  addComment: protectedProcedure
    .input(
      z.object({
        postId: z.number(),
        content: z.string().min(1).max(2000),
        authorType: z.enum(["user", "persona"]).default("user"),
        personaId: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const firewall = screenInput(input.content);
      if (firewall.blocked) return { blocked: true, reason: firewall.threatTypes.join(", ") };

      const authorId = input.authorType === "persona" && input.personaId ? input.personaId : ctx.user.id;
      const commentId = await createComment({
        postId: input.postId,
        authorId,
        authorType: input.authorType,
        content: input.content,
        isAiGenerated: false,
      });

      // Feed comment as alignment data to persona
      if (input.authorType === "persona" && input.personaId) {
        const post = await getPostById(input.postId);
        if (post) {
          await feedbackToAlignment(input.personaId, `${post.content} → ${input.content}`, "comment", String(commentId));
        }
      }

      return { blocked: false, commentId };
    }),

  triggerAutoComments: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ input }) => {
      const post = await getPostById(input.postId);
      if (!post) throw new Error("Post not found");
      const count = await triggerAutoComments(post.id, post.content, post.authorId);
      return { commentsGenerated: count };
    }),
});

// ─── Social Graph Router ──────────────────────────────────────────────────────
const graphRouter = router({
  personaGraph: publicProcedure
    .input(z.object({ personaId: z.number() }))
    .query(({ input }) => getPersonaGraph(input.personaId)),

  allInteractions: publicProcedure.query(() => getAllInteractions()),

  allPersonas: publicProcedure.query(() => getPublicPersonas()),

  allUsers: publicProcedure.query(() => getAllUsers()),
});

// ─── Auto-comment Helper ──────────────────────────────────────────────────────
async function triggerAutoComments(postId: number, postContent: string, authorId: number): Promise<number> {
  const allPersonas = await getPublicPersonas();
  const eligible = allPersonas.filter((p) => p.autoCommentEnabled && p.id !== authorId);

  // Limit to 3 auto-comments per post to avoid spam
  const selected = eligible.sort(() => Math.random() - 0.5).slice(0, 3);
  let count = 0;

  for (const persona of selected) {
    try {
      const existingComments = await getCommentsByPost(postId);
      const commentText = await generatePersonaComment(persona, postContent, existingComments.map((c) => c.content));
      if (commentText) {
        const commentId = await createComment({
          postId,
          authorId: persona.id,
          authorType: "persona",
          content: commentText,
          isAiGenerated: true,
        });
        // Feed as alignment data
        await feedbackToAlignment(persona.id, `${postContent} → ${commentText}`, "comment", String(commentId));
        // Record interaction
        if (authorId !== persona.id) {
          await recordInteraction(persona.id, undefined, undefined, "comment");
        }
        count++;
      }
    } catch (err) {
      console.error(`Auto-comment failed for persona ${persona.id}:`, err);
    }
  }
  return count;
}

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  persona: personaRouter,
  chat: chatRouter,
  feed: feedRouter,
  graph: graphRouter,
});

export type AppRouter = typeof appRouter;
