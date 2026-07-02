// ========================================
// AI 聚合平台 - 模拟数据层
// ========================================

const MOCK_DATA = {
  // 当前用户
  user: {
    name: "张明",
    avatar: "ZM",
    credits: 3280,
    membership: "月度会员",
    membershipExpiry: "2026-07-25",
    phone: "138****6688",
    email: "zhangming@example.com",
    registerDate: "2026-01-15",
    totalSpent: 458.7,
  },

  // 大语言模型列表
  models: [
    { id: "deepseek-v3", name: "DeepSeek V3", tier: "basic", tierLabel: "入门档", desc: "高性价比通用大模型，适合日常对话与写作", costPer1k: 1, costPerCall: 1, badge: "免费试用", icon: "🧠" },
    { id: "qwen-plus", name: "Qwen Plus", tier: "basic", tierLabel: "入门档", desc: "通义千问增强版，中文理解能力强", costPer1k: 2, costPerCall: 1, badge: "", icon: "🧠" },
    { id: "doubao-lite-32k", name: "豆包 Lite", tier: "advanced", tierLabel: "进阶档", desc: "字节跳动轻量级模型，响应快速性价比高", costPer1k: 2, costPerCall: 2, badge: "热门", icon: "⚡" },
    { id: "claude-haiku", name: "Claude 3.5 Haiku", tier: "advanced", tierLabel: "进阶档", desc: "Anthropic 快速模型，擅长代码与分析", costPer1k: 5, costPerCall: 3, badge: "", icon: "⚡" },
    { id: "glm-4-plus", name: "GLM-4 Plus", tier: "advanced", tierLabel: "进阶档", desc: "智谱旗舰模型，逻辑推理出色", costPer1k: 3, costPerCall: 3, badge: "", icon: "⚡" },
    { id: "doubao-pro-32k", name: "豆包 Pro", tier: "flagship", tierLabel: "旗舰档", desc: "字节跳动旗舰模型，中文能力强", costPer1k: 5, costPerCall: 5, badge: "推荐", icon: "🏆" },
    { id: "claude-opus", name: "Claude 3.5 Opus", tier: "flagship", tierLabel: "旗舰档", desc: "Anthropic 最强模型，长文本与深度分析", costPer1k: 12, costPerCall: 10, badge: "", icon: "🏆" },
    { id: "gemini-pro", name: "Gemini 2.0 Pro", tier: "flagship", tierLabel: "旗舰档", desc: "Google 旗舰模型，超长上下文支持", costPer1k: 8, costPerCall: 10, badge: "", icon: "🏆" },
    { id: "deepseek-r1", name: "DeepSeek R1", tier: "reasoning", tierLabel: "推理档", desc: "深度推理模型，适合复杂数学与逻辑", costPer1k: 16, costPerCall: 15, badge: "新上线", icon: "🔬" },
    { id: "o1", name: "OpenAI o1", tier: "reasoning", tierLabel: "推理档", desc: "OpenAI 推理模型，超强问题分解能力", costPer1k: 20, costPerCall: 15, badge: "", icon: "🔬" },
  ],

  // 提示词模板
  promptTemplates: [
    { id: "t1", name: "周报生成器", icon: "📋", content: "请帮我生成本周工作周报，包含：本周完成事项、遇到的问题、下周计划。我的岗位是" },
    { id: "t2", name: "文案润色", icon: "✍️", content: "请帮我润色以下文案，使其更加专业、有吸引力，保持原意不变：" },
    { id: "t3", name: "代码审查", icon: "💻", content: "请审查以下代码，指出潜在问题、优化建议，并给出改进后的代码：" },
    { id: "t4", name: "翻译助手", icon: "🌐", content: "请将以下内容翻译为英文，保持专业术语准确，语气自然：" },
    { id: "t5", name: "面试模拟", icon: "🎤", content: "请扮演面试官，对我进行前端开发岗位的技术面试，每次问一个问题并评价我的回答。" },
    { id: "t6", name: "商业计划书", icon: "📊", content: "请帮我撰写一份商业计划书大纲，项目方向是" },
  ],

  // 文生图模型
  imageModels: [
    { id: "sd-xl", name: "Stable Diffusion XL", desc: "开源旗舰，风格多样", costPerImage: 5, quality: "标准", icon: "🎨" },
    { id: "midjourney", name: "Midjourney V6", desc: "艺术品质，细节出众", costPerImage: 10, quality: "标准", icon: "🎨" },
    { id: "dalle3", name: "DALL·E 3", desc: "OpenAI 绘图，语义理解强", costPerImage: 8, quality: "标准", icon: "🎨" },
    { id: "flux-pro", name: "FLUX.1 Pro", desc: "超高清4K，照片级真实", costPerImage: 20, quality: "高清", icon: "🖼️" },
    { id: "kolors", name: "可图 Kolors", desc: "快手文生图，中文友好", costPerImage: 5, quality: "标准", icon: "🎨" },
  ],

  // AI 视频模型
  videoModels: [
    { id: "kling", name: "可灵 AI", desc: "5秒短视频，画质出色", costPerVideo: 50, duration: "5秒", icon: "🎬" },
    { id: "runway-gen3", name: "Runway Gen-3", desc: "专业级视频生成", costPerVideo: 80, duration: "5秒", icon: "🎬" },
    { id: "luma-dream", name: "Luma Dream Machine", desc: "流畅运动，创意表达", costPerVideo: 60, duration: "5秒", icon: "🎬" },
    { id: "pika", name: "Pika 1.5", desc: "趣味特效，社交分享", costPerVideo: 50, duration: "3秒", icon: "🎬" },
  ],

  // 充值套餐
  rechargePackages: [
    { id: "p1", price: 9.9, credits: 100, unitPrice: 0.099, tag: "体验档", popular: false },
    { id: "p2", price: 29.9, credits: 350, unitPrice: 0.085, tag: "入门档", popular: false },
    { id: "p3", price: 99, credits: 1200, unitPrice: 0.082, tag: "常用档", popular: true },
    { id: "p4", price: 299, credits: 4000, unitPrice: 0.075, tag: "重度档", popular: false },
  ],

  // 会员套餐
  membershipPlans: [
    { id: "m1", name: "月度会员", price: 29, period: "月", credits: 300, discount: "9折", features: ["每月赠送 300 积分", "全工具积分消耗 9 折", "优先客服支持"] },
    { id: "m2", name: "季度会员", price: 79, period: "季", credits: 900, discount: "9折", features: ["每月赠送 300 积分", "全工具积分消耗 9 折", "优先客服支持", "专属提示词库"] },
    { id: "m3", name: "年度会员", price: 268, period: "年", credits: 3600, discount: "9折", features: ["每月赠送 300 积分", "全工具积分消耗 9 折", "优先客服支持", "专属提示词库", "API 接口权限"] },
  ],

  // 消费明细
  transactions: [
    { id: "tx1", time: "2026-06-27 10:32", type: "消费", tool: "豆包 Pro 对话", amount: -10, balance: 3280, status: "成功" },
    { id: "tx2", time: "2026-06-27 09:15", type: "消费", tool: "Midjourney 文生图 ×2", amount: -20, balance: 3290, status: "成功" },
    { id: "tx3", time: "2026-06-26 22:40", type: "消费", tool: "DeepSeek R1 推理", amount: -15, balance: 3310, status: "成功" },
    { id: "tx4", time: "2026-06-26 20:10", type: "消费", tool: "可灵 AI 视频生成", amount: -50, balance: 3325, status: "成功" },
    { id: "tx5", time: "2026-06-26 14:22", type: "消费", tool: "豆包 Lite 对话", amount: -3, balance: 3375, status: "成功" },
    { id: "tx6", time: "2026-06-26 00:00", type: "签到奖励", tool: "每日签到", amount: +5, balance: 3378, status: "成功" },
    { id: "tx7", time: "2026-06-25 16:30", type: "充值", tool: "99元积分包", amount: +1200, balance: 3373, status: "成功" },
    { id: "tx8", time: "2026-06-25 12:00", type: "会员赠送", tool: "月度会员积分", amount: +300, balance: 2173, status: "成功" },
    { id: "tx9", time: "2026-06-25 11:20", type: "消费", tool: "FLUX.1 Pro 文生图", amount: -20, balance: 1873, status: "成功" },
    { id: "tx10", time: "2026-06-24 18:45", type: "消费", tool: "Claude Opus 对话", amount: -10, balance: 1893, status: "失败返还" },
  ],

  // 任务中心
  tasks: [
    { id: "task1", name: "每日签到", desc: "每日登录签到领取积分", reward: 5, done: true, icon: "📅" },
    { id: "task2", name: "绑定手机号", desc: "绑定手机号保障账号安全", reward: 50, done: true, icon: "📱" },
    { id: "task3", name: "完善个人资料", desc: "填写昵称、头像等信息", reward: 20, done: false, icon: "👤" },
    { id: "task4", name: "邀请好友", desc: "每邀请一位好友注册双方各得50积分", reward: 50, done: false, icon: "🎁", repeatable: true },
    { id: "task5", name: "首次充值", desc: "首次充值任意金额额外奖励100积分", reward: 100, done: true, icon: "💰" },
    { id: "task6", name: "发布第一条对话", desc: "完成首次 AI 对话体验", reward: 10, done: true, icon: "💬" },
  ],

  // 对话历史
  chatHistory: [
    { id: "c1", title: "React 性能优化方案", model: "豆包 Pro", time: "今天 10:32", preview: "React 应用性能优化可以从以下几个维度..." },
    { id: "c2", title: "市场调研报告撰写", model: "Claude 3.5 Opus", time: "昨天 15:20", preview: "基于您提供的数据，我建议从以下角度..." },
    { id: "c3", title: "Python 数据清洗脚本", model: "豆包 Lite", time: "前天 09:10", preview: "以下是完整的数据清洗脚本，使用 pandas..." },
    { id: "c4", title: "英文论文翻译润色", model: "DeepSeek V3", time: "3天前", preview: "以下是翻译并润色后的内容..." },
    { id: "c5", title: "产品需求文档评审", model: "DeepSeek R1", time: "5天前", preview: "经过分析，该PRD在以下方面需要补充..." },
  ],

  // 管理后台 - 数据看板
  adminDashboard: {
    todayActive: 12856,
    todayRevenue: 8932.5,
    todayCalls: 45230,
    todayCreditsConsumed: 156800,
    weekTrend: [
      { day: "周一", active: 11200, revenue: 7200 },
      { day: "周二", active: 12500, revenue: 8100 },
      { day: "周三", active: 13800, revenue: 9200 },
      { day: "周四", active: 11900, revenue: 7800 },
      { day: "周五", active: 14500, revenue: 10500 },
      { day: "周六", active: 16200, revenue: 12800 },
      { day: "周日", active: 12856, revenue: 8932 },
    ],
    toolUsage: [
      { name: "大模型对话", calls: 28500, percent: 63 },
      { name: "文生图", calls: 9800, percent: 22 },
      { name: "文档解析", calls: 4200, percent: 9 },
      { name: "AI视频", calls: 1800, percent: 4 },
      { name: "联网搜索", calls: 930, percent: 2 },
    ],
  },

  // 管理后台 - 用户列表
  adminUsers: [
    { id: "u1", name: "张明", phone: "138****6688", credits: 3280, totalSpent: 458.7, status: "正常", registerDate: "2026-01-15", membership: "月度会员" },
    { id: "u2", name: "李芳", phone: "139****2233", credits: 8900, totalSpent: 1280.0, status: "正常", registerDate: "2025-12-20", membership: "年度会员" },
    { id: "u3", name: "王浩", phone: "137****5566", credits: 150, totalSpent: 29.9, status: "正常", registerDate: "2026-06-20", membership: "无" },
    { id: "u4", name: "陈静", phone: "136****8899", credits: 5600, totalSpent: 680.5, status: "正常", registerDate: "2026-03-08", membership: "季度会员" },
    { id: "u5", name: "刘强", phone: "135****1122", credits: 0, totalSpent: 99.0, status: "封禁", registerDate: "2026-05-12", membership: "无" },
    { id: "u6", name: "赵雪", phone: "133****4455", credits: 12300, totalSpent: 2380.0, status: "正常", registerDate: "2025-11-01", membership: "年度会员" },
  ],

  // 管理后台 - 订单
  adminOrders: [
    { id: "ord1", user: "张明", amount: 99.0, credits: 1200, package: "常用档", payMethod: "支付宝", time: "2026-06-25 16:30", status: "已完成" },
    { id: "ord2", user: "李芳", amount: 268.0, credits: 3600, package: "年度会员", payMethod: "微信支付", time: "2026-06-26 09:15", status: "已完成" },
    { id: "ord3", user: "王浩", amount: 9.9, credits: 100, package: "体验档", payMethod: "支付宝", time: "2026-06-27 08:40", status: "已完成" },
    { id: "ord4", user: "陈静", amount: 79.0, credits: 900, package: "季度会员", payMethod: "微信支付", time: "2026-06-24 14:20", status: "已完成" },
    { id: "ord5", user: "刘强", amount: 99.0, credits: 1200, package: "常用档", payMethod: "支付宝", time: "2026-06-23 19:55", status: "已退款" },
    { id: "ord6", user: "赵雪", amount: 299.0, credits: 4000, package: "重度档", payMethod: "微信支付", time: "2026-06-22 11:30", status: "已完成" },
  ],
};

// 工具函数：格式化积分
function formatCredits(n) {
  return n.toLocaleString("zh-CN");
}

// 工具函数：生成唯一ID
function genId() {
  return "id" + Date.now() + Math.floor(Math.random() * 1000);
}
