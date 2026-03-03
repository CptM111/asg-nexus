import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { getDb } from "./db";
import { messages, conversations } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { encryptMessage, deriveConversationKey } from "./crypto";
import { screenInput } from "./security-firewall";
import { chatWithPersona } from "./persona-engine";

// Track connected users: userId -> Set of socket IDs
const connectedUsers = new Map<number, Set<string>>();

let io: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return io;
}

export function initWebSocket(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/api/socket.io",
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.handshake.auth?.userId as number | undefined;

    // Register user presence
    if (userId) {
      if (!connectedUsers.has(userId)) connectedUsers.set(userId, new Set());
      connectedUsers.get(userId)!.add(socket.id);
      socket.join(`user:${userId}`);
      io!.emit("presence:update", { userId, online: true });
    }

    // Join a conversation room
    socket.on("chat:join", ({ conversationId }: { conversationId: number }) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on("chat:leave", ({ conversationId }: { conversationId: number }) => {
      socket.leave(`conv:${conversationId}`);
    });

    // Real-time message send
    socket.on(
      "chat:message",
      async ({
        conversationId,
        toId,
        toType,
        content,
      }: {
        conversationId: number;
        toId: number;
        toType: "persona" | "user";
        content: string;
      }) => {
        if (!userId) {
          socket.emit("chat:error", { message: "Not authenticated" });
          return;
        }
        try {
          // Security firewall
          const firewall = screenInput(content);
          if (firewall.blocked) {
            socket.emit("chat:error", { message: `Blocked: ${firewall.threatTypes.join(", ")}` });
            return;
          }

          const db = await getDb();
          if (!db) throw new Error("Database unavailable");

          // Encrypt and store message
          const convKey = deriveConversationKey(String(userId), String(toId));
          const { ciphertext, iv } = encryptMessage(content, convKey);
          const [inserted] = await db.insert(messages).values({
            conversationId,
            senderId: userId,
            senderType: "user",
            content: ciphertext,
            contentIv: iv,
            isEncrypted: true,
          }).$returningId();

          const msgId = inserted?.id ?? Date.now();

          // Update conversation last message timestamp
          await db.update(conversations)
            .set({ lastMessageAt: new Date() })
            .where(eq(conversations.id, conversationId));

          // Broadcast user message to conversation room
          const outgoing = {
            id: msgId,
            conversationId,
            senderId: userId,
            senderType: "user" as const,
            decryptedContent: content,
            createdAt: new Date().toISOString(),
          };
          io!.to(`conv:${conversationId}`).emit("chat:message", outgoing);
          socket.emit("chat:message:sent", { id: msgId });

          // If messaging a persona, generate AI reply
          if (toType === "persona") {
            const typingPayload = { personaId: toId, conversationId };
            io!.to(`conv:${conversationId}`).emit("chat:typing:start", typingPayload);

            try {
              const { reply: aiReply } = await chatWithPersona(toId, content, []);
              const { ciphertext: aiEnc, iv: aiIv } = encryptMessage(aiReply, convKey);
              const [aiInserted] = await db.insert(messages).values({
                conversationId,
                senderId: toId,
                senderType: "persona",
                content: aiEnc,
                contentIv: aiIv,
                isEncrypted: true,
              }).$returningId();

              const aiMsg = {
                id: aiInserted?.id ?? Date.now() + 1,
                conversationId,
                senderId: toId,
                senderType: "persona" as const,
                decryptedContent: aiReply,
                createdAt: new Date().toISOString(),
              };
              io!.to(`conv:${conversationId}`).emit("chat:message", aiMsg);
            } finally {
              io!.to(`conv:${conversationId}`).emit("chat:typing:stop", typingPayload);
            }
          }
        } catch (err: any) {
          console.error("[WS] chat:message error:", err);
          socket.emit("chat:error", { message: err.message || "Failed to send message" });
        }
      }
    );

    // User typing indicators
    socket.on("chat:typing:start", ({ conversationId }: { conversationId: number }) => {
      if (!userId) return;
      socket.to(`conv:${conversationId}`).emit("chat:typing:start", { userId, conversationId });
    });

    socket.on("chat:typing:stop", ({ conversationId }: { conversationId: number }) => {
      if (!userId) return;
      socket.to(`conv:${conversationId}`).emit("chat:typing:stop", { userId, conversationId });
    });

    socket.on("disconnect", () => {
      if (userId) {
        const sockets = connectedUsers.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            connectedUsers.delete(userId);
            io!.emit("presence:update", { userId, online: false });
          }
        }
      }
    });
  });

  console.log("[WS] Socket.io initialized on /api/socket.io");
  return io;
}

export function isUserOnline(userId: number): boolean {
  return connectedUsers.has(userId) && (connectedUsers.get(userId)?.size ?? 0) > 0;
}

export function emitToUser(userId: number, event: string, data: unknown) {
  if (io) io.to(`user:${userId}`).emit(event, data);
}
