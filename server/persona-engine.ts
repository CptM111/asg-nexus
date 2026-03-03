/**
 * ASG Nexus — Persona Engine
 * Handles: embedding generation, semantic memory search, multi-turn chat,
 * knowledge ingestion, and alignment feedback loop.
 */
import { invokeLLM } from "./_core/llm";
import {
  addMemory,
  createKnowledgeDoc,
  getKnowledgeDocsByPersona,
  getMemoriesByPersona,
  getPersonaById,
  updateKnowledgeDocStatus,
  updatePersona,
} from "./db";
import type { InsertPersonaMemory, Persona, PersonaMemory } from "../drizzle/schema";

// ─── Embedding ────────────────────────────────────────────────────────────────
/**
 * Generate a text embedding using the LLM API.
 * Falls back to a simple TF-IDF-like hash vector if the API doesn't support embeddings.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch(`${process.env.BUILT_IN_FORGE_API_URL}/v1/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`,
      },
      body: JSON.stringify({ model: "text-embedding-3-small", input: text.slice(0, 8000) }),
    });
    if (response.ok) {
      const data = await response.json() as any;
      return data.data?.[0]?.embedding ?? fallbackEmbedding(text);
    }
  } catch (_) {}
  return fallbackEmbedding(text);
}

/** Deterministic 128-dim hash-based embedding fallback */
function fallbackEmbedding(text: string): number[] {
  const vec = new Array(128).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % 128] += text.charCodeAt(i) / 1000;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

// ─── Cosine Similarity ────────────────────────────────────────────────────────
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

// ─── Semantic Memory Search ───────────────────────────────────────────────────
export async function searchMemories(
  personaId: number,
  query: string,
  topK = 5,
  minSimilarity = 0.25,
): Promise<Array<{ memory: PersonaMemory; score: number }>> {
  const queryEmbedding = await generateEmbedding(query);
  const allMemories = await getMemoriesByPersona(personaId);

  const scored = allMemories
    .filter((m) => m.embedding && Array.isArray(m.embedding))
    .map((m) => ({
      memory: m,
      score: cosineSimilarity(queryEmbedding, m.embedding as number[]) * (m.importance ?? 1),
    }))
    .filter((s) => s.score >= minSimilarity)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

// ─── Knowledge Ingestion ──────────────────────────────────────────────────────
const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end).trim());
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks.filter((c) => c.length > 20);
}

export async function ingestKnowledge(personaId: number, title: string, content: string): Promise<{ docId: number; chunks: number }> {
  const docId = await createKnowledgeDoc({ personaId, title, content, status: "processing" });
  const chunks = chunkText(content);

  try {
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);
      const memData: InsertPersonaMemory = {
        personaId,
        content: chunk,
        embedding,
        memoryType: "knowledge",
        importance: 1.2,
        sourceType: "upload",
        sourceId: String(docId),
        metadata: { title, chunkIndex: i, totalChunks: chunks.length },
      };
      await addMemory(memData);
    }
    await updateKnowledgeDocStatus(docId, "done", chunks.length);
  } catch (err) {
    await updateKnowledgeDocStatus(docId, "error");
    throw err;
  }

  // Update alignment score
  await recalcAlignmentScore(personaId);
  return { docId, chunks: chunks.length };
}

// ─── Alignment Score ──────────────────────────────────────────────────────────
export async function recalcAlignmentScore(personaId: number): Promise<number> {
  const memories = await getMemoriesByPersona(personaId);
  const byType = memories.reduce((acc, m) => {
    acc[m.memoryType] = (acc[m.memoryType] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = memories.length;
  const knowledgeWeight = (byType["knowledge"] ?? 0) * 1.5;
  const alignmentWeight = (byType["alignment"] ?? 0) * 2;
  const conversationWeight = (byType["conversation"] ?? 0) * 0.5;
  const feedbackWeight = (byType["feedback"] ?? 0) * 1.8;

  const raw = total === 0 ? 0 : Math.min(100, ((knowledgeWeight + alignmentWeight + conversationWeight + feedbackWeight) / (total * 1.5)) * 100);
  const score = Math.round(raw * 10) / 10;

  await updatePersona(personaId, { alignmentScore: score, memoryCount: total });
  return score;
}

// ─── Multi-turn Chat ──────────────────────────────────────────────────────────
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithPersona(
  personaId: number,
  userMessage: string,
  history: ChatMessage[] = [],
  storeMemory = true,
): Promise<{ reply: string; memoriesUsed: number }> {
  const persona = await getPersonaById(personaId);
  if (!persona) throw new Error("Persona not found");

  // Retrieve relevant memories
  const relevantMemories = await searchMemories(personaId, userMessage, 6);

  // Build memory context
  const memoryContext = relevantMemories.length > 0
    ? `\n\n[Relevant memories and knowledge]:\n${relevantMemories.map((m) => `- ${m.memory.content}`).join("\n")}`
    : "";

  const systemPrompt = `${persona.systemPrompt}${memoryContext}

Your personality traits: ${(persona.traits as string[] ?? []).join(", ")}
Always stay in character and draw from your memories when relevant.`;

  const llmMessages = [
    { role: "system" as const, content: systemPrompt },
    ...history.slice(-10).map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: userMessage },
  ];

  const response = await invokeLLM({ messages: llmMessages });
  const rawContent = response.choices?.[0]?.message?.content;
  const reply = typeof rawContent === 'string' ? rawContent : "I'm unable to respond right now.";

  // Store conversation memory
  if (storeMemory) {
    const convText = `User said: "${userMessage}" | I replied: "${reply.slice(0, 200)}"`;
    const embedding = await generateEmbedding(convText);
    await addMemory({
      personaId,
      content: convText,
      embedding,
      memoryType: "conversation",
      importance: 1.0,
      sourceType: "chat",
      metadata: { timestamp: new Date().toISOString() },
    });
  }

  return { reply, memoriesUsed: relevantMemories.length };
}

// ─── Feedback Alignment ───────────────────────────────────────────────────────
export async function feedbackToAlignment(
  personaId: number,
  content: string,
  sourceType: "post" | "comment",
  sourceId: string,
): Promise<void> {
  const embedding = await generateEmbedding(content);
  await addMemory({
    personaId,
    content: `[${sourceType.toUpperCase()} FEEDBACK] ${content}`,
    embedding,
    memoryType: "feedback",
    importance: 1.5,
    sourceType,
    sourceId,
    metadata: { feedbackAt: new Date().toISOString() },
  });
  await recalcAlignmentScore(personaId);
}

// ─── Auto-comment Generation ──────────────────────────────────────────────────
export async function generatePersonaComment(
  persona: Persona,
  postContent: string,
  existingComments: string[] = [],
): Promise<string | null> {
  try {
    const relevantMemories = await searchMemories(persona.id, postContent, 3);
    const memCtx = relevantMemories.map((m) => m.memory.content).join("; ");
    const existingCtx = existingComments.length > 0 ? `\nExisting comments: ${existingComments.slice(-3).join(" | ")}` : "";

    const prompt = `You are ${persona.name}. ${persona.systemPrompt}
Your traits: ${(persona.traits as string[] ?? []).join(", ")}
Your relevant knowledge: ${memCtx || "none"}
${existingCtx}

A post reads: "${postContent.slice(0, 500)}"

Write a short, natural, in-character comment (1-3 sentences). Be genuine and personality-driven. Do NOT start with "I" or be generic.`;

    const response = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
    });
    const rawComment = response.choices?.[0]?.message?.content;
    const comment = typeof rawComment === 'string' ? rawComment.trim() : undefined;
    return comment && comment.length > 5 ? comment : null;
  } catch {
    return null;
  }
}
