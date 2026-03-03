import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/contexts/I18nContext";
import { toast } from "sonner";
import { Bot, Lock, MessageCircle, Send, Shield, Sparkles, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Streamdown } from "streamdown";

interface Message {
  id: number;
  senderType: "user" | "persona";
  decryptedContent: string;
  createdAt: Date;
}

function ChatBubble({ msg, personaName, locale }: { msg: Message; personaName: string; locale: string }) {
  const isUser = msg.senderType === "user";
  const dateLocale = locale === "zh" ? "zh-CN" : "en-US";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <Avatar className="w-8 h-8 shrink-0 mt-1">
        <AvatarFallback className={`text-xs font-semibold ${isUser ? "bg-[oklch(0.65_0.22_285/0.3)] text-[oklch(0.8_0.15_285)]" : "bg-[oklch(0.72_0.18_195/0.2)] text-[oklch(0.72_0.18_195)]"}`}>
          {isUser ? <User className="w-4 h-4" /> : personaName.slice(0, 1)}
        </AvatarFallback>
      </Avatar>
      <div className={`max-w-[70%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className={`px-4 py-3 text-sm ${isUser ? "msg-user" : "msg-ai"}`}>
          <Streamdown>{msg.decryptedContent}</Streamdown>
        </div>
        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Lock className="w-2.5 h-2.5" />
          {locale === "zh" ? "E2E 加密" : "E2E Encrypted"} · {new Date(msg.createdAt).toLocaleTimeString(dateLocale, { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { isAuthenticated } = useAuth();
  const { t, locale } = useI18n();
  const c = t.chat;
  const loginPrompt = c.loginTitle;
  const loginDesc = c.loginDesc;
  const selectPersona = c.sidebarTitle;
  const [location] = useLocation();
  const personaIdParam = new URLSearchParams(location.split("?")[1] ?? "").get("personaId");
  const personaId = personaIdParam ? parseInt(personaIdParam) : null;

  const [selectedPersonaId, setSelectedPersonaId] = useState<number | null>(personaId);
  const [input, setInput] = useState("");
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: myPersonas } = trpc.persona.listPublic.useQuery();
  const { data: selectedPersona } = trpc.persona.get.useQuery(
    { id: selectedPersonaId! },
    { enabled: !!selectedPersonaId }
  );

  const { data: convMessages } = trpc.chat.decryptMessages.useQuery(
    {
      conversationId: conversationId!,
      participant1Type: "user",
      participant1Id: 0,
      participant2Type: "persona",
      participant2Id: selectedPersonaId!,
    },
    { enabled: !!conversationId && !!selectedPersonaId, refetchInterval: 3000 }
  );

  useEffect(() => {
    if (convMessages) {
      setLocalMessages(convMessages.map((m) => ({
        id: m.id,
        senderType: m.senderType as "user" | "persona",
        decryptedContent: m.decryptedContent,
        createdAt: m.createdAt,
      })));
    }
  }, [convMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, isTyping]);

  const sendMutation = trpc.chat.sendMessage.useMutation({
    onMutate: (vars) => {
      setIsTyping(true);
      const optimistic: Message = {
        id: Date.now(),
        senderType: "user",
        decryptedContent: vars.content,
        createdAt: new Date(),
      };
      setLocalMessages((prev) => [...prev, optimistic]);
    },
    onSuccess: (data) => {
      setIsTyping(false);
      if (data.conversationId) setConversationId(data.conversationId);
      if (data.aiReply) {
        setLocalMessages((prev) => [...prev, {
          id: Date.now() + 1,
          senderType: "persona",
          decryptedContent: data.aiReply!,
          createdAt: new Date(),
        }]);
      }
    },
    onError: (e) => {
      setIsTyping(false);
      toast.error(e.message);
    },
  });

  const handleSend = () => {
    if (!input.trim() || !selectedPersonaId) return;
    sendMutation.mutate({ toId: selectedPersonaId, toType: "persona", content: input.trim() });
    setInput("");
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="w-16 h-16 rounded-2xl bg-[oklch(0.65_0.22_285/0.15)] border border-[oklch(0.65_0.22_285/0.3)] flex items-center justify-center">
          <Lock className="w-8 h-8 text-[oklch(0.75_0.2_285)]" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">{loginPrompt}</h2>
          <p className="text-muted-foreground text-sm mb-6">{loginDesc}</p>
          <Button className="gap-2 bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0"
            onClick={() => { window.location.href = getLoginUrl(); }}>
            {t.common.login}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Persona List Sidebar */}
      <div className="w-64 border-r border-border flex flex-col shrink-0 bg-[oklch(0.09_0.016_265)]">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-[oklch(0.75_0.2_285)]" />
            {selectPersona}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {myPersonas?.map((p) => (
            <button
              key={p.id}
              onClick={() => { setSelectedPersonaId(p.id); setLocalMessages([]); setConversationId(null); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${selectedPersonaId === p.id ? "bg-[oklch(0.65_0.22_285/0.15)] border border-[oklch(0.65_0.22_285/0.3)]" : "hover:bg-[oklch(0.14_0.018_265)]"}`}
            >
              <Avatar className="w-9 h-9 shrink-0">
                <AvatarFallback className="bg-[oklch(0.65_0.22_285/0.2)] text-[oklch(0.8_0.15_285)] text-xs font-semibold">
                  {p.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{p.name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{p.bio || (locale === "zh" ? "AI 分身" : "AI Persona")}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedPersona ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card/50">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-[oklch(0.65_0.22_285/0.2)] text-[oklch(0.8_0.15_285)] font-bold">
                  {selectedPersona.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold flex items-center gap-2">
                  {selectedPersona.name}
                  <div className="w-2 h-2 rounded-full bg-[oklch(0.7_0.18_155)] animate-pulse" />
                </div>
                <div className="text-xs text-muted-foreground">{selectedPersona.bio || (locale === "zh" ? "AI 分身" : "AI Persona")}</div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-[oklch(0.7_0.18_155/0.4)] text-[oklch(0.7_0.18_155)] bg-[oklch(0.7_0.18_155/0.1)] gap-1">
                  <Shield className="w-3 h-3" /> {c.asgBadge}
                </Badge>
                <Badge variant="outline" className="text-[10px] border-[oklch(0.65_0.22_285/0.4)] text-[oklch(0.75_0.15_285)] bg-[oklch(0.65_0.22_285/0.1)] gap-1">
                  <Lock className="w-3 h-3" /> {c.encryptedBadge}
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {localMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[oklch(0.65_0.22_285/0.1)] border border-[oklch(0.65_0.22_285/0.2)] flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-[oklch(0.75_0.2_285)]" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      {c.startConversation} {selectedPersona.name}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">{c.startDesc}</p>
                  </div>
                </div>
              )}
              {localMessages.map((msg) => (
                <ChatBubble key={msg.id} msg={msg} personaName={selectedPersona.name} locale={locale} />
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 shrink-0 mt-1">
                    <AvatarFallback className="bg-[oklch(0.72_0.18_195/0.2)] text-[oklch(0.72_0.18_195)] text-xs font-semibold">
                      {selectedPersona.name.slice(0, 1)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="msg-ai px-4 py-3">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card/30">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <Input
                    placeholder={`${c.inputPlaceholder} ${selectedPersona.name}...`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    className="bg-input border-border pr-4 h-11"
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || sendMutation.isPending}
                  className="h-11 px-5 bg-gradient-to-r from-[oklch(0.65_0.22_285)] to-[oklch(0.55_0.2_295)] hover:opacity-90 text-white border-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
                <Lock className="w-3 h-3" />
                {c.encryptedNote}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
            <div className="w-16 h-16 rounded-2xl bg-[oklch(0.65_0.22_285/0.1)] border border-[oklch(0.65_0.22_285/0.2)] flex items-center justify-center">
              <Bot className="w-8 h-8 text-[oklch(0.75_0.2_285)]" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{c.selectPrompt}</h3>
              <p className="text-sm text-muted-foreground">{c.selectDesc}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
