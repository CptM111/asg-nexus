import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/contexts/I18nContext";
import { toast } from "sonner";
import { Bot, Globe, Heart, MessageCircle, Plus, Rss, Send, Sparkles, User, Zap } from "lucide-react";
import { useState } from "react";

function PostCard({ post, onRefresh }: { post: any; onRefresh: () => void }) {
  const { isAuthenticated } = useAuth();
  const { t, locale } = useI18n();
  const f = t.feed;
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const { data: comments } = trpc.feed.comments.useQuery({ postId: post.id }, { enabled: showComments });
  const dateLocale = locale === "zh" ? "zh-CN" : "en-US";

  const likeMutation = trpc.feed.like.useMutation({ onSuccess: onRefresh });
  const commentMutation = trpc.feed.addComment.useMutation({
    onSuccess: () => { setCommentText(""); onRefresh(); },
    onError: (e) => toast.error(e.message),
  });
  const autoCommentMutation = trpc.feed.triggerAutoComments.useMutation({
    onSuccess: (d) => {
      toast.success(f.aiCommentSuccess.replace("{n}", String(d.commentsGenerated)));
      onRefresh();
    },
  });

  return (
    <div className="p-5 rounded-2xl border border-border bg-card hover:border-[oklch(0.3_0.03_265)] transition-all post-card">
      {/* Author */}
      <div className="flex items-start gap-3 mb-4">
        <Avatar className="w-10 h-10 ring-2 ring-border">
          <AvatarFallback className={`text-sm font-semibold ${post.authorType === "persona" ? "bg-[oklch(0.65_0.22_285/0.2)] text-[oklch(0.8_0.15_285)]" : "bg-[oklch(0.72_0.18_195/0.2)] text-[oklch(0.72_0.18_195)]"}`}>
            {post.authorType === "persona" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">
              {post.authorType === "persona"
                ? `${f.authorPersona} #${post.authorId}`
                : `${f.authorUser} #${post.authorId}`}
            </span>
            {post.authorType === "persona" && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-[oklch(0.65_0.22_285/0.3)] text-[oklch(0.75_0.15_285)] bg-[oklch(0.65_0.22_285/0.1)]">
                <Bot className="w-2.5 h-2.5 mr-0.5" /> {f.authorPersona}
              </Badge>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {new Date(post.createdAt).toLocaleString(dateLocale)}
          </div>
        </div>
        <Badge variant="outline" className="text-[9px] px-1.5 shrink-0 border-border text-muted-foreground">
          <Globe className="w-2.5 h-2.5 mr-0.5" /> {post.visibility}
        </Badge>
      </div>

      {/* Content */}
      <p className="text-sm text-foreground/90 leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>

      {/* Tags */}
      {post.tags && (post.tags as string[]).length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {(post.tags as string[]).map((tag: string) => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[oklch(0.72_0.18_195/0.1)] border border-[oklch(0.72_0.18_195/0.2)] text-[oklch(0.72_0.18_195)]">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-border/50">
        <button onClick={() => isAuthenticated && likeMutation.mutate({ postId: post.id })}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[oklch(0.68_0.2_15)] transition-colors">
          <Heart className="w-4 h-4" />
          <span>{post.likeCount ?? 0}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[oklch(0.72_0.18_195)] transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span>{post.commentCount ?? 0} {f.commentBtn}</span>
        </button>
        {isAuthenticated && (
          <button onClick={() => autoCommentMutation.mutate({ postId: post.id })}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[oklch(0.65_0.22_285)] transition-colors ml-auto"
            title={f.aiCommentBtn}>
            <Zap className="w-4 h-4" />
            <span>{f.aiCommentBtn}</span>
          </button>
        )}
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-4 space-y-3">
          {comments?.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarFallback className={`text-[10px] font-semibold ${c.authorType === "persona" ? "bg-[oklch(0.65_0.22_285/0.2)] text-[oklch(0.8_0.15_285)]" : "bg-[oklch(0.72_0.18_195/0.15)] text-[oklch(0.72_0.18_195)]"}`}>
                  {c.authorType === "persona" ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 bg-secondary rounded-xl px-3 py-2">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-medium text-foreground">
                    {c.authorType === "persona" ? `${f.authorPersona} #${c.authorId}` : `${f.authorUser} #${c.authorId}`}
                  </span>
                  {c.isAiGenerated && (
                    <Badge variant="outline" className="text-[8px] px-1 py-0 border-[oklch(0.65_0.22_285/0.3)] text-[oklch(0.75_0.15_285)]">
                      <Sparkles className="w-2 h-2 mr-0.5" /> {f.aiGeneratedBadge}
                    </Badge>
                  )}
                  <span className="text-[9px] text-muted-foreground ml-auto">
                    {new Date(c.createdAt).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs text-foreground/80">{c.content}</p>
              </div>
            </div>
          ))}

          {isAuthenticated && (
            <div className="flex gap-2 mt-2">
              <Input placeholder={f.commentPlaceholder} value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && commentText.trim()) {
                    e.preventDefault();
                    commentMutation.mutate({ postId: post.id, content: commentText.trim() });
                  }
                }}
                className="bg-input border-border text-sm h-9" />
              <Button size="sm"
                className="h-9 px-3 bg-[oklch(0.65_0.22_285/0.2)] hover:bg-[oklch(0.65_0.22_285/0.3)] text-[oklch(0.8_0.15_285)] border-[oklch(0.65_0.22_285/0.3)] border"
                onClick={() => { if (commentText.trim()) commentMutation.mutate({ postId: post.id, content: commentText.trim() }); }}
                disabled={commentMutation.isPending}>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreatePostDialog({ onCreated }: { onCreated: () => void }) {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const f = t.feed;
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [visibility, setVisibility] = useState<"public" | "friends" | "private">("public");
  const [authorType, setAuthorType] = useState<"user" | "persona">("user");
  const [personaId, setPersonaId] = useState<number | undefined>();
  const { data: myPersonas } = trpc.persona.list.useQuery(undefined, { enabled: isAuthenticated });

  const createMutation = trpc.feed.create.useMutation({
    onSuccess: () => { toast.success(f.publishSuccess); setOpen(false); setContent(""); setTags(""); onCreated(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0">
          <Plus className="w-4 h-4" /> {f.publishBtn}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-[oklch(0.11_0.018_265)] border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rss className="w-5 h-5 text-[oklch(0.75_0.2_285)]" />
            {f.createDialogTitle}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {myPersonas && myPersonas.length > 0 && (
            <div className="flex gap-2">
              <Button size="sm" variant={authorType === "user" ? "default" : "outline"}
                onClick={() => setAuthorType("user")}
                className={authorType === "user" ? "bg-[oklch(0.65_0.22_285/0.3)] text-[oklch(0.8_0.15_285)] border-[oklch(0.65_0.22_285/0.4)]" : "border-border"}>
                <User className="w-3.5 h-3.5 mr-1.5" /> {f.asUserBtn}
              </Button>
              <Button size="sm" variant={authorType === "persona" ? "default" : "outline"}
                onClick={() => setAuthorType("persona")}
                className={authorType === "persona" ? "bg-[oklch(0.65_0.22_285/0.3)] text-[oklch(0.8_0.15_285)] border-[oklch(0.65_0.22_285/0.4)]" : "border-border"}>
                <Bot className="w-3.5 h-3.5 mr-1.5" /> {f.asPersonaBtn}
              </Button>
            </div>
          )}
          {authorType === "persona" && myPersonas && (
            <Select value={personaId?.toString()} onValueChange={(v) => setPersonaId(parseInt(v))}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder={f.selectPersonaPlaceholder} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {myPersonas.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Textarea placeholder={f.contentPlaceholder} value={content}
            onChange={(e) => setContent(e.target.value)} rows={5} className="bg-input border-border resize-none" />
          <Input placeholder={f.tagsPlaceholder} value={tags}
            onChange={(e) => setTags(e.target.value)} className="bg-input border-border" />
          <Select value={visibility} onValueChange={(v) => setVisibility(v as any)}>
            <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="public">{f.visibilityPublic}</SelectItem>
              <SelectItem value="friends">{f.visibilityFriends}</SelectItem>
              <SelectItem value="private">{f.visibilityPrivate}</SelectItem>
            </SelectContent>
          </Select>
          <Button className="w-full bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0"
            onClick={() => {
              if (!content.trim()) return toast.error(f.contentRequired);
              const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
              createMutation.mutate({ content, tags: tagList, visibility, authorType, personaId });
            }}
            disabled={createMutation.isPending}>
            {createMutation.isPending ? f.publishingBtn : f.publishBtn}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function FeedPage() {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const f = t.feed;
  const { data: posts, isLoading, refetch } = trpc.feed.list.useQuery({ limit: 30, offset: 0 });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Rss className="w-6 h-6 text-[oklch(0.68_0.2_15)]" /> {f.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{f.subtitle}</p>
        </div>
        {isAuthenticated ? (
          <CreatePostDialog onCreated={() => refetch()} />
        ) : (
          <Button className="gap-2 bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0"
            onClick={() => { window.location.href = getLoginUrl(); }}>
            {f.loginBtn}
          </Button>
        )}
      </div>

      {/* AI Auto-comment Banner */}
      <div className="mb-6 p-4 rounded-xl border border-[oklch(0.65_0.22_285/0.3)] bg-[oklch(0.65_0.22_285/0.05)] flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-[oklch(0.75_0.2_285)] shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-medium text-foreground mb-0.5">{f.autoCommentBanner}</div>
          <div className="text-xs text-muted-foreground">{f.autoCommentDesc}</div>
        </div>
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 rounded-2xl shimmer" />)}
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onRefresh={() => refetch()} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-4 border border-dashed border-border rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[oklch(0.65_0.22_285/0.1)] border border-[oklch(0.65_0.22_285/0.2)] flex items-center justify-center">
            <Rss className="w-7 h-7 text-[oklch(0.75_0.2_285)]" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-foreground mb-1">{f.emptyTitle}</h3>
            <p className="text-sm text-muted-foreground">{f.emptyDesc}</p>
          </div>
          {isAuthenticated && <CreatePostDialog onCreated={() => refetch()} />}
        </div>
      )}
    </div>
  );
}
