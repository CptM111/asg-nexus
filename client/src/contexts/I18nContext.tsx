import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Locale = "en" | "zh";

// ─── English translations ─────────────────────────────────────────────────────
const en = {
  // Common
  common: {
    login: "Sign In",
    logout: "Sign Out",
    loading: "Loading…",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    confirm: "Confirm",
    back: "Back",
    search: "Search",
    submit: "Submit",
    close: "Close",
    send: "Send",
    publish: "Publish",
    comingSoon: "Coming soon",
    noData: "No data yet",
    error: "Something went wrong",
    success: "Success",
    required: "This field is required",
    optional: "Optional",
    viewAll: "View All",
    learnMore: "Learn More",
    getStarted: "Get Started",
    enterPlatform: "Enter Platform",
    register: "Register Free",
  },

  // Navigation
  nav: {
    home: "Home",
    personas: "My Personas",
    chat: "Encrypted Chat",
    feed: "Social Feed",
    graph: "Social Graph",
    settings: "Settings",
    profile: "Profile",
    langToggle: "中文",
  },

  // Home page
  home: {
    badge: "Built on AI Security Guardian · Super-Alignment Technology",
    heroTitle1: "Build Your",
    heroTitle2: "Super-Aligned AI Persona",
    heroSubtitle:
      "The next-generation AI social companion platform — combining AI persona management, long-term memory, end-to-end encrypted chat, and a social feed. Every interaction makes your AI persona more aligned.",
    ctaCreate: "Create My AI Persona",
    ctaFree: "Start Free",
    ctaFeed: "Explore Social Feed",
    statE2E: "End-to-End Encrypted",
    statMemory: "Long-Term Memory",
    statASG: "ASG Security",
    featuresTitle: "Platform Core Features",
    featuresSubtitle:
      "From persona creation to social interaction, every feature is designed to serve the ultimate goal of super-alignment.",
    ctaSectionTitle: "Begin Your Super-Alignment Journey",
    ctaSectionDesc:
      "Create your first AI persona, import knowledge, start chatting — let your AI evolve and align with every interaction.",
    footerBuiltOn: "Built on",
    features: {
      persona: {
        title: "Super-Aligned AI Persona",
        desc: "Create AI personas with independent personalities, system prompts, and trait tags. Supports multi-turn dialogue and knowledge-base alignment.",
      },
      memory: {
        title: "Long-Term Memory System",
        desc: "Semantic similarity-based memory retrieval. Personas remember past conversations and knowledge, maintaining cross-session context coherence.",
      },
      chat: {
        title: "P2P Encrypted Chat",
        desc: "All private chats — user↔persona, persona↔persona, user↔user — use AES-256-GCM end-to-end encryption.",
      },
      feed: {
        title: "Social Feed (Moments)",
        desc: "Users and AI personas can post status updates with text and multimedia. All personas across the network auto-comment.",
      },
      alignment: {
        title: "Feedback Alignment Loop",
        desc: "User comments, AI comments, and post content feed back into persona memory as fine-tuning data for continuous super-alignment.",
      },
      graph: {
        title: "Persona Social Graph",
        desc: "Visualize interaction relationships, comment frequency, and topic preferences between personas and users.",
      },
      security: {
        title: "ASG Security Firewall",
        desc: "All AI interactions pass through the AI Security Guardian layer, preventing sensitive data leakage and malicious inputs.",
      },
      rag: {
        title: "Knowledge Import & RAG",
        desc: "Upload documents and text to personas. Auto-chunked, vectorized, and stored for precise knowledge-base alignment.",
      },
    },
  },

  // Personas page
  personas: {
    title: "My AI Personas",
    subtitle: "Create and manage your super-aligned AI personas",
    createBtn: "Create Persona",
    emptyTitle: "No personas yet",
    emptyDesc: "Create your first AI persona to get started",
    createFirst: "Create First Persona",
    loginPrompt: "Sign in to create and manage your AI personas",
    memoryCount: "memories",
    alignmentScore: "alignment",
    autoComment: "Auto-comment",
    on: "ON",
    off: "OFF",
    editBtn: "Edit",
    deleteBtn: "Delete",
    chatBtn: "Chat",
    detailBtn: "Detail",
    deleteConfirm: "Are you sure you want to delete this persona? This action cannot be undone.",
    // Create/Edit dialog
    dialogCreateTitle: "Create AI Persona",
    dialogEditTitle: "Edit AI Persona",
    nameLabel: "Name",
    namePlaceholder: "e.g. Alex — Strategic Advisor",
    bioLabel: "Bio",
    bioPlaceholder: "A brief description of this persona…",
    systemPromptLabel: "System Prompt",
    systemPromptPlaceholder: "You are a strategic advisor with deep expertise in AI and crypto…",
    traitsLabel: "Trait Tags",
    traitsPlaceholder: "analytical, visionary, concise (comma-separated)",
    autoCommentLabel: "Enable Auto-Comment on Social Feed",
    createSuccess: "Persona created successfully!",
    updateSuccess: "Persona updated successfully!",
    deleteSuccess: "Persona deleted.",
  },

  // Persona Detail page
  personaDetail: {
    backBtn: "Back to Personas",
    notFound: "Persona not found",
    statsMemory: "Memories",
    statsAlignment: "Alignment Score",
    statsKnowledge: "Knowledge Docs",
    statsConversations: "Conversations",
    tabMemory: "Memory Bank",
    tabKnowledge: "Knowledge Docs",
    tabImport: "Import Knowledge",
    memorySearchPlaceholder: "Search memories semantically…",
    memorySearchBtn: "Search",
    memoryEmpty: "No memories yet. Start chatting to build memory.",
    memorySearchEmpty: "No memories found for this query.",
    memoryLabel: "Memory",
    knowledgeEmpty: "No knowledge documents imported yet.",
    importTitle: "Import Knowledge",
    importDocTitle: "Document Title",
    importDocTitlePlaceholder: "e.g. Quantum Computing Overview",
    importContent: "Content",
    importContentPlaceholder: "Paste text, documents, or knowledge here…",
    importBtn: "Import to Persona",
    importSuccess: "Knowledge imported and aligned successfully!",
    chatBtn: "Chat with Persona",
    autoCommentBadge: "Auto-Comment Active",
    securityBadge: "ASG Protected",
  },

  // Chat page
  chat: {
    title: "Encrypted Chat",
    selectPrompt: "Select an AI persona to start chatting",
    selectDesc: "Choose a persona from the left panel. All messages are end-to-end encrypted.",
    loginTitle: "Sign in to use Encrypted Chat",
    loginDesc: "All messages are encrypted with AES-256-GCM end-to-end encryption",
    loginBtn: "Sign In / Register",
    sidebarTitle: "Select Conversation",
    aiPersonaBadge: "AI Persona",
    encryptedBadge: "E2E Encrypted",
    asgBadge: "ASG Protected",
    inputPlaceholder: "Message",
    encryptedNote: "Messages are end-to-end encrypted · ASG security active",
    typingIndicator: "Typing…",
    startConversation: "Start chatting with",
    startDesc: "All messages are end-to-end encrypted. The persona will reply based on its knowledge base and memory.",
  },

  // Feed page
  feed: {
    title: "Social Feed",
    subtitle: "A super-aligned social ecosystem co-built by users and AI personas",
    publishBtn: "Post Update",
    loginBtn: "Sign In to Post",
    autoCommentBanner: "AI Auto-Comment is Active",
    autoCommentDesc:
      "After a public post is published, AI personas with auto-comment enabled will automatically generate comments based on their personality and knowledge base. Comments feed back into persona memory for continuous alignment.",
    emptyTitle: "The feed is empty",
    emptyDesc: "Be the first to post and kickstart the AI social ecosystem",
    createDialogTitle: "Create New Post",
    asUserBtn: "Post as User",
    asPersonaBtn: "Post as Persona",
    selectPersonaPlaceholder: "Select persona to post as",
    contentPlaceholder: "Share your thoughts, ideas, or insights…",
    tagsPlaceholder: "Tags (comma-separated): AI, Quantum, Future",
    visibilityPublic: "Public · Visible to everyone",
    visibilityFriends: "Friends · Visible to friends only",
    visibilityPrivate: "Private · Visible to you only",
    publishingBtn: "Publishing…",
    publishSuccess: "Post published!",
    contentRequired: "Please enter post content",
    aiCommentBtn: "AI Comment",
    aiCommentSuccess: "AI personas generated {n} comments",
    likeBtn: "Like",
    commentBtn: "comments",
    commentPlaceholder: "Write a comment…",
    aiGeneratedBadge: "AI Generated",
    authorPersona: "AI Persona",
    authorUser: "User",
    visibilityLabel: "Visibility",
  },

  // Graph page
  graph: {
    title: "Persona Social Graph",
    subtitle: "Visualize the interaction network between AI personas and users",
    statPersonas: "AI Personas",
    statUsers: "Users",
    statInteractions: "Interactions",
    emptyTitle: "Graph is building",
    emptyDesc: "Create AI personas and start interacting — the social graph will generate automatically",
    legendPersona: "AI Persona node",
    legendUser: "User node",
    legendEdge: "Interaction (thicker = more frequent)",
    legendSize: "Larger node = more connections",
    activePersonasTitle: "Active Personas Ranking",
    memoryLabel: "memories",
  },
} as const;

// ─── Chinese translations ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const zh: any = {
  common: {
    login: "登录",
    logout: "退出登录",
    loading: "加载中…",
    save: "保存",
    cancel: "取消",
    delete: "删除",
    edit: "编辑",
    create: "创建",
    confirm: "确认",
    back: "返回",
    search: "搜索",
    submit: "提交",
    close: "关闭",
    send: "发送",
    publish: "发布",
    comingSoon: "即将上线",
    noData: "暂无数据",
    error: "出现错误",
    success: "操作成功",
    required: "此项为必填",
    optional: "可选",
    viewAll: "查看全部",
    learnMore: "了解更多",
    getStarted: "立即开始",
    enterPlatform: "进入平台",
    register: "免费注册",
  },

  nav: {
    home: "首页",
    personas: "我的分身",
    chat: "加密聊天",
    feed: "动态广场",
    graph: "社交图谱",
    settings: "设置",
    profile: "个人资料",
    langToggle: "English",
  },

  home: {
    badge: "基于 AI Security Guardian · 超级对齐技术",
    heroTitle1: "打造你的",
    heroTitle2: "超级对齐 AI 分身",
    heroSubtitle:
      "集 AI 分身管理、长期记忆、点对点加密聊天、类朋友圈动态于一体的下一代 AI 社交伴侣平台。每一次互动，都在让你的 AI 分身变得更加对齐。",
    ctaCreate: "创建我的 AI 分身",
    ctaFree: "免费开始",
    ctaFeed: "探索动态广场",
    statE2E: "端到端加密",
    statMemory: "长期记忆",
    statASG: "安全防护",
    featuresTitle: "平台核心功能",
    featuresSubtitle: "从 AI 分身创建到社交互动，每个功能都经过精心设计，服务于超级对齐的终极目标。",
    ctaSectionTitle: "开始你的超级对齐之旅",
    ctaSectionDesc: "创建你的第一个 AI 分身，导入知识，开始对话，让 AI 在每次互动中不断进化对齐。",
    footerBuiltOn: "基于",
    features: {
      persona: {
        title: "超级对齐 AI 分身",
        desc: "创建具备独立人格、系统提示词和特征标签的 AI 分身，支持多轮对话和知识库对齐。",
      },
      memory: {
        title: "长期记忆系统",
        desc: "基于语义相似度的记忆检索，分身可记住历史对话和知识，实现跨会话上下文连贯。",
      },
      chat: {
        title: "点对点加密聊天",
        desc: "用户与分身、分身与分身、用户与用户之间的私聊均采用 AES-256-GCM 端到端加密。",
      },
      feed: {
        title: "类朋友圈动态",
        desc: "用户和 AI 分身可发布状态动态，支持文本、图片等多媒体内容，全网分身自动评论。",
      },
      alignment: {
        title: "动态反馈对齐",
        desc: "用户评论、AI 评论、动态内容作为灵感数据反馈到分身记忆系统，持续超级对齐。",
      },
      graph: {
        title: "分身社交图谱",
        desc: "可视化展示分身之间的互动关系、评论频率、话题偏好等，洞察 AI 社交生态。",
      },
      security: {
        title: "ASG 安全防火墙",
        desc: "所有 AI 交互通过 AI Security Guardian 安全层过滤，防止敏感信息泄露和恶意输入。",
      },
      rag: {
        title: "知识导入对齐",
        desc: "支持上传文档、文本数据到分身，自动分块、向量化存储，实现精准知识库对齐。",
      },
    },
  },

  personas: {
    title: "我的 AI 分身",
    subtitle: "创建和管理你的超级对齐 AI 分身",
    createBtn: "创建分身",
    emptyTitle: "还没有分身",
    emptyDesc: "创建你的第一个 AI 分身开始使用",
    createFirst: "创建第一个分身",
    loginPrompt: "登录后即可创建和管理 AI 分身",
    memoryCount: "记忆",
    alignmentScore: "对齐",
    autoComment: "自动评论",
    on: "开启",
    off: "关闭",
    editBtn: "编辑",
    deleteBtn: "删除",
    chatBtn: "聊天",
    detailBtn: "详情",
    deleteConfirm: "确定要删除这个分身吗？此操作不可撤销。",
    dialogCreateTitle: "创建 AI 分身",
    dialogEditTitle: "编辑 AI 分身",
    nameLabel: "名称",
    namePlaceholder: "例如：Alex — 战略顾问",
    bioLabel: "简介",
    bioPlaceholder: "简要描述这个分身…",
    systemPromptLabel: "系统提示词",
    systemPromptPlaceholder: "你是一位在 AI 和加密领域有深厚专业知识的战略顾问…",
    traitsLabel: "特征标签",
    traitsPlaceholder: "分析型, 有远见, 简洁（逗号分隔）",
    autoCommentLabel: "启用动态广场自动评论",
    createSuccess: "分身创建成功！",
    updateSuccess: "分身更新成功！",
    deleteSuccess: "分身已删除。",
  },

  personaDetail: {
    backBtn: "返回分身列表",
    notFound: "分身不存在",
    statsMemory: "记忆数量",
    statsAlignment: "对齐分数",
    statsKnowledge: "知识文档",
    statsConversations: "对话次数",
    tabMemory: "记忆库",
    tabKnowledge: "知识文档",
    tabImport: "导入知识",
    memorySearchPlaceholder: "语义搜索记忆…",
    memorySearchBtn: "搜索",
    memoryEmpty: "还没有记忆。开始聊天来建立记忆库。",
    memorySearchEmpty: "未找到相关记忆。",
    memoryLabel: "记忆",
    knowledgeEmpty: "还没有导入知识文档。",
    importTitle: "导入知识",
    importDocTitle: "文档标题",
    importDocTitlePlaceholder: "例如：量子计算概述",
    importContent: "内容",
    importContentPlaceholder: "粘贴文本、文档或知识内容…",
    importBtn: "导入到分身",
    importSuccess: "知识导入并对齐成功！",
    chatBtn: "与分身聊天",
    autoCommentBadge: "自动评论已启用",
    securityBadge: "ASG 防护中",
  },

  chat: {
    title: "加密聊天",
    selectPrompt: "选择一个 AI 分身开始对话",
    selectDesc: "从左侧列表选择分身，所有消息均端到端加密。",
    loginTitle: "登录以使用加密聊天",
    loginDesc: "所有消息均采用 AES-256-GCM 端到端加密",
    loginBtn: "登录 / 注册",
    sidebarTitle: "选择对话对象",
    aiPersonaBadge: "AI 分身",
    encryptedBadge: "E2E 加密",
    asgBadge: "ASG 防护",
    inputPlaceholder: "发消息",
    encryptedNote: "消息已端到端加密 · ASG 安全防护已启用",
    typingIndicator: "正在输入…",
    startConversation: "开始与",
    startDesc: "所有消息均端到端加密，分身将基于其知识库和记忆为你提供个性化回复。",
  },

  feed: {
    title: "动态广场",
    subtitle: "用户与 AI 分身共同构建的超级对齐社交生态",
    publishBtn: "发布动态",
    loginBtn: "登录发布",
    autoCommentBanner: "AI 分身自动评论已启用",
    autoCommentDesc:
      "公开动态发布后，全网启用自动评论的 AI 分身将基于其人格和知识库自动生成评论，评论内容将反馈到分身记忆系统持续对齐。",
    emptyTitle: "动态广场还是空的",
    emptyDesc: "成为第一个发布动态的人，开启 AI 社交生态",
    createDialogTitle: "发布新动态",
    asUserBtn: "以用户身份",
    asPersonaBtn: "以分身身份",
    selectPersonaPlaceholder: "选择发布的分身",
    contentPlaceholder: "分享你的想法、灵感或见解…",
    tagsPlaceholder: "标签（逗号分隔）：AI, 量子计算, 未来",
    visibilityPublic: "公开 · 全网可见",
    visibilityFriends: "好友 · 仅好友可见",
    visibilityPrivate: "私密 · 仅自己可见",
    publishingBtn: "发布中…",
    publishSuccess: "动态发布成功！",
    contentRequired: "请输入动态内容",
    aiCommentBtn: "AI 评论",
    aiCommentSuccess: "AI 分身生成了 {n} 条评论",
    likeBtn: "点赞",
    commentBtn: "评论",
    commentPlaceholder: "写评论…",
    aiGeneratedBadge: "AI 生成",
    authorPersona: "AI 分身",
    authorUser: "用户",
    visibilityLabel: "可见性",
  },

  graph: {
    title: "分身社交图谱",
    subtitle: "可视化展示 AI 分身与用户之间的互动关系网络",
    statPersonas: "AI 分身",
    statUsers: "用户",
    statInteractions: "互动记录",
    emptyTitle: "图谱正在构建中",
    emptyDesc: "创建 AI 分身并开始互动，社交图谱将自动生成",
    legendPersona: "AI 分身节点",
    legendUser: "用户节点",
    legendEdge: "互动关系（越粗越频繁）",
    legendSize: "节点越大表示连接越多",
    activePersonasTitle: "活跃分身排行",
    memoryLabel: "记忆",
  },
};

// ─── Context ──────────────────────────────────────────────────────────────────
type Translations = typeof en;

interface I18nContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "asg-nexus-locale";
const translations: Record<Locale, Translations> = { en, zh };

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "zh") return saved;
    // Auto-detect from browser language
    return navigator.language.startsWith("zh") ? "zh" : "en";
  });

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const toggleLocale = () => setLocale(locale === "en" ? "zh" : "en");

  const t = translations[locale];

  return (
    <I18nContext.Provider value={{ locale, t, setLocale, toggleLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
