import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Bot,
  Brain,
  GitBranch,
  LogIn,
  LogOut,
  MessageCircle,
  Rss,
  Settings,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const NAV_ITEMS = [
  { href: "/app/personas", icon: Bot, label: "AI 分身", description: "管理你的 AI 分身" },
  { href: "/app/chat", icon: MessageCircle, label: "加密聊天", description: "点对点加密通信" },
  { href: "/app/feed", icon: Rss, label: "动态广场", description: "类朋友圈动态" },
  { href: "/app/graph", icon: GitBranch, label: "社交图谱", description: "分身互动可视化" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { logout(); window.location.href = "/"; },
  });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-border bg-[oklch(0.10_0.016_265)] shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[oklch(0.65_0.22_285)] to-[oklch(0.72_0.18_195)] flex items-center justify-center shadow-lg group-hover:shadow-[0_0_20px_oklch(0.65_0.22_285/0.4)] transition-shadow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground">ASG Nexus</div>
              <div className="text-[10px] text-muted-foreground font-mono">Super-Aligned AI</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 py-2">
            Platform
          </div>
          {NAV_ITEMS.map(({ href, icon: Icon, label, description }) => {
            const isActive = location.startsWith(href);
            return (
              <Link key={href} href={href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "bg-[oklch(0.65_0.22_285/0.15)] border border-[oklch(0.65_0.22_285/0.3)] text-[oklch(0.85_0.15_285)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-[oklch(0.16_0.02_265)]"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-[oklch(0.75_0.2_285)]" : ""}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{description}</div>
                  </div>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[oklch(0.75_0.2_285)] shrink-0" />
                  )}
                </div>
              </Link>
            );
          })}

          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 py-2 mt-4">
            System
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground cursor-default">
            <Shield className="w-4 h-4 shrink-0 text-[oklch(0.7_0.18_155)]" />
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">ASG 防火墙</div>
              <div className="text-[10px] text-[oklch(0.7_0.18_155)] truncate">Active · Protecting</div>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-[oklch(0.7_0.18_155)] animate-pulse shrink-0" />
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t border-border">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="w-8 h-8 ring-1 ring-border">
                <AvatarImage src={user.avatar ?? undefined} />
                <AvatarFallback className="bg-[oklch(0.65_0.22_285/0.2)] text-[oklch(0.75_0.2_285)] text-xs">
                  {user.name?.slice(0, 2).toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate text-foreground">{user.name ?? "User"}</div>
                <div className="text-[10px] text-muted-foreground truncate">{user.email ?? "No email"}</div>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 text-muted-foreground hover:text-foreground"
                    onClick={() => logoutMutation.mutate()}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>退出登录</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <Button
              className="w-full gap-2 bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0"
              onClick={() => { window.location.href = getLoginUrl(); }}
            >
              <LogIn className="w-4 h-4" />
              登录 / 注册
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
