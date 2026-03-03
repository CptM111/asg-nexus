import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useI18n } from "@/contexts/I18nContext";
import { toast } from "sonner";
import { Bot, Brain, Globe, Lock, MessageCircle, Plus, Settings, Sparkles, Trash2, Zap } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

function AlignmentRing({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="56" height="56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="oklch(0.22 0.02 265)" strokeWidth="3" />
        <circle cx="28" cy="28" r={r} fill="none" stroke="oklch(0.65 0.22 285)" strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }} />
      </svg>
      <span className="text-[10px] font-bold text-[oklch(0.8_0.15_285)] z-10">{Math.round(pct)}</span>
    </div>
  );
}

function CreatePersonaDialog({ onCreated }: { onCreated: () => void }) {
  const { t, locale } = useI18n();
  const p = t.personas;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [bio, setBio] = useState("");
  const [traitsInput, setTraitsInput] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [autoComment, setAutoComment] = useState(true);
  const [frequency, setFrequency] = useState<"low" | "medium" | "high">("medium");

  const createMutation = trpc.persona.create.useMutation({
    onSuccess: () => {
      toast.success(p.createSuccess);
      setOpen(false);
      setName(""); setSystemPrompt(""); setBio(""); setTraitsInput("");
      onCreated();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!name.trim() || !systemPrompt.trim()) return toast.error(t.common.required);
    const traits = traitsInput.split(",").map((t) => t.trim()).filter(Boolean);
    createMutation.mutate({ name, systemPrompt, traits, bio, isPublic, autoCommentEnabled: autoComment, autoCommentFrequency: frequency });
  };

  const freqLabels = {
    low: locale === "zh" ? "低频 · 精选评论" : "Low · Selective",
    medium: locale === "zh" ? "中频 · 均衡互动" : "Medium · Balanced",
    high: locale === "zh" ? "高频 · 积极参与" : "High · Active",
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0">
          <Plus className="w-4 h-4" /> {p.createBtn}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg bg-[oklch(0.11_0.018_265)] border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[oklch(0.75_0.2_285)]" />
            {p.dialogCreateTitle}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-sm">{p.nameLabel} *</Label>
            <Input placeholder={p.namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} className="bg-input border-border" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">{p.systemPromptLabel} *</Label>
            <Textarea placeholder={p.systemPromptPlaceholder} value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)}
              rows={4} className="bg-input border-border resize-none" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">{p.bioLabel}</Label>
            <Input placeholder={p.bioPlaceholder} value={bio} onChange={(e) => setBio(e.target.value)} className="bg-input border-border" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">{p.traitsLabel}</Label>
            <Input placeholder={p.traitsPlaceholder} value={traitsInput} onChange={(e) => setTraitsInput(e.target.value)} className="bg-input border-border" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
              <div>
                <div className="text-sm font-medium">{locale === "zh" ? "公开分身" : "Public Persona"}</div>
                <div className="text-xs text-muted-foreground">{locale === "zh" ? "其他用户可见" : "Visible to others"}</div>
              </div>
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary border border-border">
              <div>
                <div className="text-sm font-medium">{p.autoComment}</div>
                <div className="text-xs text-muted-foreground">{locale === "zh" ? "参与动态互动" : "Engage in social feed"}</div>
              </div>
              <Switch checked={autoComment} onCheckedChange={setAutoComment} />
            </div>
          </div>
          {autoComment && (
            <div className="space-y-1.5">
              <Label className="text-sm">{locale === "zh" ? "评论频率" : "Auto-Comment Frequency"}</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as any)}>
                <SelectTrigger className="bg-input border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {(["low", "medium", "high"] as const).map((f) => (
                    <SelectItem key={f} value={f}>{freqLabels[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button className="w-full bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0"
            onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? t.common.loading : p.createBtn}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PersonasPage() {
  const { isAuthenticated } = useAuth();
  const { t, locale } = useI18n();
  const p = t.personas;
  const utils = trpc.useUtils();
  const { data: myPersonas, isLoading } = trpc.persona.list.useQuery(undefined, { enabled: isAuthenticated });
  const { data: publicPersonas } = trpc.persona.listPublic.useQuery();
  const deleteMutation = trpc.persona.delete.useMutation({
    onSuccess: () => { toast.success(p.deleteSuccess); utils.persona.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="w-16 h-16 rounded-2xl bg-[oklch(0.65_0.22_285/0.15)] border border-[oklch(0.65_0.22_285/0.3)] flex items-center justify-center">
          <Bot className="w-8 h-8 text-[oklch(0.75_0.2_285)]" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">{p.loginPrompt}</h2>
          <Button className="gap-2 bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0 mt-4"
            onClick={() => { window.location.href = getLoginUrl(); }}>
            {t.common.login}
          </Button>
        </div>
        {publicPersonas && publicPersonas.length > 0 && (
          <div className="w-full max-w-2xl mt-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {locale === "zh" ? "公开分身预览" : "Public Persona Gallery"}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {publicPersonas.slice(0, 4).map((p) => (
                <div key={p.id} className="p-3 rounded-xl border border-border bg-card">
                  <div className="font-medium text-sm">{p.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.bio || p.systemPrompt}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bot className="w-6 h-6 text-[oklch(0.75_0.2_285)]" /> {p.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{p.subtitle}</p>
        </div>
        <CreatePersonaDialog onCreated={() => utils.persona.list.invalidate()} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-2xl shimmer" />)}
        </div>
      ) : myPersonas && myPersonas.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {myPersonas.map((persona) => (
            <div key={persona.id}
              className="group relative p-5 rounded-2xl border border-border bg-card hover:border-[oklch(0.35_0.05_265)] transition-all duration-300 hover:shadow-[0_8px_40px_oklch(0_0_0/0.3)] hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-11 h-11 ring-2 ring-[oklch(0.65_0.22_285/0.3)]">
                    <AvatarFallback className="bg-[oklch(0.65_0.22_285/0.2)] text-[oklch(0.8_0.15_285)] font-semibold">
                      {persona.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold text-sm text-foreground">{persona.name}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {persona.isPublic ? (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-[oklch(0.72_0.18_195/0.3)] text-[oklch(0.72_0.18_195)] bg-[oklch(0.72_0.18_195/0.1)]">
                           <Globe className="w-2.5 h-2.5 mr-0.5" /> {locale === "zh" ? "公开" : "Public"} 
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-border text-muted-foreground">
                           <Lock className="w-2.5 h-2.5 mr-0.5" /> {locale === "zh" ? "私密" : "Private"} 
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <AlignmentRing score={persona.alignmentScore ?? 0} />
              </div>

              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{persona.bio || persona.systemPrompt}</p>

              {persona.traits && (persona.traits as string[]).length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {(persona.traits as string[]).slice(0, 3).map((trait) => (
                    <span key={trait} className="text-[9px] px-2 py-0.5 rounded-full bg-[oklch(0.65_0.22_285/0.1)] border border-[oklch(0.65_0.22_285/0.2)] text-[oklch(0.75_0.15_285)]">
                      {trait}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Brain className="w-3 h-3" /> {persona.memoryCount ?? 0} {p.memoryCount}
                </span>
                {persona.autoCommentEnabled && (
                  <span className="flex items-center gap-1 text-[oklch(0.7_0.18_155)]">
                    <Zap className="w-3 h-3" /> {p.autoComment}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Link href={`/app/personas/${persona.id}`} className="flex-1">
                  <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs border-border hover:border-[oklch(0.65_0.22_285/0.4)]">
                    <Settings className="w-3 h-3" /> {p.detailBtn}
                  </Button>
                </Link>
                <Link href={`/app/chat?personaId=${persona.id}`} className="flex-1">
                  <Button size="sm" className="w-full gap-1.5 text-xs bg-[oklch(0.65_0.22_285/0.2)] hover:bg-[oklch(0.65_0.22_285/0.3)] text-[oklch(0.8_0.15_285)] border-[oklch(0.65_0.22_285/0.3)] border">
                    <MessageCircle className="w-3 h-3" /> {p.chatBtn}
                  </Button>
                </Link>
                <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 px-2"
                  onClick={() => { if (confirm(p.deleteConfirm)) deleteMutation.mutate({ id: persona.id }); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 gap-4 border border-dashed border-border rounded-2xl mb-10">
          <div className="w-14 h-14 rounded-2xl bg-[oklch(0.65_0.22_285/0.1)] border border-[oklch(0.65_0.22_285/0.2)] flex items-center justify-center">
            <Bot className="w-7 h-7 text-[oklch(0.75_0.2_285)]" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-foreground mb-1">{p.emptyTitle}</h3>
            <p className="text-sm text-muted-foreground">{p.emptyDesc}</p>
          </div>
          <CreatePersonaDialog onCreated={() => utils.persona.list.invalidate()} />
        </div>
      )}

      {publicPersonas && publicPersonas.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[oklch(0.72_0.18_195)]" />
            {locale === "zh" ? "公开分身广场" : "Public Persona Gallery"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {publicPersonas.map((persona) => (
              <Link key={persona.id} href={`/app/personas/${persona.id}`}>
                <div className="p-4 rounded-xl border border-border bg-card hover:border-[oklch(0.35_0.05_265)] transition-all cursor-pointer hover:-translate-y-0.5">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-[oklch(0.65_0.22_285/0.15)] text-[oklch(0.8_0.15_285)] text-xs font-semibold">
                        {persona.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{persona.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {persona.memoryCount ?? 0} {p.memoryCount} · {Math.round(persona.alignmentScore ?? 0)} {p.alignmentScore}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{persona.bio || persona.systemPrompt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
