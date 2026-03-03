import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, GitBranch, MessageCircle, Sparkles, User, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Node {
  id: string;
  type: "user" | "persona";
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number;
}

interface Edge {
  source: string;
  target: string;
  weight: number;
}

function ForceGraph({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>(nodes);
  const [hovered, setHovered] = useState<Node | null>(null);

  useEffect(() => {
    nodesRef.current = nodes.map((n) => ({ ...n }));
  }, [nodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    const simulate = () => {
      const ns = nodesRef.current;
      // Repulsion
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const dx = ns[j].x - ns[i].x;
          const dy = ns[j].y - ns[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 3000 / (dist * dist);
          ns[i].vx -= (dx / dist) * force;
          ns[i].vy -= (dy / dist) * force;
          ns[j].vx += (dx / dist) * force;
          ns[j].vy += (dy / dist) * force;
        }
      }
      // Attraction along edges
      for (const edge of edges) {
        const src = ns.find((n) => n.id === edge.source);
        const tgt = ns.find((n) => n.id === edge.target);
        if (!src || !tgt) continue;
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 120) * 0.03 * edge.weight;
        src.vx += (dx / dist) * force;
        src.vy += (dy / dist) * force;
        tgt.vx -= (dx / dist) * force;
        tgt.vy -= (dy / dist) * force;
      }
      // Center gravity
      for (const n of ns) {
        n.vx += (W / 2 - n.x) * 0.002;
        n.vy += (H / 2 - n.y) * 0.002;
        n.vx *= 0.85;
        n.vy *= 0.85;
        n.x = Math.max(30, Math.min(W - 30, n.x + n.vx));
        n.y = Math.max(30, Math.min(H - 30, n.y + n.vy));
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Draw edges
      for (const edge of edges) {
        const src = nodesRef.current.find((n) => n.id === edge.source);
        const tgt = nodesRef.current.find((n) => n.id === edge.target);
        if (!src || !tgt) continue;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = `oklch(0.65 0.22 285 / ${Math.min(0.4, edge.weight * 0.1)})`;
        ctx.lineWidth = Math.min(2, edge.weight * 0.3);
        ctx.stroke();
      }

      // Draw nodes
      for (const n of nodesRef.current) {
        const r = 10 + n.connections * 2;
        const isPersona = n.type === "persona";

        // Glow
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2);
        grd.addColorStop(0, isPersona ? "oklch(0.65 0.22 285 / 0.3)" : "oklch(0.72 0.18 195 / 0.3)");
        grd.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 2, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = isPersona ? "oklch(0.65 0.22 285 / 0.8)" : "oklch(0.72 0.18 195 / 0.8)";
        ctx.fill();
        ctx.strokeStyle = isPersona ? "oklch(0.75 0.2 285)" : "oklch(0.8 0.15 195)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = "oklch(0.93 0.01 265)";
        ctx.font = "11px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(n.label.slice(0, 12), n.x, n.y + r + 14);
      }
    };

    const loop = () => {
      simulate();
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [edges]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const found = nodesRef.current.find((n) => {
      const r = 10 + n.connections * 2;
      return Math.sqrt((n.x - mx) ** 2 + (n.y - my) ** 2) < r + 5;
    });
    setHovered(found ?? null);
  };

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        style={{ cursor: hovered ? "pointer" : "default" }}
      />
      {hovered && (
        <div className="absolute top-4 right-4 p-3 rounded-xl border border-border bg-card/95 backdrop-blur-sm text-sm">
          <div className="font-semibold mb-1 flex items-center gap-2">
            {hovered.type === "persona" ? <Bot className="w-4 h-4 text-[oklch(0.75_0.2_285)]" /> : <User className="w-4 h-4 text-[oklch(0.72_0.18_195)]" />}
            {hovered.label}
          </div>
          <div className="text-xs text-muted-foreground">{hovered.connections} 个连接</div>
        </div>
      )}
    </div>
  );
}

export default function GraphPage() {
  const { data: personas } = trpc.graph.allPersonas.useQuery();
  const { data: users } = trpc.graph.allUsers.useQuery();
  const { data: interactions } = trpc.graph.allInteractions.useQuery();

  const [graphData, setGraphData] = useState<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });

  useEffect(() => {
    if (!personas && !users) return;
    const nodes: Node[] = [];
    const edgeMap = new Map<string, number>();

    // Add persona nodes
    (personas ?? []).forEach((p, i) => {
      const angle = (i / (personas?.length ?? 1)) * Math.PI * 2;
      nodes.push({
        id: `persona-${p.id}`,
        type: "persona",
        label: p.name,
        x: 400 + Math.cos(angle) * 180,
        y: 250 + Math.sin(angle) * 150,
        vx: 0, vy: 0,
        connections: 0,
      });
    });

    // Add user nodes
    (users ?? []).forEach((u, i) => {
      const angle = (i / (users?.length ?? 1)) * Math.PI * 2 + Math.PI / 4;
      nodes.push({
        id: `user-${u.id}`,
        type: "user",
        label: u.name ?? `User ${u.id}`,
        x: 400 + Math.cos(angle) * 280,
        y: 250 + Math.sin(angle) * 220,
        vx: 0, vy: 0,
        connections: 0,
      });
    });

    // Build edges from interactions
    (interactions ?? []).forEach((inter: any) => {
      const srcId = inter.personaId ? `persona-${inter.personaId}` : `user-${inter.userId}`;
      const tgtId = inter.targetPersonaId ? `persona-${inter.targetPersonaId}` : inter.targetUserId ? `user-${inter.targetUserId}` : null;
      if (!tgtId) return;
      const key = [srcId, tgtId].sort().join("--");
      edgeMap.set(key, (edgeMap.get(key) ?? 0) + 1);
    });

    const edges: Edge[] = [];
    edgeMap.forEach((weight, key) => {
      const [source, target] = key.split("--");
      edges.push({ source, target, weight });
      const srcNode = nodes.find((n) => n.id === source);
      const tgtNode = nodes.find((n) => n.id === target);
      if (srcNode) srcNode.connections++;
      if (tgtNode) tgtNode.connections++;
    });

    setGraphData({ nodes, edges });
  }, [personas, users, interactions]);

  const totalPersonas = personas?.length ?? 0;
  const totalUsers = users?.length ?? 0;
  const totalInteractions = interactions?.length ?? 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-1">
          <GitBranch className="w-6 h-6 text-[oklch(0.72_0.18_195)]" />
          分身社交图谱
        </h1>
        <p className="text-muted-foreground text-sm">可视化展示 AI 分身与用户之间的互动关系网络</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: Bot, label: "AI 分身", value: totalPersonas, color: "oklch(0.65 0.22 285)" },
          { icon: User, label: "用户", value: totalUsers, color: "oklch(0.72 0.18 195)" },
          { icon: Zap, label: "互动记录", value: totalInteractions, color: "oklch(0.78 0.18 75)" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="p-4 rounded-xl border border-border bg-card flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color.replace(")", " / 0.15)")}`, border: `1px solid ${color.replace(")", " / 0.3)")}` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Graph Canvas */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden mb-6" style={{ height: 500 }}>
        {graphData.nodes.length > 0 ? (
          <ForceGraph nodes={graphData.nodes} edges={graphData.edges} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[oklch(0.72_0.18_195/0.1)] border border-[oklch(0.72_0.18_195/0.2)] flex items-center justify-center">
              <GitBranch className="w-7 h-7 text-[oklch(0.72_0.18_195)]" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">图谱正在构建中</h3>
              <p className="text-sm text-muted-foreground">创建 AI 分身并开始互动，社交图谱将自动生成</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[oklch(0.65_0.22_285)]" />
          <span>AI 分身节点</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[oklch(0.72_0.18_195)]" />
          <span>用户节点</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-[oklch(0.65_0.22_285/0.4)]" />
          <span>互动关系（越粗越频繁）</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-[oklch(0.75_0.2_285)]" />
          <span>节点越大表示连接越多</span>
        </div>
      </div>

      {/* Persona List */}
      {personas && personas.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5 text-[oklch(0.65_0.22_285)]" />
            活跃分身排行
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...personas].sort((a, b) => (b.memoryCount ?? 0) - (a.memoryCount ?? 0)).slice(0, 6).map((p) => (
              <div key={p.id} className="p-3 rounded-xl border border-border bg-card flex items-center gap-3">
                <Avatar className="w-9 h-9 shrink-0">
                  <AvatarFallback className="bg-[oklch(0.65_0.22_285/0.2)] text-[oklch(0.8_0.15_285)] text-xs font-bold">
                    {p.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <MessageCircle className="w-2.5 h-2.5" /> {p.memoryCount ?? 0} 记忆
                    <span className="mx-1">·</span>
                    {Math.round(p.alignmentScore ?? 0)} 分
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
