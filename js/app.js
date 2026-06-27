// ========================================
// AIHub - 主应用逻辑
// ========================================

// ===== 全局状态 =====
const state = {
  currentRoute: "dashboard",
  currentModel: MOCK_DATA.models[5], // 默认 GPT-4o
  chatMessages: [],
  chatHistory: MOCK_DATA.chatHistory,
  selectedImageModel: MOCK_DATA.imageModels[0],
  selectedVideoModel: MOCK_DATA.videoModels[0],
  imageCount: 2,
  imageSize: "1:1",
  uploadedFile: null,
  adminTab: "dashboard",
  selectedRechargePackage: null,
  txFilter: "all",
  checkInDone: MOCK_DATA.tasks[0].done,
};

// ===== 路由配置 =====
const routes = {
  dashboard: { title: "工作台", render: renderDashboard },
  chat: { title: "AI 对话", render: renderChat },
  image: { title: "AI 绘画", render: renderImage },
  video: { title: "AI 视频", render: renderVideo },
  document: { title: "文档解析", render: renderDocument },
  credits: { title: "积分中心", render: renderCredits },
  recharge: { title: "充值套餐", render: renderRecharge },
  tasks: { title: "任务中心", render: renderTasks },
  profile: { title: "个人中心", render: renderProfile },
  admin: { title: "管理后台", render: renderAdmin },
};

// ===== 路由器 =====
function router() {
  const hash = location.hash.slice(2) || "dashboard";
  const route = routes[hash] ? hash : "dashboard";
  state.currentRoute = route;

  // 更新导航高亮
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.route === route);
  });

  // 更新标题
  document.getElementById("pageTitle").textContent = routes[route].title;

  // 渲染页面
  const container = document.getElementById("pageContainer");
  container.innerHTML = "";
  routes[route].render(container);

  // 滚动到顶部
  container.scrollTop = 0;
}

window.addEventListener("hashchange", router);

// ===== 工具函数 =====
function showToast(msg, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";
  toast.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = "slideIn 0.3s ease reverse";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function showModal(content) {
  document.getElementById("modalBox").innerHTML = content;
  document.getElementById("modalOverlay").classList.add("show");
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("show");
}

document.addEventListener("click", (e) => {
  if (e.target.id === "modalOverlay") closeModal();
});

function updateCredits(delta) {
  MOCK_DATA.user.credits += delta;
  const formatted = formatCredits(MOCK_DATA.user.credits);
  document.getElementById("sidebar-credits").textContent = formatted;
  document.getElementById("topbar-credits").textContent = formatted;
}

function canAfford(cost) {
  return MOCK_DATA.user.credits >= cost;
}

function deductCredits(cost, toolName) {
  if (!canAfford(cost)) {
    showToast("积分不足，请前往充值", "error");
    setTimeout(() => (location.hash = "#/recharge"), 1000);
    return false;
  }
  updateCredits(-cost);
  // 添加交易记录
  MOCK_DATA.transactions.unshift({
    id: genId(),
    time: new Date().toLocaleString("zh-CN", { hour12: false }),
    type: "消费",
    tool: toolName,
    amount: -cost,
    balance: MOCK_DATA.user.credits,
    status: "成功",
  });
  return true;
}

// ===== 工作台 =====
function renderDashboard(c) {
  const u = MOCK_DATA.user;
  c.innerHTML = `
    <div class="dashboard-hero">
      <h2>👋 欢迎回来，${u.name}！</h2>
      <p>一站式 AI 能力聚合平台 · 多模型切换 · 积分按需付费 · 告别多平台订阅</p>
      <div class="dashboard-hero-actions">
        <button class="btn" onclick="location.hash='#/chat'">💬 开始对话</button>
        <button class="btn" onclick="location.hash='#/image'">🎨 AI 绘画</button>
        <button class="btn" onclick="location.hash='#/document'">📄 文档解析</button>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-card-icon" style="background:var(--accent-light)">💎</div>
        <div class="stat-card-value">${formatCredits(u.credits)}</div>
        <div class="stat-card-label">当前积分余额</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon" style="background:var(--success-light)">📊</div>
        <div class="stat-card-value">${MOCK_DATA.transactions.filter(t=>t.type==="消费").length}</div>
        <div class="stat-card-label">本月调用次数</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon" style="background:var(--warning-light)">🎫</div>
        <div class="stat-card-value">${u.membership}</div>
        <div class="stat-card-label">到期：${u.membershipExpiry}</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon" style="background:rgba(186,104,200,0.15)">💰</div>
        <div class="stat-card-value">¥${u.totalSpent}</div>
        <div class="stat-card-label">累计消费</div>
      </div>
    </div>

    <div class="section-header">
      <h3>🚀 快捷工具</h3>
    </div>
    <div class="tool-grid">
      <div class="tool-card" onclick="location.hash='#/chat'">
        <div class="tool-card-icon">💬</div>
        <div class="tool-card-title">AI 对话</div>
        <div class="tool-card-desc">10+ 主流大模型，一键切换</div>
        <div class="tool-card-cost">1~20 积分/次</div>
      </div>
      <div class="tool-card" onclick="location.hash='#/image'">
        <div class="tool-card-icon">🎨</div>
        <div class="tool-card-title">AI 绘画</div>
        <div class="tool-card-desc">SD、Midjourney、DALL·E 等</div>
        <div class="tool-card-cost">5~30 积分/张</div>
      </div>
      <div class="tool-card" onclick="location.hash='#/video'">
        <div class="tool-card-icon">🎬</div>
        <div class="tool-card-title">AI 视频</div>
        <div class="tool-card-desc">可灵、Runway、Luma 等</div>
        <div class="tool-card-cost">50~100 积分/条</div>
      </div>
      <div class="tool-card" onclick="location.hash='#/document'">
        <div class="tool-card-icon">📄</div>
        <div class="tool-card-title">文档解析</div>
        <div class="tool-card-desc">PDF/Word/PPT 智能问答</div>
        <div class="tool-card-cost">10~20 积分/份</div>
      </div>
      <div class="tool-card" onclick="location.hash='#/recharge'">
        <div class="tool-card-icon">💳</div>
        <div class="tool-card-title">充值中心</div>
        <div class="tool-card-desc">多档位套餐，充得多单价低</div>
        <div class="tool-card-cost">9.9 元起</div>
      </div>
      <div class="tool-card" onclick="location.hash='#/tasks'">
        <div class="tool-card-icon">🎁</div>
        <div class="tool-card-title">任务中心</div>
        <div class="tool-card-desc">签到、邀请，免费赚积分</div>
        <div class="tool-card-cost">每日可领</div>
      </div>
    </div>

    <div class="section-header">
      <h3>📋 最近对话</h3>
      <button class="btn btn-ghost btn-sm" onclick="location.hash='#/chat'">查看全部 →</button>
    </div>
    <div class="card">
      ${MOCK_DATA.chatHistory.slice(0, 5).map(ch => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer"
             onclick="location.hash='#/chat'">
          <span style="font-size:20px">💬</span>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:500">${ch.title}</div>
            <div style="font-size:12px;color:var(--text-muted)">${ch.preview}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:12px;color:var(--accent)">${ch.model}</div>
            <div style="font-size:11px;color:var(--text-muted)">${ch.time}</div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

// ===== AI 对话 =====
function renderChat(c) {
  c.innerHTML = `
    <div class="chat-layout">
      <div class="chat-sidebar">
        <div class="chat-sidebar-header">
          <button class="btn btn-primary" onclick="newChat()">+ 新建对话</button>
        </div>
        <div class="chat-history">
          ${state.chatHistory.map(ch => `
            <div class="chat-history-item ${ch.id === "c1" ? "active" : ""}" onclick="loadChat('${ch.id}')">
              <div class="chat-history-item-title">${ch.title}</div>
              <div class="chat-history-item-meta">
                <span>${ch.model}</span>
                <span>${ch.time}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="chat-main">
        <div class="chat-header">
          <div class="model-selector" style="position:relative">
            <div class="model-selector-current" onclick="toggleModelDropdown()">
              <span>${state.currentModel.icon}</span>
              <span>${state.currentModel.name}</span>
              <span class="tag tag-${state.currentModel.tier}">${state.currentModel.tierLabel}</span>
              <span style="font-size:11px;color:var(--accent)">▾</span>
            </div>
            <div class="model-dropdown" id="modelDropdown">
              ${renderModelDropdown()}
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-ghost btn-sm" onclick="clearChat()">🗑 清空</button>
          </div>
        </div>
        <div class="chat-messages" id="chatMessages">
          ${state.chatMessages.length === 0 ? renderWelcomeScreen() : renderMessages()}
        </div>
        <div class="chat-templates">
          ${MOCK_DATA.promptTemplates.slice(0, 6).map(t => `
            <div class="template-chip" onclick="useTemplate('${t.id}')">${t.icon} ${t.name}</div>
          `).join("")}
        </div>
        <div class="chat-input-area">
          <div class="chat-input-tools">
            <div class="chat-tool-btn" title="上传文件" onclick="showToast('文件上传功能演示','info')">📎</div>
            <div class="chat-tool-btn" title="图片识别" onclick="showToast('图片识别功能演示','info')">🖼️</div>
            <div class="chat-tool-btn" title="联网搜索" onclick="toggleWebSearch(this)">🔍</div>
            <div class="cost-estimate" id="costEstimate">
              预估消耗: <strong>${state.currentModel.costPerCall} 积分</strong>
            </div>
          </div>
          <div class="chat-input-wrapper">
            <textarea class="chat-input" id="chatInput" placeholder="输入消息，按 Enter 发送..." rows="1"
              onkeydown="handleChatKey(event)" oninput="autoResize(this)"></textarea>
            <button class="chat-send-btn" onclick="sendMessage()" title="发送">➤</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderModelDropdown() {
  const tiers = [
    { key: "basic", label: "入门档" },
    { key: "advanced", label: "进阶档" },
    { key: "flagship", label: "旗舰档" },
    { key: "reasoning", label: "推理档" },
  ];
  return tiers.map(tier => {
    const models = MOCK_DATA.models.filter(m => m.tier === tier.key);
    if (!models.length) return "";
    return `
      <div class="model-dropdown-group">
        <div class="model-dropdown-group-title">${tier.label}</div>
        ${models.map(m => `
          <div class="model-dropdown-item" onclick="selectModel('${m.id}')">
            <span style="font-size:20px">${m.icon}</span>
            <div class="model-dropdown-item-info">
              <div class="model-dropdown-item-name">${m.name} ${m.badge ? `<span class="tag tag-${m.badge === '热门' ? 'hot' : m.badge === '推荐' ? 'recommend' : m.badge === '新上线' ? 'new' : 'free'}">${m.badge}</span>` : ""}</div>
              <div class="model-dropdown-item-desc">${m.desc}</div>
            </div>
            <div class="model-dropdown-item-cost">${m.costPerCall}积分/次</div>
          </div>
        `).join("")}
      </div>
    `;
  }).join("");
}

function renderWelcomeScreen() {
  const popular = MOCK_DATA.models.slice(0, 4);
  return `
    <div class="welcome-screen">
      <h2>🤖 选择模型开始对话</h2>
      <p>支持单会话内切换模型，上下文自动保留</p>
      <div class="welcome-models">
        ${popular.map(m => `
          <div class="welcome-model-card" onclick="selectModel('${m.id}')">
            <div class="welcome-model-card-icon">${m.icon}</div>
            <div class="welcome-model-card-name">${m.name}</div>
            <div class="welcome-model-card-cost">${m.costPerCall} 积分/次</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderMessages() {
  return state.chatMessages.map(msg => `
    <div class="message ${msg.role}">
      <div class="message-avatar">${msg.role === "user" ? "ZM" : state.currentModel.icon}</div>
      <div>
        <div class="message-content">${msg.content}</div>
        <div class="message-meta">${msg.role === "ai" ? state.currentModel.name + " · " : ""}${msg.time}</div>
      </div>
    </div>
  `).join("");
}

function toggleModelDropdown() {
  document.getElementById("modelDropdown").classList.toggle("show");
}

function selectModel(id) {
  const model = MOCK_DATA.models.find(m => m.id === id);
  if (!model) return;
  state.currentModel = model;
  document.getElementById("modelDropdown").classList.remove("show");
  renderChat(document.getElementById("pageContainer"));
  showToast(`已切换到 ${model.name}`, "success");
}

document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("modelDropdown");
  const selector = document.querySelector(".model-selector");
  if (dropdown && dropdown.classList.contains("show") && !selector?.contains(e.target)) {
    dropdown.classList.remove("show");
  }
});

function newChat() {
  state.chatMessages = [];
  renderChat(document.getElementById("pageContainer"));
  showToast("已创建新对话", "success");
}

function loadChat(id) {
  state.chatMessages = [];
  const ch = MOCK_DATA.chatHistory.find(c => c.id === id);
  if (ch) {
    state.chatMessages = [
      { role: "user", content: ch.title, time: ch.time },
      { role: "ai", content: ch.preview, time: ch.time },
    ];
  }
  renderChat(document.getElementById("pageContainer"));
}

function clearChat() {
  state.chatMessages = [];
  renderChat(document.getElementById("pageContainer"));
}

function useTemplate(id) {
  const t = MOCK_DATA.promptTemplates.find(t => t.id === id);
  if (!t) return;
  const input = document.getElementById("chatInput");
  input.value = t.content;
  input.focus();
  autoResize(input);
}

function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 120) + "px";
}

function handleChatKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function toggleWebSearch(el) {
  el.classList.toggle("active");
  const active = el.classList.contains("active");
  const estimate = document.getElementById("costEstimate");
  const baseCost = state.currentModel.costPerCall;
  const total = active ? baseCost + 2 : baseCost;
  estimate.innerHTML = `预估消耗: <strong>${total} 积分</strong>${active ? " (含联网搜索+2)" : ""}`;
  showToast(active ? "已开启联网搜索 (+2积分/次)" : "已关闭联网搜索", "info");
}

const aiResponses = [
  "这是一个很好的问题。根据我的分析，可以从以下几个维度来思考：\n\n1. **问题拆解**：首先需要明确核心诉求，将大问题分解为可执行的子任务。\n\n2. **方案设计**：针对每个子任务设计具体方案，考虑可行性与效率。\n\n3. **实施路径**：制定时间线，分阶段推进，预留调整空间。\n\n4. **风险评估**：提前识别潜在风险，准备 Plan B。\n\n需要我针对某个环节展开详细说明吗？",
  "根据您提供的信息，我建议如下处理：\n\n- 优先确认关键参数和约束条件\n- 采用渐进式策略，先做 MVP 验证再迭代\n- 注意边界情况处理，确保鲁棒性\n\n这个方案在成本和效果之间取得了较好平衡。如果您有更具体的场景需求，我可以进一步优化建议。",
  "我来为您详细解答：\n\n**核心思路**是利用分治法将复杂问题简化。具体步骤如下：\n\n```python\ndef solve(data):\n    # 步骤1：预处理\n    cleaned = preprocess(data)\n    # 步骤2：核心计算\n    result = compute(cleaned)\n    # 步骤3：后处理\n    return format_output(result)\n```\n\n这个实现的时间复杂度是 O(n log n)，空间复杂度 O(n)，对于大多数场景都能高效运行。",
  "基于当前的分析，我的建议是：\n\n1. **短期**（1-2周）：快速搭建原型，验证核心假设\n2. **中期**（1-2月）：基于反馈迭代，完善功能\n3. **长期**（3-6月）：规模化推广，建立壁垒\n\n关键成功因素在于：团队能力匹配、市场需求验证、资金使用效率。建议每周做一次复盘，及时调整策略。",
];

function sendMessage() {
  const input = document.getElementById("chatInput");
  const text = input.value.trim();
  if (!text) return;

  const cost = state.currentModel.costPerCall;
  if (!deductCredits(cost, `${state.currentModel.name} 对话`)) return;

  const now = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  state.chatMessages.push({ role: "user", content: text, time: now });

  input.value = "";
  autoResize(input);

  // 重新渲染消息
  const msgContainer = document.getElementById("chatMessages");
  msgContainer.innerHTML = renderMessages();
  msgContainer.scrollTop = msgContainer.scrollHeight;

  // 模拟 AI 回复
  const thinkingMsg = document.createElement("div");
  thinkingMsg.className = "message ai";
  thinkingMsg.innerHTML = `
    <div class="message-avatar">${state.currentModel.icon}</div>
    <div>
      <div class="message-content" style="display:flex;align-items:center;gap:8px">
        <div class="loading-spinner" style="width:16px;height:16px;border:2px solid var(--border-light);border-top-color:var(--accent);border-radius:50%;animation:spin 0.8s linear infinite"></div>
        <span style="color:var(--text-secondary)">${state.currentModel.name} 正在思考...</span>
      </div>
    </div>
  `;
  msgContainer.appendChild(thinkingMsg);
  msgContainer.scrollTop = msgContainer.scrollHeight;

  setTimeout(() => {
    thinkingMsg.remove();
    const response = aiResponses[Math.floor(Math.random() * aiResponses.length)];
    const aiTime = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
    state.chatMessages.push({ role: "ai", content: response, time: aiTime });
    msgContainer.innerHTML = renderMessages();
    msgContainer.scrollTop = msgContainer.scrollHeight;
    showToast(`消耗 ${cost} 积分`, "success");
  }, 1200 + Math.random() * 800);
}

// ===== AI 绘画 =====
function renderImage(c) {
  c.innerHTML = `
    <div class="tool-page-layout">
      <div class="tool-config-panel">
        <h3>🎨 AI 绘画</h3>
        <div class="config-group">
          <div class="config-label">选择模型</div>
          <div class="model-options">
            ${MOCK_DATA.imageModels.map(m => `
              <div class="model-option ${m.id === state.selectedImageModel.id ? "selected" : ""}" onclick="selectImageModel('${m.id}')">
                <span class="model-option-icon">${m.icon}</span>
                <div class="model-option-info">
                  <div class="model-option-name">${m.name}</div>
                  <div class="model-option-desc">${m.desc} · ${m.quality}</div>
                </div>
                <div class="model-option-cost">${m.costPerImage}积分</div>
              </div>
            `).join("")}
          </div>
        </div>
        <div class="config-group">
          <div class="config-label">提示词</div>
          <textarea class="config-textarea" id="imagePrompt" placeholder="描述你想要生成的图片，例如：一只穿着宇航服的柴犬在月球表面奔跑，电影级光影，超高清细节"></textarea>
        </div>
        <div class="config-group">
          <div class="config-label">生成数量</div>
          <div class="count-options">
            ${[1, 2, 3, 4].map(n => `
              <div class="count-option ${state.imageCount === n ? "selected" : ""}" onclick="setImageCount(${n})">${n}张</div>
            `).join("")}
          </div>
        </div>
        <div class="config-group">
          <div class="config-label">图片尺寸</div>
          <div class="size-options">
            ${["1:1", "4:3", "3:4", "16:9"].map(s => `
              <div class="size-option ${state.imageSize === s ? "selected" : ""}" onclick="setImageSize('${s}')">${s}</div>
            `).join("")}
          </div>
        </div>
        <div class="config-group">
          <div class="config-label">
            总消耗
            <span class="cost-hint">${state.selectedImageModel.costPerImage * state.imageCount} 积分</span>
          </div>
          <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="generateImages()">
            🎨 开始生成
          </button>
        </div>
      </div>
      <div class="tool-result-panel">
        <div class="tool-result-header">
          <span style="font-weight:600">生成结果</span>
          <span style="font-size:12px;color:var(--text-secondary)" id="imageResultInfo"></span>
        </div>
        <div class="tool-result-body" id="imageResultBody">
          <div class="empty-state">
            <div class="empty-state-icon">🎨</div>
            <div>输入提示词，开始创作你的 AI 艺术作品</div>
            <div style="font-size:12px">支持 SD XL · Midjourney · DALL·E 3 · FLUX.1 Pro 等</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function selectImageModel(id) {
  state.selectedImageModel = MOCK_DATA.imageModels.find(m => m.id === id);
  renderImage(document.getElementById("pageContainer"));
}

function setImageCount(n) {
  state.imageCount = n;
  renderImage(document.getElementById("pageContainer"));
}

function setImageSize(s) {
  state.imageSize = s;
  renderImage(document.getElementById("pageContainer"));
}

const imagePlaceholders = ["🌃", "🏔️", "🌊", "🦋", "🌸", "🚀", "🎨", "📷"];

function generateImages() {
  const prompt = document.getElementById("imagePrompt").value.trim();
  if (!prompt) {
    showToast("请输入提示词", "error");
    return;
  }
  const cost = state.selectedImageModel.costPerImage * state.imageCount;
  if (!deductCredits(cost, `${state.selectedImageModel.name} 文生图 ×${state.imageCount}`)) return;

  const body = document.getElementById("imageResultBody");
  document.getElementById("imageResultInfo").textContent = `生成中...`;

  let html = '<div class="image-gallery">';
  for (let i = 0; i < state.imageCount; i++) {
    html += `
      <div class="image-item" id="img-gen-${i}">
        <div class="image-item-generate">
          <div style="text-align:center">
            <div class="loading-spinner"></div>
            <div style="font-size:13px">生成中 ${i + 1}/${state.imageCount}...</div>
          </div>
        </div>
      </div>
    `;
  }
  html += "</div>";
  body.innerHTML = html;

  state.imageCount;
  for (let i = 0; i < state.imageCount; i++) {
    setTimeout(() => {
      const el = document.getElementById(`img-gen-${i}`);
      if (el) {
        const emoji = imagePlaceholders[Math.floor(Math.random() * imagePlaceholders.length)];
        el.innerHTML = `
          <div class="placeholder-icon">
            <span style="font-size:64px">${emoji}</span>
            <span>${prompt.slice(0, 20)}${prompt.length > 20 ? "..." : ""}</span>
            <span style="font-size:11px;color:var(--text-muted)">${state.imageSize} · ${state.selectedImageModel.name}</span>
          </div>
        `;
        el.style.background = `linear-gradient(135deg, hsl(${Math.random()*360}, 50%, 25%) 0%, hsl(${Math.random()*360}, 50%, 20%) 100%)`;
      }
      if (i === state.imageCount - 1) {
        document.getElementById("imageResultInfo").textContent = `已完成 · 消耗 ${cost} 积分`;
        showToast(`生成完成，消耗 ${cost} 积分`, "success");
      }
    }, 1500 + i * 800);
  }
}

// ===== AI 视频 =====
function renderVideo(c) {
  c.innerHTML = `
    <div class="tool-page-layout">
      <div class="tool-config-panel">
        <h3>🎬 AI 视频生成</h3>
        <div class="config-group">
          <div class="config-label">选择模型</div>
          <div class="model-options">
            ${MOCK_DATA.videoModels.map(m => `
              <div class="model-option ${m.id === state.selectedVideoModel.id ? "selected" : ""}" onclick="selectVideoModel('${m.id}')">
                <span class="model-option-icon">${m.icon}</span>
                <div class="model-option-info">
                  <div class="model-option-name">${m.name}</div>
                  <div class="model-option-desc">${m.desc} · ${m.duration}</div>
                </div>
                <div class="model-option-cost">${m.costPerVideo}积分</div>
              </div>
            `).join("")}
          </div>
        </div>
        <div class="config-group">
          <div class="config-label">视频描述</div>
          <textarea class="config-textarea" id="videoPrompt" placeholder="描述你想要生成的视频内容，例如：夕阳下的海边，海浪拍打沙滩，一只海鸥飞过" style="min-height:100px"></textarea>
        </div>
        <div class="config-group">
          <div class="config-label">参考图片（可选）</div>
          <div class="upload-zone" style="padding:24px" onclick="showToast('图片上传功能演示','info')">
            <div style="font-size:32px">📸</div>
            <div style="font-size:13px;margin-top:8px">点击上传参考图（图生视频）</div>
          </div>
        </div>
        <div class="config-group">
          <div class="config-label">
            总消耗
            <span class="cost-hint">${state.selectedVideoModel.costPerVideo} 积分</span>
          </div>
          <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="generateVideo()">
            🎬 生成视频
          </button>
        </div>
      </div>
      <div class="tool-result-panel">
        <div class="tool-result-header">
          <span style="font-weight:600">生成结果</span>
          <span style="font-size:12px;color:var(--text-secondary)" id="videoResultInfo"></span>
        </div>
        <div class="tool-result-body" id="videoResultBody">
          <div class="empty-state">
            <div class="empty-state-icon">🎬</div>
            <div>描述你想要的视频画面，AI 为你创作</div>
            <div style="font-size:12px">支持可灵 AI · Runway Gen-3 · Luma · Pika</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function selectVideoModel(id) {
  state.selectedVideoModel = MOCK_DATA.videoModels.find(m => m.id === id);
  renderVideo(document.getElementById("pageContainer"));
}

function generateVideo() {
  const prompt = document.getElementById("videoPrompt").value.trim();
  if (!prompt) {
    showToast("请输入视频描述", "error");
    return;
  }
  const cost = state.selectedVideoModel.costPerVideo;
  if (!deductCredits(cost, `${state.selectedVideoModel.name} 视频生成`)) return;

  const body = document.getElementById("videoResultBody");
  document.getElementById("videoResultInfo").textContent = "生成中...";

  body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:16px">
      <div style="width:80%;max-width:480px;aspect-ratio:16/9;background:var(--bg-surface-2);border-radius:var(--radius);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden">
        <div style="position:absolute;inset:0;background:linear-gradient(135deg,hsl(${Math.random()*360},50%,20%),hsl(${Math.random()*360},50%,15%))"></div>
        <div style="position:relative;text-align:center;z-index:1">
          <div class="loading-spinner" style="width:40px;height:40px;border:4px solid rgba(255,255,255,0.2);border-top-color:#fff;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px"></div>
          <div style="color:#fff;font-weight:600">视频生成中...</div>
          <div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:4px">${state.selectedVideoModel.name} · ${state.selectedVideoModel.duration}</div>
        </div>
      </div>
      <div style="color:var(--text-secondary);font-size:13px">预计耗时 30-60 秒，请耐心等待</div>
    </div>
  `;

  setTimeout(() => {
    body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:16px">
        <div style="width:80%;max-width:480px;aspect-ratio:16/9;background:linear-gradient(135deg,hsl(${Math.random()*360},50%,25%),hsl(${Math.random()*360},50%,15%));border-radius:var(--radius);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;cursor:pointer">
          <div style="text-align:center">
            <div style="font-size:64px">▶️</div>
            <div style="color:#fff;font-weight:600;margin-top:12px">${prompt.slice(0, 30)}${prompt.length > 30 ? "..." : ""}</div>
            <div style="color:rgba(255,255,255,0.6);font-size:12px;margin-top:4px">${state.selectedVideoModel.name} · ${state.selectedVideoModel.duration}</div>
          </div>
        </div>
        <div style="display:flex;gap:12px">
          <button class="btn btn-secondary btn-sm" onclick="showToast('下载功能演示','info')">⬇ 下载</button>
          <button class="btn btn-secondary btn-sm" onclick="showToast('分享功能演示','info')">📤 分享</button>
          <button class="btn btn-secondary btn-sm" onclick="generateVideo()">🔄 重新生成</button>
        </div>
      </div>
    `;
    document.getElementById("videoResultInfo").textContent = `已完成 · 消耗 ${cost} 积分`;
    showToast(`视频生成完成，消耗 ${cost} 积分`, "success");
  }, 3000);
}

// ===== 文档解析 =====
function renderDocument(c) {
  c.innerHTML = `
    <div class="tool-page-layout">
      <div class="tool-config-panel">
        <h3>📄 文档解析</h3>
        <div class="config-group">
          <div class="config-label">上传文档</div>
          <div class="upload-zone" onclick="simulateUpload()">
            <div class="upload-icon">📄</div>
            <div class="upload-title">点击或拖拽上传文件</div>
            <div class="upload-hint">支持 PDF / Word / PPT / Excel · 100页内 10~20 积分</div>
          </div>
          <div class="file-list" id="fileList"></div>
        </div>
        <div class="config-group">
          <div class="config-label">选择操作</div>
          <div class="doc-actions">
            <div class="doc-action-btn" onclick="docAction('summary')">📝 智能摘要</div>
            <div class="doc-action-btn" onclick="docAction('qa')">💬 问答对话</div>
            <div class="doc-action-btn" onclick="docAction('translate')">🌐 翻译</div>
            <div class="doc-action-btn" onclick="docAction('extract')">🔍 信息提取</div>
          </div>
        </div>
        <div class="config-group">
          <div class="config-label">提问</div>
          <textarea class="config-textarea" id="docQuestion" placeholder="针对文档提问，例如：请总结这份报告的核心观点" style="min-height:80px"></textarea>
        </div>
        <div class="config-group">
          <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="analyzeDoc()">
            📄 开始解析 (15 积分)
          </button>
        </div>
      </div>
      <div class="tool-result-panel">
        <div class="tool-result-header">
          <span style="font-weight:600">解析结果</span>
          <span style="font-size:12px;color:var(--text-secondary)" id="docResultInfo"></span>
        </div>
        <div class="tool-result-body" id="docResultBody">
          <div class="empty-state">
            <div class="empty-state-icon">📄</div>
            <div>上传文档后，AI 帮你快速理解内容</div>
            <div style="font-size:12px">支持摘要 · 问答 · 翻译 · 信息提取</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function simulateUpload() {
  const fileList = document.getElementById("fileList");
  state.uploadedFile = { name: "2026年AI行业研究报告.pdf", size: "2.3 MB", pages: 48 };
  fileList.innerHTML = `
    <div class="file-item">
      <div class="file-icon">📄</div>
      <div class="file-info">
        <div class="file-name">${state.uploadedFile.name}</div>
        <div class="file-meta">${state.uploadedFile.size} · ${state.uploadedFile.pages} 页</div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="removeFile()">✕</button>
    </div>
  `;
  showToast("文件上传成功", "success");
}

function removeFile() {
  state.uploadedFile = null;
  document.getElementById("fileList").innerHTML = "";
}

function docAction(action) {
  const actions = {
    summary: "📝 已选择「智能摘要」模式",
    qa: "💬 已选择「问答对话」模式",
    translate: "🌐 已选择「翻译」模式",
    extract: "🔍 已选择「信息提取」模式",
  };
  showToast(actions[action], "info");
}

function analyzeDoc() {
  if (!state.uploadedFile) {
    showToast("请先上传文档", "error");
    return;
  }
  const question = document.getElementById("docQuestion").value.trim();
  if (!question) {
    showToast("请输入问题或选择操作", "error");
    return;
  }
  const cost = 15;
  if (!deductCredits(cost, `文档解析 - ${state.uploadedFile.name}`)) return;

  const body = document.getElementById("docResultBody");
  document.getElementById("docResultInfo").textContent = "解析中...";

  body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:16px">
      <div class="loading-spinner" style="width:32px;height:32px;border:3px solid var(--border-light);border-top-color:var(--accent);border-radius:50%;animation:spin 0.8s linear infinite"></div>
      <div style="color:var(--text-secondary)">正在解析文档...</div>
    </div>
  `;

  setTimeout(() => {
    body.innerHTML = `
      <div style="max-width:600px;margin:0 auto">
        <div class="card" style="margin-bottom:16px">
          <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">📄 ${state.uploadedFile.name} · ${state.uploadedFile.pages}页</div>
          <div style="font-size:14px;line-height:1.8;color:var(--text-primary)">
            <strong>问题：</strong>${question}
          </div>
        </div>
        <div class="card" style="background:var(--bg-surface-2)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
            <span style="font-size:20px">🤖</span>
            <strong>AI 解析结果</strong>
          </div>
          <div style="font-size:14px;line-height:1.8;color:var(--text-secondary)">
            根据对文档的深度解析，以下是核心要点：
            <br><br>
            <strong style="color:var(--text-primary)">1. 核心观点</strong><br>
            文档主要探讨了 2026 年 AI 行业的发展趋势，指出大模型能力持续提升的同时，应用场景从通用对话向垂直领域深化。
            <br><br>
            <strong style="color:var(--text-primary)">2. 关键数据</strong><br>
            • 全球 AI 市场规模预计达到 1.2 万亿美元<br>
            • 大模型 API 调用量同比增长 320%<br>
            • 企业级 AI 采纳率从 28% 提升至 52%
            <br><br>
            <strong style="color:var(--text-primary)">3. 趋势判断</strong><br>
            未来 6-12 个月，多模态融合、Agent 化、端侧部署将成为三大核心方向。建议重点关注算力成本下降带来的应用层爆发机会。
          </div>
        </div>
      </div>
    `;
    document.getElementById("docResultInfo").textContent = `已完成 · 消耗 ${cost} 积分`;
    showToast(`文档解析完成，消耗 ${cost} 积分`, "success");
  }, 2500);
}

// ===== 积分中心 =====
function renderCredits(c) {
  const txs = MOCK_DATA.transactions;
  const consumed = txs.filter(t => t.type === "消费").reduce((s, t) => s + Math.abs(t.amount), 0);
  const recharged = txs.filter(t => t.type === "充值").reduce((s, t) => s + t.amount, 0);

  c.innerHTML = `
    <div class="credits-overview">
      <div class="credits-main-card">
        <div class="credits-main-label">💎 当前积分余额</div>
        <div class="credits-main-value">${formatCredits(MOCK_DATA.user.credits)}</div>
        <div class="credits-main-actions">
          <button class="btn" onclick="location.hash='#/recharge'">💳 去充值</button>
          <button class="btn" onclick="location.hash='#/tasks'">🎁 赚积分</button>
        </div>
      </div>
      <div class="credits-stat-card">
        <div class="credits-stat-label">本月已消费</div>
        <div class="credits-stat-value" style="color:var(--danger)">${formatCredits(consumed)}</div>
      </div>
      <div class="credits-stat-card">
        <div class="credits-stat-label">累计充值</div>
        <div class="credits-stat-value" style="color:var(--success)">${formatCredits(recharged)}</div>
      </div>
    </div>

    <div class="table-wrapper">
      <div class="table-header">
        <h3 style="font-size:16px;font-weight:600">📋 消费明细</h3>
        <div class="table-filters">
          ${["all", "消费", "充值", "奖励"].map(f => `
            <div class="filter-chip ${state.txFilter === f ? "active" : ""}" onclick="filterTx('${f}')">
              ${f === "all" ? "全部" : f === "消费" ? "消费" : f === "充值" ? "充值" : "奖励"}
            </div>
          `).join("")}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>时间</th>
            <th>类型</th>
            <th>工具/说明</th>
            <th>积分变动</th>
            <th>余额</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          ${getFilteredTx().map(tx => `
            <tr>
              <td style="white-space:nowrap">${tx.time}</td>
              <td><span class="tag ${tx.type === '消费' ? 'tag-basic' : tx.type === '充值' ? 'tag-recommend' : 'tag-free'}">${tx.type}</span></td>
              <td>${tx.tool}</td>
              <td class="${tx.amount > 0 ? 'amount-positive' : 'amount-negative'}">${tx.amount > 0 ? "+" : ""}${tx.amount}</td>
              <td>${formatCredits(tx.balance)}</td>
              <td><span class="status-badge ${tx.status === '成功' ? 'status-success' : tx.status === '失败返还' ? 'status-failed' : 'status-refunded'}">${tx.status}</span></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div style="margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="card">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:12px">📌 积分规则</h3>
        <div style="font-size:13px;color:var(--text-secondary);line-height:2">
          • 付费充值积分 <strong style="color:var(--text-primary)">永久有效</strong><br>
          • 活动/签到/体验积分 <strong style="color:var(--text-primary)">30天有效期</strong><br>
          • 调用失败/违规拦截 <strong style="color:var(--success)">全额返还</strong><br>
          • 未使用付费积分可按比例 <strong style="color:var(--text-primary)">申请退款</strong><br>
          • 充值满一定金额可开具 <strong style="color:var(--text-primary)">电子发票</strong>
        </div>
      </div>
      <div class="card">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:12px">💰 积分定价参考</h3>
        <div style="font-size:13px;color:var(--text-secondary);line-height:2">
          • 入门档模型: <strong style="color:var(--accent)">1~2 积分/1k tokens</strong><br>
          • 进阶档模型: <strong style="color:var(--accent)">3~5 积分/1k tokens</strong><br>
          • 旗舰档模型: <strong style="color:var(--accent)">8~12 积分/1k tokens</strong><br>
          • 推理档模型: <strong style="color:var(--accent)">15~20 积分/1k tokens</strong><br>
          • 文生图: <strong style="color:var(--accent)">5~30 积分/张</strong> · 视频生成: <strong style="color:var(--accent)">50~100 积分/条</strong>
        </div>
      </div>
    </div>
  `;
}

function getFilteredTx() {
  if (state.txFilter === "all") return MOCK_DATA.transactions;
  if (state.txFilter === "奖励") return MOCK_DATA.transactions.filter(t => t.type === "签到奖励" || t.type === "会员赠送");
  return MOCK_DATA.transactions.filter(t => t.type === state.txFilter);
}

function filterTx(f) {
  state.txFilter = f;
  renderCredits(document.getElementById("pageContainer"));
}

// ===== 充值套餐 =====
function renderRecharge(c) {
  c.innerHTML = `
    <div class="section-header">
      <h3>💳 积分充值</h3>
      <span style="font-size:13px;color:var(--text-secondary)">充得越多，单价越低</span>
    </div>
    <div class="recharge-grid">
      ${MOCK_DATA.rechargePackages.map(p => `
        <div class="recharge-card ${p.popular ? "popular" : ""} ${state.selectedRechargePackage === p.id ? "selected" : ""}" onclick="selectRecharge('${p.id}')">
          ${p.popular ? '<div class="popular-badge">🔥 最受欢迎</div>' : ""}
          <div class="recharge-tag">${p.tag}</div>
          <div class="recharge-price">¥${p.price}</div>
          <div class="recharge-credits">${formatCredits(p.credits)} 积分</div>
          <div class="recharge-unit-price">约 ${p.unitPrice} 元/积分</div>
        </div>
      `).join("")}
    </div>

    <div class="section-header">
      <h3>👑 会员订阅</h3>
      <span style="font-size:13px;color:var(--text-secondary)">每月赠送积分 + 全工具 9 折</span>
    </div>
    <div class="membership-grid">
      ${MOCK_DATA.membershipPlans.map((m, i) => `
        <div class="membership-card ${i === 0 ? "featured" : ""}">
          <div class="membership-name">${m.name}</div>
          <div class="membership-price">¥${m.price}<span class="recharge-price-unit">/${m.period}</span></div>
          <div class="membership-period">每月赠送 ${m.credits} 积分 · 全工具 ${m.discount}</div>
          <ul class="membership-features">
            ${m.features.map(f => `<li>${f}</li>`).join("")}
          </ul>
          <button class="btn ${i === 0 ? "btn-primary" : "btn-secondary"}" style="width:100%;justify-content:center" onclick="subscribe('${m.id}')">
            ${i === 0 ? "立即订阅" : "选择方案"}
          </button>
        </div>
      `).join("")}
    </div>

    <div style="margin-top:24px" class="card">
      <h3 style="font-size:15px;font-weight:600;margin-bottom:12px">📋 充值说明</h3>
      <div style="font-size:13px;color:var(--text-secondary);line-height:2">
        • 支持微信支付、支付宝、Stripe 国际支付<br>
        • 付费充值积分永久有效，无过期风险<br>
        • 月/季/年会员每月固定赠送积分，同时享受全工具 9 折积分消耗<br>
        • 会员赠送积分有效期 30 天，请在有效期内使用<br>
        • 充值满 99 元可申请开具电子发票<br>
        • 未使用的付费积分可按比例申请退款（赠送积分不予退还）
      </div>
    </div>
  `;
}

function selectRecharge(id) {
  state.selectedRechargePackage = id;
  const pkg = MOCK_DATA.rechargePackages.find(p => p.id === id);
  showModal(`
    <div style="text-align:center">
      <div style="font-size:32px;margin-bottom:12px">💳</div>
      <h3 style="font-size:18px;font-weight:700;margin-bottom:8px">确认充值</h3>
      <div style="font-size:14px;color:var(--text-secondary);margin-bottom:20px">
        ${pkg.tag} · ${formatCredits(pkg.credits)} 积分
      </div>
      <div style="font-size:36px;font-weight:800;color:var(--accent);margin-bottom:24px">¥${pkg.price}</div>
      <div style="display:flex;gap:12px;justify-content:center;margin-bottom:24px">
        <button class="btn btn-secondary" style="flex:1" onclick="payOrder('微信支付', ${pkg.price}, ${pkg.credits})">💚 微信支付</button>
        <button class="btn btn-secondary" style="flex:1" onclick="payOrder('支付宝', ${pkg.price}, ${pkg.credits})">💙 支付宝</button>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="closeModal()">取消</button>
    </div>
  `);
}

function payOrder(method, price, credits) {
  closeModal();
  showToast(`${method} 支付成功！`, "success");
  updateCredits(credits);
  MOCK_DATA.transactions.unshift({
    id: genId(),
    time: new Date().toLocaleString("zh-CN", { hour12: false }),
    type: "充值",
    tool: `¥${price}积分包 (${method})`,
    amount: +credits,
    balance: MOCK_DATA.user.credits,
    status: "成功",
  });
  setTimeout(() => {
    state.selectedRechargePackage = null;
    renderRecharge(document.getElementById("pageContainer"));
  }, 500);
}

function subscribe(id) {
  const plan = MOCK_DATA.membershipPlans.find(m => m.id === id);
  showModal(`
    <div style="text-align:center">
      <div style="font-size:32px;margin-bottom:12px">👑</div>
      <h3 style="font-size:18px;font-weight:700;margin-bottom:8px">订阅 ${plan.name}</h3>
      <div style="font-size:14px;color:var(--text-secondary);margin-bottom:20px">
        每月赠送 ${plan.credits} 积分 · 全工具 ${plan.discount}
      </div>
      <div style="font-size:36px;font-weight:800;color:var(--accent);margin-bottom:24px">¥${plan.price}/${plan.period}</div>
      <div style="display:flex;gap:12px;justify-content:center;margin-bottom:24px">
        <button class="btn btn-primary" style="flex:1" onclick="confirmSubscribe('${plan.id}')">确认订阅</button>
        <button class="btn btn-secondary" style="flex:1" onclick="closeModal()">取消</button>
      </div>
    </div>
  `);
}

function confirmSubscribe(id) {
  const plan = MOCK_DATA.membershipPlans.find(m => m.id === id);
  closeModal();
  showToast(`订阅成功！获得 ${plan.credits} 积分`, "success");
  updateCredits(plan.credits);
  MOCK_DATA.transactions.unshift({
    id: genId(),
    time: new Date().toLocaleString("zh-CN", { hour12: false }),
    type: "会员赠送",
    tool: `${plan.name} 积分`,
    amount: +plan.credits,
    balance: MOCK_DATA.user.credits,
    status: "成功",
  });
}

// ===== 任务中心 =====
function renderTasks(c) {
  c.innerHTML = `
    <div class="card" style="margin-bottom:24px;background:var(--gradient-2);border:none">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-size:14px;opacity:0.85;margin-bottom:4px">📅 今日签到</div>
          <div style="font-size:20px;font-weight:700">${state.checkInDone ? "今日已签到 ✓" : "签到领 5 积分"}</div>
        </div>
        <button class="btn ${state.checkInDone ? "btn-secondary" : "btn-primary"}" onclick="checkIn()" ${state.checkInDone ? "disabled" : ""}>
          ${state.checkInDone ? "已签到" : "立即签到"}
        </button>
      </div>
    </div>

    <div class="section-header">
      <h3>🎯 积分任务</h3>
      <span style="font-size:13px;color:var(--text-secondary)">完成任务赚取免费积分</span>
    </div>
    <div class="task-grid">
      ${MOCK_DATA.tasks.map(t => `
        <div class="task-card">
          <div class="task-icon">${t.icon}</div>
          <div class="task-info">
            <div class="task-name">${t.name} ${t.repeatable ? '<span class="tag tag-free" style="margin-left:4px">可重复</span>' : ""}</div>
            <div class="task-desc">${t.desc}</div>
            <div class="task-reward">+${t.reward} 积分</div>
          </div>
          <div class="task-action">
            ${t.done && !t.repeatable
              ? '<div class="task-done">✓ 已完成</div>'
              : `<button class="btn btn-primary btn-sm" onclick="doTask('${t.id}')">${t.repeatable ? "去邀请" : "去完成"}</button>`
            }
          </div>
        </div>
      `).join("")}
    </div>

    <div style="margin-top:24px" class="card">
      <h3 style="font-size:15px;font-weight:600;margin-bottom:12px">🎁 邀请好友</h3>
      <div style="display:flex;align-items:center;gap:16px">
        <div style="flex:1">
          <div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">分享你的专属邀请链接，好友注册成功双方各得 50 积分，好友首次充值再额外奖励 100 积分</div>
          <div style="display:flex;gap:8px">
            <input class="config-input" value="https://aihub.com/invite/ZM2026" readonly id="inviteLink">
            <button class="btn btn-primary btn-sm" onclick="copyInvite()">复制链接</button>
          </div>
        </div>
        <div style="text-align:center">
          <div style="font-size:32px;font-weight:800;color:var(--accent)">8</div>
          <div style="font-size:12px;color:var(--text-secondary)">已邀请好友</div>
        </div>
      </div>
    </div>
  `;
}

function checkIn() {
  if (state.checkInDone) return;
  state.checkInDone = true;
  updateCredits(5);
  MOCK_DATA.transactions.unshift({
    id: genId(),
    time: new Date().toLocaleString("zh-CN", { hour12: false }),
    type: "签到奖励",
    tool: "每日签到",
    amount: +5,
    balance: MOCK_DATA.user.credits,
    status: "成功",
  });
  showToast("签到成功！+5 积分", "success");
  renderTasks(document.getElementById("pageContainer"));
}

function doTask(id) {
  const task = MOCK_DATA.tasks.find(t => t.id === id);
  if (!task) return;
  if (task.repeatable) {
    showModal(`
      <div style="text-align:center">
        <div style="font-size:32px;margin-bottom:12px">🎁</div>
        <h3 style="font-size:18px;font-weight:700;margin-bottom:8px">邀请好友</h3>
        <div style="font-size:14px;color:var(--text-secondary);margin-bottom:16px">${task.desc}</div>
        <div style="background:var(--bg-surface-3);padding:12px;border-radius:var(--radius-sm);margin-bottom:16px;font-size:13px">
          https://aihub.com/invite/ZM2026
        </div>
        <button class="btn btn-primary" onclick="closeModal();showToast('链接已复制','success')">复制邀请链接</button>
      </div>
    `);
    return;
  }
  task.done = true;
  updateCredits(task.reward);
  MOCK_DATA.transactions.unshift({
    id: genId(),
    time: new Date().toLocaleString("zh-CN", { hour12: false }),
    type: "任务奖励",
    tool: task.name,
    amount: +task.reward,
    balance: MOCK_DATA.user.credits,
    status: "成功",
  });
  showToast(`任务完成！+${task.reward} 积分`, "success");
  renderTasks(document.getElementById("pageContainer"));
}

function copyInvite() {
  const input = document.getElementById("inviteLink");
  input.select();
  try {
    document.execCommand("copy");
    showToast("邀请链接已复制", "success");
  } catch (e) {
    showToast("复制失败，请手动复制", "error");
  }
}

// ===== 个人中心 =====
function renderProfile(c) {
  const u = MOCK_DATA.user;
  c.innerHTML = `
    <div class="profile-layout">
      <div class="profile-card">
        <div class="profile-avatar">${u.avatar}</div>
        <div class="profile-name">${u.name}</div>
        <div class="profile-badge">${u.membership}</div>
        <div class="profile-stats">
          <div class="profile-stat">
            <div class="profile-stat-value">${formatCredits(u.credits)}</div>
            <div class="profile-stat-label">积分余额</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value">42</div>
            <div class="profile-stat-label">对话次数</div>
          </div>
          <div class="profile-stat">
            <div class="profile-stat-value">18</div>
            <div class="profile-stat-label">生成作品</div>
          </div>
        </div>
      </div>
      <div class="profile-info-card">
        <h3 style="font-size:16px;font-weight:600;margin-bottom:16px">👤 基本信息</h3>
        <div class="info-row"><div class="info-label">昵称</div><div class="info-value">${u.name}</div></div>
        <div class="info-row"><div class="info-label">手机号</div><div class="info-value">${u.phone}</div></div>
        <div class="info-row"><div class="info-label">邮箱</div><div class="info-value">${u.email}</div></div>
        <div class="info-row"><div class="info-label">注册时间</div><div class="info-value">${u.registerDate}</div></div>
        <div class="info-row"><div class="info-label">会员等级</div><div class="info-value">${u.membership} (至 ${u.membershipExpiry})</div></div>
        <div class="info-row"><div class="info-label">累计消费</div><div class="info-value">¥${u.totalSpent}</div></div>
        <div style="margin-top:20px;display:flex;gap:12px">
          <button class="btn btn-primary" onclick="showToast('编辑功能演示','info')">编辑资料</button>
          <button class="btn btn-secondary" onclick="showToast('修改密码功能演示','info')">修改密码</button>
          <button class="btn btn-ghost" onclick="showToast('已退出登录','info')">退出登录</button>
        </div>
      </div>
    </div>
  `;
}

// ===== 管理后台 =====
function renderAdmin(c) {
  c.innerHTML = `
    <div class="admin-layout">
      <div class="admin-tabs">
        <div class="admin-tab ${state.adminTab === 'dashboard' ? 'active' : ''}" onclick="switchAdminTab('dashboard')">📊 数据看板</div>
        <div class="admin-tab ${state.adminTab === 'models' ? 'active' : ''}" onclick="switchAdminTab('models')">🤖 模型管理</div>
        <div class="admin-tab ${state.adminTab === 'users' ? 'active' : ''}" onclick="switchAdminTab('users')">👥 用户管理</div>
        <div class="admin-tab ${state.adminTab === 'orders' ? 'active' : ''}" onclick="switchAdminTab('orders')">💰 订单财务</div>
      </div>
      <div id="adminContent"></div>
    </div>
  `;
  renderAdminContent();
}

function switchAdminTab(tab) {
  state.adminTab = tab;
  renderAdmin(document.getElementById("pageContainer"));
}

function renderAdminContent() {
  const el = document.getElementById("adminContent");
  if (!el) return;
  switch (state.adminTab) {
    case "dashboard": el.innerHTML = renderAdminDashboard(); break;
    case "models": el.innerHTML = renderAdminModels(); break;
    case "users": el.innerHTML = renderAdminUsers(); break;
    case "orders": el.innerHTML = renderAdminOrders(); break;
  }
}

function renderAdminDashboard() {
  const d = MOCK_DATA.adminDashboard;
  const maxActive = Math.max(...d.weekTrend.map(t => t.active));
  const maxRevenue = Math.max(...d.weekTrend.map(t => t.revenue));
  return `
    <div class="admin-stats">
      <div class="stat-card">
        <div class="stat-card-icon" style="background:var(--accent-light)">👥</div>
        <div class="stat-card-value">${formatCredits(d.todayActive)}</div>
        <div class="stat-card-label">今日活跃用户</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon" style="background:var(--success-light)">💰</div>
        <div class="stat-card-value">¥${formatCredits(d.todayRevenue)}</div>
        <div class="stat-card-label">今日充值金额</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon" style="background:var(--warning-light)">📊</div>
        <div class="stat-card-value">${formatCredits(d.todayCalls)}</div>
        <div class="stat-card-label">今日 API 调用</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon" style="background:rgba(186,104,200,0.15)">💎</div>
        <div class="stat-card-value">${formatCredits(d.todayCreditsConsumed)}</div>
        <div class="stat-card-label">今日积分消耗</div>
      </div>
    </div>

    <div class="chart-card">
      <h3 style="font-size:16px;font-weight:600;margin-bottom:16px">📈 近7日趋势</h3>
      <div class="bar-chart">
        ${d.weekTrend.map(t => `
          <div class="bar-item">
            <div class="bar-value">¥${(t.revenue/1000).toFixed(1)}k</div>
            <div class="bar" style="height:${(t.revenue/maxRevenue)*160}px" title="活跃:${t.active} 收入:¥${t.revenue}"></div>
            <div class="bar-label">${t.day}</div>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="chart-card">
      <h3 style="font-size:16px;font-weight:600;margin-bottom:16px">🔧 工具调用量分布</h3>
      ${d.toolUsage.map(t => `
        <div class="usage-bar-container">
          <div class="usage-bar-header">
            <span>${t.name}</span>
            <span>${formatCredits(t.calls)} 次 · <span class="percent">${t.percent}%</span></span>
          </div>
          <div class="usage-bar">
            <div class="usage-bar-fill" style="width:${t.percent}%"></div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderAdminModels() {
  return `
    <div class="table-wrapper">
      <div class="table-header">
        <h3 style="font-size:16px;font-weight:600">🤖 模型管理</h3>
        <button class="btn btn-primary btn-sm" onclick="showToast('新增模型功能演示','info')">+ 新增模型</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>模型名称</th>
            <th>类型</th>
            <th>档次</th>
            <th>积分单价</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${MOCK_DATA.models.map(m => `
            <tr>
              <td>${m.icon} ${m.name}</td>
              <td>大语言模型</td>
              <td><span class="tag tag-${m.tier}">${m.tierLabel}</span></td>
              <td>${m.costPerCall} 积分/次 · ${m.costPer1k}/1k tokens</td>
              <td><span class="status-badge status-success">在线</span></td>
              <td>
                <button class="btn btn-ghost btn-sm" onclick="showToast('编辑模型功能演示','info')">编辑</button>
                <button class="btn btn-ghost btn-sm" onclick="showToast('已下线','info')">下线</button>
              </td>
            </tr>
          `).join("")}
          ${MOCK_DATA.imageModels.map(m => `
            <tr>
              <td>${m.icon} ${m.name}</td>
              <td>文生图</td>
              <td><span class="tag tag-advanced">${m.quality}</span></td>
              <td>${m.costPerImage} 积分/张</td>
              <td><span class="status-badge status-success">在线</span></td>
              <td>
                <button class="btn btn-ghost btn-sm" onclick="showToast('编辑模型功能演示','info')">编辑</button>
                <button class="btn btn-ghost btn-sm" onclick="showToast('已下线','info')">下线</button>
              </td>
            </tr>
          `).join("")}
          ${MOCK_DATA.videoModels.map(m => `
            <tr>
              <td>${m.icon} ${m.name}</td>
              <td>视频生成</td>
              <td><span class="tag flag-ship">视频</span></td>
              <td>${m.costPerVideo} 积分/条</td>
              <td><span class="status-badge status-success">在线</span></td>
              <td>
                <button class="btn btn-ghost btn-sm" onclick="showToast('编辑模型功能演示','info')">编辑</button>
                <button class="btn btn-ghost btn-sm" onclick="showToast('已下线','info')">下线</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderAdminUsers() {
  return `
    <div class="table-wrapper">
      <div class="table-header">
        <h3 style="font-size:16px;font-weight:600">👥 用户管理</h3>
        <div style="display:flex;gap:8px">
          <input class="config-input" style="width:200px" placeholder="搜索用户...">
          <button class="btn btn-primary btn-sm" onclick="showToast('导出功能演示','info')">导出</button>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>用户</th>
            <th>手机号</th>
            <th>积分余额</th>
            <th>累计消费</th>
            <th>会员</th>
            <th>注册时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${MOCK_DATA.adminUsers.map(u => `
            <tr>
              <td style="font-weight:600">${u.name}</td>
              <td>${u.phone}</td>
              <td style="color:var(--accent);font-weight:600">${formatCredits(u.credits)}</td>
              <td>¥${u.totalSpent}</td>
              <td>${u.membership === "无" ? '<span style="color:var(--text-muted)">无</span>' : `<span class="tag tag-recommend">${u.membership}</span>`}</td>
              <td>${u.registerDate}</td>
              <td><span class="status-badge ${u.status === '正常' ? 'status-success' : 'status-failed'}">${u.status}</span></td>
              <td>
                <button class="btn btn-ghost btn-sm" onclick="showToast('积分调整功能演示','info')">调整积分</button>
                <button class="btn btn-ghost btn-sm" onclick="showToast('${u.status === '正常' ? '已封禁' : '已解封'}','info')">${u.status === "正常" ? "封禁" : "解封"}</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderAdminOrders() {
  return `
    <div class="admin-stats">
      <div class="stat-card">
        <div class="stat-card-icon" style="background:var(--success-light)">💰</div>
        <div class="stat-card-value">¥12,860</div>
        <div class="stat-card-label">本周充值总额</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon" style="background:var(--accent-light)">📦</div>
        <div class="stat-card-value">186</div>
        <div class="stat-card-label">本周订单数</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon" style="background:var(--warning-light)">↩️</div>
        <div class="stat-card-value">¥299</div>
        <div class="stat-card-label">本周退款</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-icon" style="background:rgba(186,104,200,0.15)">📊</div>
        <div class="stat-card-value">¥69.1</div>
        <div class="stat-card-label">客单价</div>
      </div>
    </div>
    <div class="table-wrapper">
      <div class="table-header">
        <h3 style="font-size:16px;font-weight:600">💰 充值订单</h3>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secondary btn-sm" onclick="showToast('导出功能演示','info')">导出</button>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>订单号</th>
            <th>用户</th>
            <th>金额</th>
            <th>积分</th>
            <th>套餐</th>
            <th>支付方式</th>
            <th>时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${MOCK_DATA.adminOrders.map(o => `
            <tr>
              <td style="font-family:monospace;font-size:12px">${o.id.toUpperCase()}</td>
              <td style="font-weight:600">${o.user}</td>
              <td>¥${o.amount}</td>
              <td style="color:var(--accent);font-weight:600">${formatCredits(o.credits)}</td>
              <td><span class="tag tag-basic">${o.package}</span></td>
              <td>${o.payMethod}</td>
              <td style="font-size:12px">${o.time}</td>
              <td><span class="status-badge ${o.status === '已完成' ? 'status-success' : o.status === '已退款' ? 'status-refunded' : 'status-failed'}">${o.status}</span></td>
              <td>
                ${o.status === "已完成"
                  ? '<button class="btn btn-ghost btn-sm" onclick="showToast(\'退款处理功能演示\',\'info\')">退款</button>'
                  : '<span style="color:var(--text-muted);font-size:12px">-</span>'
                }
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

// ===== 移动端菜单 =====
document.getElementById("menuToggle")?.addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("open");
});

// ===== 初始化 =====
router();
