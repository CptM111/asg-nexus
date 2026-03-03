import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/contexts/I18nContext";
import {
  ArrowRight, Bot, Brain, GitBranch, Lock, MessageCircle,
  Rss, Shield, Sparkles, Star, Zap,
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const h = t.home;

  const FEATURES = [
    { icon: Bot,        key: "persona",   color: "oklch(0.65 0.22 285)", badge: "Core" },
    { icon: Brain,      key: "memory",    color: "oklch(0.72 0.18 195)", badge: "Memory" },
    { icon: Lock,       key: "chat",      color: "oklch(0.7 0.18 155)",  badge: "E2E" },
    { icon: Rss,        key: "feed",      color: "oklch(0.68 0.2 15)",   badge: "Social" },
    { icon: Zap,        key: "alignment", color: "oklch(0.78 0.18 75)",  badge: "Alignment" },
    { icon: GitBranch,  key: "graph",     color: "oklch(0.72 0.18 195)", badge: "Graph" },
    { icon: Shield,     key: "security",  color: "oklch(0.7 0.18 155)",  badge: "Security" },
    { icon: Star,       key: "rag",       color: "oklch(0.65 0.22 285)", badge: "RAG" },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[oklch(0.65_0.22_285)] to-[oklch(0.72_0.18_195)] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">ASG Nexus</span>
            <Badge variant="outline" className="text-[10px] border-[oklch(0.65_0.22_285/0.4)] text-[oklch(0.75_0.15_285)] hidden sm:flex">
              v2.1.0
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/app/personas">
                <Button className="gap-2 bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0">
                  {t.common.enterPlatform} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Button
                className="gap-2 bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0"
                onClick={() => { window.location.href = getLoginUrl(); }}
              >
                {t.common.getStarted} <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-[oklch(0.65_0.22_285/0.08)] blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-80 h-80 rounded-full bg-[oklch(0.72_0.18_195/0.06)] blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-[oklch(0.65_0.22_285/0.04)] blur-[80px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <Badge
            className="mb-6 inline-flex gap-1.5 px-4 py-1.5 text-xs border-[oklch(0.65_0.22_285/0.4)] bg-[oklch(0.65_0.22_285/0.1)] text-[oklch(0.8_0.15_285)]"
            variant="outline"
          >
            <Sparkles className="w-3 h-3" />
            {h.badge}
          </Badge>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            <span className="text-foreground">{h.heroTitle1}</span>
            <br />
            <span style={{
              background: "linear-gradient(135deg, oklch(0.65 0.22 285), oklch(0.72 0.18 195))",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              {h.heroTitle2}
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {h.heroSubtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/app/personas">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0 px-8 h-12 text-base">
                  <Bot className="w-5 h-5" /> {h.ctaCreate}
                </Button>
              </Link>
            ) : (
              <Button size="lg" className="gap-2 bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0 px-8 h-12 text-base"
                onClick={() => { window.location.href = getLoginUrl(); }}>
                <Bot className="w-5 h-5" /> {h.ctaFree}
              </Button>
            )}
            <Link href="/app/feed">
              <Button size="lg" variant="outline" className="gap-2 border-border hover:border-[oklch(0.65_0.22_285/0.5)] h-12 text-base px-8">
                <Rss className="w-5 h-5" /> {h.ctaFeed}
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: "E2E", label: h.statE2E },
              { value: "∞",   label: h.statMemory },
              { value: "ASG", label: h.statASG },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-3">{h.featuresTitle}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{h.featuresSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, key, color, badge }) => {
              const feat = h.features[key];
              return (
                <div key={key}
                  className="group relative p-5 rounded-2xl border border-border bg-card hover:border-[oklch(0.35_0.05_265)] transition-all duration-300 hover:shadow-[0_8px_40px_oklch(0_0_0/0.3)] hover:-translate-y-1">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${color.replace(")", " / 0.15)")}`, border: `1px solid ${color.replace(")", " / 0.3)")}` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm text-foreground">{feat.title}</h3>
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0 ml-2"
                      style={{ borderColor: `${color.replace(")", " / 0.3)")}`, color, background: `${color.replace(")", " / 0.1)")}` }}>
                      {badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative p-10 rounded-3xl border border-[oklch(0.65_0.22_285/0.3)] bg-[oklch(0.65_0.22_285/0.05)] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.65_0.22_285/0.05)] to-[oklch(0.72_0.18_195/0.05)] pointer-events-none" />
            <Sparkles className="w-10 h-10 mx-auto mb-4 text-[oklch(0.75_0.2_285)]" />
            <h2 className="text-3xl font-bold text-foreground mb-3">{h.ctaSectionTitle}</h2>
            <p className="text-muted-foreground mb-8">{h.ctaSectionDesc}</p>
            <Button size="lg"
              className="gap-2 bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0 px-10 h-12"
              onClick={() => { window.location.href = isAuthenticated ? "/app/personas" : getLoginUrl(); }}>
              <Sparkles className="w-5 h-5" />
              {isAuthenticated ? t.common.enterPlatform : t.common.register}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4 text-[oklch(0.65_0.22_285)]" />
            <span>ASG Nexus — Super-Aligned AI Persona Platform</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {h.footerBuiltOn}{" "}
            <a href="https://github.com/CptM111/ai-security-guardian" target="_blank" rel="noopener noreferrer"
              className="text-[oklch(0.75_0.15_285)] hover:underline">
              AI Security Guardian
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
