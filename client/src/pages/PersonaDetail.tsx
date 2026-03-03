import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  ArrowLeft, Brain, FileText, MessageCircle, Plus, Sparkles, Upload, Zap,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";

function AlignmentRing({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="oklch(0.22 0.02 265)" strokeWidth="4" />
        <circle cx="48" cy="48" r={r} fill="none" stroke="oklch(0.65 0.22 285)" strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease", filter: "drop-shadow(0 0 8px oklch(0.65 0.22 285 / 0.5))" }} />
      </svg>
      <div className="text-center z-10">
        <div className="text-xl font-bold text-[oklch(0.8_0.15_285)]">{Math.round(pct)}</div>
        <div className="text-[9px] text-muted-foreground">对齐分</div>
      </div>
    </div>
  );
}

export default function PersonaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const personaId = parseInt(id ?? "0");
  const { isAuthenticated, user } = useAuth();

  const { data: persona, refetch } = trpc.persona.get.useQuery({ id: personaId });
  const { data: memories } = trpc.persona.memories.useQuery({ personaId }, { enabled: !!personaId });
  const { data: docs } = trpc.persona.knowledgeDocs.useQuery({ personaId }, { enabled: !!personaId && isAuthenticated });
  const { data: alignData } = trpc.persona.alignmentScore.useQuery({ personaId }, { enabled: !!personaId });

  const [knowledgeTitle, setKnowledgeTitle] = useState("");
  const [knowledgeContent, setKnowledgeContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const ingestMutation = trpc.persona.ingestKnowledge.useMutation({
    onSuccess: (data) => {
      toast.success(`知识导入成功！共生成 ${data.chunks} 个记忆块`);
      setKnowledgeTitle(""); setKnowledgeContent("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const { data: searchResults } = trpc.persona.searchMemories.useQuery(
    { personaId, query: searchQuery },
    { enabled: searchQuery.length > 2 }
  );

  if (!persona) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  const isOwner = isAuthenticated && user;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/app/personas">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground mb-6 -ml-2">
          <ArrowLeft className="w-4 h-4" /> 返回分身列表
        </Button>
      </Link>

      {/* Profile Header */}
      <div className="flex items-start gap-6 mb-8 p-6 rounded-2xl border border-border bg-card">
        <Avatar className="w-16 h-16 ring-2 ring-[oklch(0.65_0.22_285/0.3)]">
          <AvatarFallback className="bg-[oklch(0.65_0.22_285/0.2)] text-[oklch(0.8_0.15_285)] text-xl font-bold">
            {persona.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{persona.name}</h1>
              <p className="text-muted-foreground text-sm mt-1">{persona.bio || "No bio"}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(persona.traits as string[] ?? []).map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-[oklch(0.65_0.22_285/0.1)] border border-[oklch(0.65_0.22_285/0.2)] text-[oklch(0.75_0.15_285)]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <AlignmentRing score={alignData?.score ?? persona.alignmentScore ?? 0} />
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Link href={`/app/chat?personaId=${persona.id}`}>
            <Button size="sm" className="gap-2 bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0 w-full">
              <MessageCircle className="w-4 h-4" /> 开始对话
            </Button>
          </Link>
          <div className="text-center text-xs text-muted-foreground">
            {alignData?.memoryCount ?? persona.memoryCount ?? 0} 条记忆
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="memories">
        <TabsList className="bg-secondary border border-border mb-6">
          <TabsTrigger value="memories" className="gap-2 data-[state=active]:bg-[oklch(0.65_0.22_285/0.2)] data-[state=active]:text-[oklch(0.8_0.15_285)]">
            <Brain className="w-4 h-4" /> 记忆库 ({memories?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-2 data-[state=active]:bg-[oklch(0.65_0.22_285/0.2)] data-[state=active]:text-[oklch(0.8_0.15_285)]">
            <FileText className="w-4 h-4" /> 知识文档 ({docs?.length ?? 0})
          </TabsTrigger>
          {isOwner && (
            <TabsTrigger value="ingest" className="gap-2 data-[state=active]:bg-[oklch(0.65_0.22_285/0.2)] data-[state=active]:text-[oklch(0.8_0.15_285)]">
              <Upload className="w-4 h-4" /> 导入知识
            </TabsTrigger>
          )}
          <TabsTrigger value="search" className="gap-2 data-[state=active]:bg-[oklch(0.65_0.22_285/0.2)] data-[state=active]:text-[oklch(0.8_0.15_285)]">
            <Sparkles className="w-4 h-4" /> 语义搜索
          </TabsTrigger>
        </TabsList>

        {/* Memories Tab */}
        <TabsContent value="memories">
          <div className="space-y-3">
            {memories && memories.length > 0 ? memories.slice(0, 30).map((m) => (
              <div key={m.id} className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0" style={{
                    borderColor: m.memoryType === "knowledge" ? "oklch(0.65 0.22 285 / 0.4)" : m.memoryType === "conversation" ? "oklch(0.72 0.18 195 / 0.4)" : "oklch(0.78 0.18 75 / 0.4)",
                    color: m.memoryType === "knowledge" ? "oklch(0.75 0.15 285)" : m.memoryType === "conversation" ? "oklch(0.72 0.18 195)" : "oklch(0.78 0.18 75)",
                  }}>
                    {m.memoryType}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">重要度 {m.importance?.toFixed(1)}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{new Date(m.createdAt).toLocaleDateString("zh-CN")}</span>
                </div>
                <p className="text-sm text-foreground/80 line-clamp-3">{m.content}</p>
              </div>
            )) : (
              <div className="text-center py-12 text-muted-foreground">
                <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>暂无记忆，开始对话或导入知识以建立记忆库</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Knowledge Docs Tab */}
        <TabsContent value="knowledge">
          <div className="space-y-3">
            {docs && docs.length > 0 ? docs.map((doc) => (
              <div key={doc.id} className="p-4 rounded-xl border border-border bg-card flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm mb-1">{doc.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{doc.content.slice(0, 200)}</div>
                </div>
                <div className="shrink-0 text-right">
                  <Badge variant="outline" className={`text-[9px] px-1.5 ${doc.status === "done" ? "border-[oklch(0.7_0.18_155/0.4)] text-[oklch(0.7_0.18_155)]" : "border-border text-muted-foreground"}`}>
                    {doc.status === "done" ? `✓ ${doc.chunkCount} 块` : doc.status}
                  </Badge>
                  <div className="text-[10px] text-muted-foreground mt-1">{new Date(doc.createdAt).toLocaleDateString("zh-CN")}</div>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>暂无知识文档，前往「导入知识」标签页添加</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Ingest Tab */}
        {isOwner && (
          <TabsContent value="ingest">
            <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="w-5 h-5 text-[oklch(0.75_0.2_285)]" />
                <h3 className="font-semibold">导入知识到分身记忆库</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                粘贴文章、文档、研究报告等文本内容，系统将自动分块、向量化并存储为分身的知识记忆，提升对齐分数。
              </p>
              <div className="space-y-1.5">
                <Label className="text-sm">知识标题</Label>
                <Input
                  placeholder="例如：量子纠缠研究综述 2024"
                  value={knowledgeTitle}
                  onChange={(e) => setKnowledgeTitle(e.target.value)}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">知识内容</Label>
                <Textarea
                  placeholder="粘贴文章、文档或任何文本内容..."
                  value={knowledgeContent}
                  onChange={(e) => setKnowledgeContent(e.target.value)}
                  rows={10}
                  className="bg-input border-border resize-none font-mono text-xs"
                />
                <div className="text-xs text-muted-foreground text-right">{knowledgeContent.length} 字符</div>
              </div>
              <Button
                className="w-full gap-2 bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0"
                onClick={() => {
                  if (!knowledgeTitle.trim() || !knowledgeContent.trim()) return toast.error("请填写标题和内容");
                  ingestMutation.mutate({ personaId, title: knowledgeTitle, content: knowledgeContent });
                }}
                disabled={ingestMutation.isPending}
              >
                <Zap className="w-4 h-4" />
                {ingestMutation.isPending ? "向量化处理中..." : "导入知识并对齐"}
              </Button>
            </div>
          </TabsContent>
        )}

        {/* Semantic Search Tab */}
        <TabsContent value="search">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">语义搜索记忆</Label>
              <Input
                placeholder="输入关键词或问题，搜索语义相关的记忆..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            {searchResults && searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((m: any) => (
                  <div key={m.id} className="p-4 rounded-xl border border-[oklch(0.65_0.22_285/0.2)] bg-[oklch(0.65_0.22_285/0.05)]">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-[9px] px-1.5 border-[oklch(0.65_0.22_285/0.4)] text-[oklch(0.75_0.15_285)]">
                        相似度 {(m.score * 100).toFixed(0)}%
                      </Badge>
                      <Badge variant="outline" className="text-[9px] px-1.5">{m.memoryType}</Badge>
                    </div>
                    <p className="text-sm text-foreground/80">{m.content}</p>
                  </div>
                ))}
              </div>
            ) : searchQuery.length > 2 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">未找到相关记忆</div>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
