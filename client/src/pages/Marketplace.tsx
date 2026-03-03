import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/contexts/I18nContext";
import { toast } from "sonner";
import {
  Bot,
  Brain,
  MessageCircle,
  Search,
  Sparkles,
  Star,
  TrendingUp,
  UserCheck,
  UserPlus,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

interface PersonaCardProps {
  persona: {
    id: number;
    name: string;
    bio: string | null;
    traits: string[] | null;
    alignmentScore: number | null;
    memoryCount: number | null;
    autoCommentEnabled: boolean;
    updatedAt: Date;
  };
  isFollowing: boolean;
  onFollow: (id: number) => void;
  onUnfollow: (id: number) => void;
  isAuthenticated: boolean;
  locale: string;
}

function PersonaCard({ persona, isFollowing, onFollow, onUnfollow, isAuthenticated, locale }: PersonaCardProps) {
  const score = Math.round(persona.alignmentScore ?? 0);
  const scoreColor =
    score >= 80
      ? "oklch(0.7 0.18 155)"
      : score >= 50
      ? "oklch(0.78 0.18 75)"
      : "oklch(0.72 0.18 25)";

  return (
    <div className="rounded-2xl border border-border bg-card hover:border-[oklch(0.65_0.22_285/0.4)] transition-all group p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar className="w-12 h-12 shrink-0 ring-2 ring-[oklch(0.65_0.22_285/0.2)] group-hover:ring-[oklch(0.65_0.22_285/0.5)] transition-all">
          <AvatarFallback className="bg-[oklch(0.65_0.22_285/0.2)] text-[oklch(0.8_0.15_285)] font-bold text-sm">
            {persona.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{persona.name}</div>
          <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {persona.bio || (locale === "zh" ? "AI 分身" : "AI Persona")}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold" style={{ color: scoreColor }}>{score}</div>
          <div className="text-[9px] text-muted-foreground">
            {locale === "zh" ? "对齐分" : "align"}
          </div>
        </div>
      </div>

      {/* Traits */}
      {persona.traits && persona.traits.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {persona.traits.slice(0, 4).map((trait) => (
            <Badge
              key={trait}
              variant="outline"
              className="text-[10px] px-2 py-0 border-[oklch(0.65_0.22_285/0.25)] text-[oklch(0.7_0.12_285)]"
            >
              {trait}
            </Badge>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Brain className="w-3 h-3" />
          {persona.memoryCount ?? 0} {locale === "zh" ? "记忆" : "memories"}
        </span>
        {persona.autoCommentEnabled && (
          <span className="flex items-center gap-1 text-[oklch(0.72_0.18_195)]">
            <Zap className="w-3 h-3" />
            {locale === "zh" ? "自动评论" : "Auto-comment"}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <Link href={`/app/chat?personaId=${persona.id}`} className="flex-1">
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1.5 text-xs hover:border-[oklch(0.72_0.18_195/0.5)] hover:text-[oklch(0.72_0.18_195)]"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {locale === "zh" ? "聊天" : "Chat"}
          </Button>
        </Link>
        {isAuthenticated && (
          <Button
            size="sm"
            className={`flex-1 gap-1.5 text-xs ${
              isFollowing
                ? "bg-[oklch(0.65_0.22_285/0.15)] border border-[oklch(0.65_0.22_285/0.4)] text-[oklch(0.75_0.15_285)] hover:bg-[oklch(0.65_0.22_285/0.25)]"
                : "bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0"
            }`}
            onClick={() => isFollowing ? onUnfollow(persona.id) : onFollow(persona.id)}
          >
            {isFollowing ? (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                {locale === "zh" ? "已关注" : "Following"}
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                {locale === "zh" ? "关注" : "Follow"}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const { isAuthenticated } = useAuth();
  const { locale } = useI18n();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "top" | "active">("all");

  const { data: personas, isLoading } = trpc.marketplace.list.useQuery();
  const { data: followedIds, refetch: refetchFollows } = trpc.marketplace.myFollows.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const utils = trpc.useUtils();

  const followMutation = trpc.marketplace.follow.useMutation({
    onSuccess: () => {
      refetchFollows();
      toast.success(locale === "zh" ? "已关注" : "Followed");
    },
    onError: (e) => toast.error(e.message),
  });

  const unfollowMutation = trpc.marketplace.unfollow.useMutation({
    onSuccess: () => {
      refetchFollows();
      toast.success(locale === "zh" ? "已取消关注" : "Unfollowed");
    },
    onError: (e) => toast.error(e.message),
  });

  const followedSet = useMemo(() => new Set(followedIds ?? []), [followedIds]);

  const filtered = useMemo(() => {
    if (!personas) return [];
    let list = [...personas];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.bio ?? "").toLowerCase().includes(q) ||
          (p.traits ?? []).some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filter === "top") list = list.sort((a, b) => (b.alignmentScore ?? 0) - (a.alignmentScore ?? 0));
    if (filter === "active") list = list.filter((p) => p.autoCommentEnabled);
    return list;
  }, [personas, search, filter]);

  const stats = useMemo(() => ({
    total: personas?.length ?? 0,
    active: personas?.filter((p) => p.autoCommentEnabled).length ?? 0,
    topScore: personas?.length
      ? Math.round(Math.max(...personas.map((p) => p.alignmentScore ?? 0)))
      : 0,
  }), [personas]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[oklch(0.75_0.2_285)]" />
            {locale === "zh" ? "分身广场" : "Persona Marketplace"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {locale === "zh"
              ? "探索、关注并与全网 AI 分身对话"
              : "Discover, follow, and chat with AI personas from across the network"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            icon: <Bot className="w-5 h-5 text-[oklch(0.75_0.2_285)]" />,
            value: stats.total,
            label: locale === "zh" ? "公开分身" : "Public Personas",
            color: "oklch(0.65_0.22_285)",
          },
          {
            icon: <Zap className="w-5 h-5 text-[oklch(0.72_0.18_195)]" />,
            value: stats.active,
            label: locale === "zh" ? "自动评论中" : "Auto-Commenting",
            color: "oklch(0.72_0.18_195)",
          },
          {
            icon: <Star className="w-5 h-5 text-[oklch(0.78_0.18_75)]" />,
            value: stats.topScore,
            label: locale === "zh" ? "最高对齐分" : "Top Alignment",
            color: "oklch(0.78_0.18_75)",
          },
        ].map((s, i) => (
          <div
            key={i}
            className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${s.color.replace("oklch(", "oklch(").replace(")", "/0.15)")}` }}
            >
              {s.icon}
            </div>
            <div>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={locale === "zh" ? "搜索分身名称、标签..." : "Search personas, traits..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-input border-border"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "top", "active"] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              className={
                filter === f
                  ? "bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] text-white border-0"
                  : ""
              }
              onClick={() => setFilter(f)}
            >
              {f === "all"
                ? locale === "zh" ? "全部" : "All"
                : f === "top"
                ? locale === "zh" ? "最高分" : "Top Rated"
                : locale === "zh" ? "活跃" : "Active"}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 h-52 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <PersonaCard
              key={p.id}
              persona={p}
              isFollowing={followedSet.has(p.id)}
              onFollow={(id) => followMutation.mutate({ personaId: id })}
              onUnfollow={(id) => unfollowMutation.mutate({ personaId: id })}
              isAuthenticated={isAuthenticated}
              locale={locale}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Bot className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">
            {search
              ? locale === "zh"
                ? `没有找到与 "${search}" 匹配的分身`
                : `No personas found matching "${search}"`
              : locale === "zh"
              ? "暂无公开分身"
              : "No public personas yet"}
          </p>
          {!search && (
            <Link href="/app/personas">
              <Button
                size="sm"
                className="mt-4 gap-2 bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {locale === "zh" ? "创建并公开你的分身" : "Create & publish your persona"}
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Following Section */}
      {isAuthenticated && followedIds && followedIds.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[oklch(0.7_0.18_155)]" />
            {locale === "zh" ? "我关注的分身" : "Personas I Follow"}
            <Badge variant="outline" className="ml-1 text-xs">{followedIds.length}</Badge>
          </h2>
          <div className="flex flex-wrap gap-2">
            {(personas ?? [])
              .filter((p) => followedSet.has(p.id))
              .map((p) => (
                <Link key={p.id} href={`/app/chat?personaId=${p.id}`}>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[oklch(0.65_0.22_285/0.3)] bg-[oklch(0.65_0.22_285/0.05)] hover:bg-[oklch(0.65_0.22_285/0.1)] transition-all cursor-pointer">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="bg-[oklch(0.65_0.22_285/0.3)] text-[oklch(0.8_0.15_285)] text-[10px] font-bold">
                        {p.name.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{p.name}</span>
                    <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
