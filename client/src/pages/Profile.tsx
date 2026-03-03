import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/contexts/I18nContext";
import { toast } from "sonner";
import {
  Bot,
  Brain,
  Camera,
  Edit3,
  Lock,
  Save,
  Shield,
  Sparkles,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "wouter";

function AlignmentBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color =
    pct >= 80
      ? "oklch(0.7 0.18 155)"
      : pct >= 50
      ? "oklch(0.78 0.18 75)"
      : "oklch(0.72 0.18 25)";
  return (
    <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: `oklch(${color.slice(7, -1)})` }}
      />
    </div>
  );
}

export default function ProfilePage() {
  const { isAuthenticated, user: authUser } = useAuth();
  const { t, locale } = useI18n();
  const utils = trpc.useUtils();

  const { data: profile, isLoading } = trpc.user.me.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: alignmentHistory } = trpc.user.alignmentHistory.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success(locale === "zh" ? "资料已更新" : "Profile updated");
      utils.user.me.invalidate();
      setEditing(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const avatarMutation = trpc.user.uploadAvatar.useMutation({
    onSuccess: (data) => {
      toast.success(locale === "zh" ? "头像已上传" : "Avatar uploaded");
      utils.user.me.invalidate();
      setAvatarPreview(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleEditStart = () => {
    setName(profile?.name ?? "");
    setBio(profile?.bio ?? "");
    setEditing(true);
  };

  const handleSave = () => {
    if (!name.trim()) return toast.error(locale === "zh" ? "名称不能为空" : "Name is required");
    updateMutation.mutate({ name: name.trim(), bio: bio.trim() });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(locale === "zh" ? "图片不能超过 5MB" : "Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAvatarPreview(dataUrl);
      avatarMutation.mutate({ dataUrl });
    };
    reader.readAsDataURL(file);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="w-16 h-16 rounded-2xl bg-[oklch(0.65_0.22_285/0.15)] border border-[oklch(0.65_0.22_285/0.3)] flex items-center justify-center">
          <User className="w-8 h-8 text-[oklch(0.75_0.2_285)]" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            {locale === "zh" ? "登录后查看个人资料" : "Sign in to view your profile"}
          </h2>
          <Button
            className="gap-2 bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0 mt-4"
            onClick={() => { window.location.href = getLoginUrl(); }}
          >
            {t.common.login}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-[oklch(0.65_0.22_285)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const displayName = profile?.name ?? authUser?.name ?? "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const totalPersonas = alignmentHistory?.length ?? 0;
  const avgAlignment =
    totalPersonas > 0
      ? Math.round(
          (alignmentHistory ?? []).reduce((s, p) => s + (p.alignmentScore ?? 0), 0) / totalPersonas
        )
      : 0;
  const totalMemories = (alignmentHistory ?? []).reduce(
    (s, p) => s + (p.memoryCount ?? 0),
    0
  );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Profile Card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar className="w-20 h-20 ring-2 ring-[oklch(0.65_0.22_285/0.3)]">
              <AvatarImage src={avatarPreview ?? profile?.avatar ?? undefined} />
              <AvatarFallback className="bg-[oklch(0.65_0.22_285/0.2)] text-[oklch(0.8_0.15_285)] text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarMutation.isPending}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[oklch(0.65_0.22_285)] hover:opacity-90 flex items-center justify-center transition-opacity"
              title={locale === "zh" ? "更换头像" : "Change avatar"}
            >
              {avatarMutation.isPending ? (
                <div className="w-3 h-3 rounded-full border border-white border-t-transparent animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {locale === "zh" ? "显示名称" : "Display Name"}
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-input border-border h-9 text-sm"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {locale === "zh" ? "个人简介" : "Bio"}
                  </Label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bg-input border-border resize-none text-sm"
                    rows={2}
                    maxLength={500}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5 bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0"
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                  >
                    <Save className="w-3.5 h-3.5" />
                    {updateMutation.isPending
                      ? locale === "zh" ? "保存中..." : "Saving..."
                      : locale === "zh" ? "保存" : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    onClick={() => setEditing(false)}
                  >
                    <X className="w-3.5 h-3.5" />
                    {locale === "zh" ? "取消" : "Cancel"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-bold">{displayName}</h1>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 gap-1 text-xs"
                    onClick={handleEditStart}
                  >
                    <Edit3 className="w-3 h-3" />
                    {locale === "zh" ? "编辑" : "Edit"}
                  </Button>
                </div>
                {profile?.bio ? (
                  <p className="text-sm text-muted-foreground mb-3">{profile.bio}</p>
                ) : (
                  <p className="text-sm text-muted-foreground/50 mb-3 italic">
                    {locale === "zh" ? "暂无简介" : "No bio yet"}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] gap-1 border-[oklch(0.65_0.22_285/0.3)] text-[oklch(0.75_0.15_285)]">
                    <Shield className="w-3 h-3" /> ASG Member
                  </Badge>
                  {profile?.role === "admin" && (
                    <Badge className="text-[10px] bg-[oklch(0.78_0.18_75/0.2)] text-[oklch(0.78_0.18_75)] border border-[oklch(0.78_0.18_75/0.3)]">
                      Admin
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {locale === "zh" ? "加入于" : "Joined"}{" "}
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString(
                          locale === "zh" ? "zh-CN" : "en-US",
                          { year: "numeric", month: "long" }
                        )
                      : "—"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-[oklch(0.75_0.2_285)]">{totalPersonas}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {locale === "zh" ? "AI 分身" : "AI Personas"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[oklch(0.72_0.18_195)]">{totalMemories}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {locale === "zh" ? "记忆条目" : "Memory Entries"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[oklch(0.7_0.18_155)]">{avgAlignment}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {locale === "zh" ? "平均对齐分" : "Avg. Alignment"}
            </div>
          </div>
        </div>
      </div>

      {/* Alignment History */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[oklch(0.7_0.18_155)]" />
          {locale === "zh" ? "分身对齐历史" : "Persona Alignment History"}
        </h2>
        {alignmentHistory && alignmentHistory.length > 0 ? (
          <div className="space-y-4">
            {alignmentHistory.map((p) => (
              <Link key={p.id} href={`/app/personas/${p.id}`}>
                <div className="p-4 rounded-xl border border-border hover:border-[oklch(0.65_0.22_285/0.4)] bg-secondary/30 hover:bg-[oklch(0.65_0.22_285/0.05)] transition-all cursor-pointer group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[oklch(0.65_0.22_285/0.2)] flex items-center justify-center">
                        <Bot className="w-4 h-4 text-[oklch(0.75_0.2_285)]" />
                      </div>
                      <div>
                        <div className="font-medium text-sm group-hover:text-[oklch(0.8_0.15_285)] transition-colors">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {p.memoryCount ?? 0} {locale === "zh" ? "条记忆" : "memories"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold" style={{
                        color: (p.alignmentScore ?? 0) >= 80
                          ? "oklch(0.7 0.18 155)"
                          : (p.alignmentScore ?? 0) >= 50
                          ? "oklch(0.78 0.18 75)"
                          : "oklch(0.72 0.18 25)",
                      }}>
                        {Math.round(p.alignmentScore ?? 0)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {locale === "zh" ? "对齐分" : "alignment"}
                      </div>
                    </div>
                  </div>
                  <AlignmentBar score={p.alignmentScore ?? 0} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {locale === "zh"
                ? "还没有 AI 分身，去创建第一个吧"
                : "No personas yet — create your first AI persona"}
            </p>
            <Link href="/app/personas">
              <Button
                size="sm"
                className="mt-4 gap-2 bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {locale === "zh" ? "创建分身" : "Create Persona"}
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Security Info */}
      <div className="rounded-2xl border border-[oklch(0.65_0.22_285/0.2)] bg-[oklch(0.65_0.22_285/0.04)] p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.65_0.22_285/0.15)] flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-[oklch(0.75_0.2_285)]" />
          </div>
          <div>
            <div className="font-medium text-sm">
              {locale === "zh" ? "隐私与安全" : "Privacy & Security"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {locale === "zh"
                ? "您的所有聊天消息均经过 AES-256-GCM 端到端加密，ASG 安全防火墙实时保护您的 AI 分身。"
                : "All your chat messages are AES-256-GCM end-to-end encrypted. The ASG security firewall protects your AI personas in real time."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
