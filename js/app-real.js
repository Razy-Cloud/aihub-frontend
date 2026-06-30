/**
 * AIHub 前端 - 白色简约主题 + 消息操作
 * 对接 server/src/index.js 提供的 API
 */
const API_BASE = 'https://aihub-backend-app-production.up.railway.app';

// ===== 全局状态 =====
const state = {
  token: localStorage.getItem('aihub_token') || '',
  user: null,
  currentPage: 'dashboard',
  config: { mockMode: true, providers: {} },
  models: [],  // 模型列表（从后端加载）
  currentModel: '',
  chatHistory: [],
  selectedPackage: null,
};

// 加载系统配置
async function loadConfig() {
  try {
    const data = await api.get('/api/config/status');
    state.config = data;
  } catch (e) { state.config = { mockMode: true }; }
}

// 加载模型列表
async function loadModels() {
  try {
    const data = await api.get('/api/models');
    if (data.success && data.models && data.models.length > 0) {
      state.models = data.models;
      // 设置默认模型（优先选择第一个可用模型）
      if (!state.currentModel || !state.models.find(m => m.id === state.currentModel)) {
        state.currentModel = state.models[0].id;
      }
    }
  } catch (e) {
    console.error('[Models] 加载失败:', e);
    // 降级：使用默认模型列表
    state.models = [
      { id: 'deepseek-chat', name: 'DeepSeek V3', tier: 'basic', tierLabel: '入门档', costPer1k: 2 },
    ];
    state.currentModel = 'deepseek-chat';
  }
}

// ===== API 客户端 =====
const api = {
  async request(path, opts = {}) {
    const url = API_BASE + path;
    const headers = { 'Content-Type': 'application/json' };
    if (state.token) headers['Authorization'] = 'Bearer ' + state.token;
    const resp = await fetch(url, {
      method: opts.method || 'GET',
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || '请求失败');
    return data;
  },
  async get(path) { return this.request(path); },
  async post(path, body) { return this.request(path, { method: 'POST', body }); },
  async put(path, body) { return this.request(path, { method: 'PUT', body }); },

  // 流式请求（SSE）
  async streamChat(message, model, onToken, onDone, onError) {
    const url = API_BASE + '/api/chat/stream';
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.token },
      body: JSON.stringify({ message, model: model || 'deepseek-chat' }),
    });
    if (!resp.ok) {
      const err = await resp.json();
      onError(err.error || '请求失败');
      return;
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    let cost = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const d = JSON.parse(line.slice(6));
            if (d.type === 'token') { fullContent += d.content; onToken(d.content); }
            if (d.type === 'done') { cost = d.cost || 0; onDone(fullContent, cost, d.balance); }
            if (d.type === 'error') { onError(d.error); return; }
          } catch (e) {}
        }
      }
    } catch (e) { onError(e.message); }
  },
};

// ===== 认证 =====
async function login(phone, password) {
  try {
    const data = await api.post('/api/auth/login', { phone, password });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('aihub_token', data.token);
    localStorage.setItem('aihub_user', JSON.stringify(data.user));
    showApp();
  } catch (e) {
    showToast('登录失败：' + e.message, 'error');
  }
}

async function register(phone, password, nickname, email) {
  try {
    const body = { phone, password, nickname };
    if (email) body.email = email;
    const data = await api.post('/api/auth/register', body);
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem('aihub_token', data.token);
    localStorage.setItem('aihub_user', JSON.stringify(data.user));
    showApp();
  } catch (e) {
    showToast('注册失败：' + e.message, 'error');
  }
}

function logout() {
  state.token = '';
  state.user = null;
  localStorage.removeItem('aihub_token');
  localStorage.removeItem('aihub_user');
  showLogin();
}

// 恢复会话
async function restoreSession() {
  await loadConfig();
  if (!state.token) return showLogin();
  try {
    const data = await api.get('/api/auth/me');
    state.user = data.user;
    showApp();
  } catch (e) {
    localStorage.removeItem('aihub_token');
    showLogin();
  }
}

// ===== Toast 提示 =====
function showToast(msg, type = 'info') {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);padding:10px 22px;border-radius:10px;font-size:13px;z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;color:#fff;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background = type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#333';
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2200);
}

// ===== 页面渲染 =====

function showLogin() {
  document.getElementById('app').innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <div class="login-logo">
          <span class="logo-icon">✦</span>
          <h1>AIHub</h1>
          <p>一站式 AI 能力聚合平台</p>
        </div>
        <div class="login-tabs">
          <button class="tab-btn active" onclick="switchLoginTab('login',this)">登录</button>
          <button class="tab-btn" onclick="switchLoginTab('register',this)">注册</button>
        </div>
        <div id="login-form" class="login-form">
          <div class="form-group">
            <label>手机号</label>
            <input type="tel" id="login-phone" placeholder="请输入手机号">
          </div>
          <div class="form-group">
            <label>密码</label>
            <input type="password" id="login-pwd" placeholder="请输入密码">
          </div>
          <button class="btn-primary" onclick="doLogin()">登 录</button>
          <div class="login-hint">注册新账号赠送50积分</div>
        </div>
        <div id="register-form" class="login-form" style="display:none">
          <div class="form-group">
            <label>手机号</label>
            <input type="tel" id="reg-phone" placeholder="请输入手机号">
          </div>
          <div class="form-group">
            <label>邮箱（选填，用于找回密码）</label>
            <input type="email" id="reg-email" placeholder="请输入邮箱（选填）">
          </div>
          <div class="form-group">
            <label>昵称</label>
            <input type="text" id="reg-nick" placeholder="请输入昵称">
          </div>
          <div class="form-group">
            <label>密码</label>
            <input type="password" id="reg-pwd" placeholder="请设置密码（≥6位）">
          </div>
          <button class="btn-primary" onclick="doRegister()">注 册</button>
        </div>
      </div>
    </div>
  `;
}

function switchLoginTab(tab, btn) {
  document.querySelectorAll('.login-tabs .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('login-form').style.display = tab === 'login' ? '' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? '' : 'none';
}

function doLogin() {
  const phone = document.getElementById('login-phone').value.trim();
  const pwd = document.getElementById('login-pwd').value;
  if (!phone || !pwd) return showToast('请填写完整', 'error');
  login(phone, pwd);
}

function doRegister() {
  const phone = document.getElementById('reg-phone').value.trim();
  const pwd = document.getElementById('reg-pwd').value;
  const nick = document.getElementById('reg-nick').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  if (!phone || !pwd) return showToast('请填写完整', 'error');
  if (pwd.length < 6) return showToast('密码至少6位', 'error');
  register(phone, pwd, nick, email);
}

async function showApp() {
  // 加载模型列表
  await loadModels();
  const user = state.user;
  document.getElementById('app').innerHTML = `
    <!-- 顶栏 -->
    <header class="top-bar">
      <div class="top-left">
        <span class="logo-small">✦ AIHub</span>
      </div>
      <div class="top-right">
        <div class="credit-badge" onclick="showPage('credits')">
          <span class="credit-icon">💰</span>
          <span id="header-credits">${user.credits}</span> 积分
        </div>
        <div class="user-menu" onclick="toggleUserMenu(event)">
          <span class="avatar-small">${(user.nickname ? user.nickname[0] : 'U').toUpperCase()}</span>
          <span>${user.nickname || '用户'}</span>
          <div id="user-dropdown" class="dropdown-menu" style="display:none">
            <div class="dropdown-item" onclick="showPage('profile')">个人中心</div>
            <div class="dropdown-item" onclick="showPage('credits')">积分中心</div>
            ${user.role === 'admin' ? '<div class="dropdown-item" onclick="showPage(\'admin\')">管理后台</div>' : ''}
            <div class="dropdown-item danger" onclick="logout()">退出登录</div>
          </div>
        </div>
      </div>
    </header>

    <!-- 侧边栏 -->
    <aside class="sidebar">
      <nav class="sidebar-nav">
        <a href="#" class="nav-item active" data-page="dashboard" onclick="showPage('dashboard');return false;">🏠 工作台</a>
        <a href="#" class="nav-item" data-page="chat" onclick="showPage('chat');return false;">💬 AI 对话</a>
        <a href="#" class="nav-item" data-page="image" onclick="showPage('image');return false;">🎨 AI 绘画</a>
        <a href="#" class="nav-item" data-page="video" onclick="showPage('video');return false;">🎬 AI 视频</a>
        <a href="#" class="nav-item" data-page="doc" onclick="showPage('doc');return false;">📄 文档解析</a>
        <a href="#" class="nav-item" data-page="credits" onclick="showPage('credits');return false;">💰 积分中心</a>
        <a href="#" class="nav-item" data-page="tasks" onclick="showPage('tasks');return false;">🎁 任务中心</a>
        ${user.role === 'admin' ? '<a href="#" class="nav-item" data-page="admin" onclick="showPage(\'admin\');return false;">⚙️ 管理后台</a>' : ''}
      </nav>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content" id="main-content">
      ${renderDashboard()}
    </main>
  `;
  updateNavActive('dashboard');
}

// ===== 各页面渲染 =====

function renderDashboard() {
  return `
    ${state.config.mockMode
      ? '<div class="mock-warning">⚠️ 当前为模拟模式，请配置 API Key 以接入真实大模型。</div>'
      : '<div class="real-mode-ok">✅ 已接入真实大模型 API，可正常使用。</div>'}
    <div class="page-dashboard">
      <div class="welcome-banner">
        <h2>欢迎回来，${state.user.nickname || '用户'}！</h2>
        <p>今日可用积分：<strong id="dash-credits">${state.user.credits}</strong> ｜ 剩余对话约 ${Math.floor(state.user.credits / 2)} 次</p>
      </div>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-value">${state.user.credits}</div><div class="stat-label">可用积分</div></div>
        <div class="stat-card"><div class="stat-value">2积分/次</div><div class="stat-label">对话消耗</div></div>
        <div class="stat-card"><div class="stat-value">10+</div><div class="stat-label">AI模型</div></div>
        <div class="stat-card"><div class="stat-value">文/图/视频</div><div class="stat-label">全品类工具</div></div>
      </div>
      <div class="quick-tools">
        <h3>快捷工具</h3>
        <div class="tools-grid">
          <div class="tool-card" onclick="showPage('chat')"><span>💬</span><p>AI 对话</p><small>支持 DeepSeek/Qwen/GPT</small></div>
          <div class="tool-card" onclick="showPage('image')"><span>🎨</span><p>AI 绘画</p><small>配置后开放</small></div>
          <div class="tool-card" onclick="showPage('video')"><span>🎬</span><p>AI 视频</p><small>配置后开放</small></div>
          <div class="tool-card" onclick="showPage('doc')"><span>📄</span><p>文档解析</p><small>配置后开放</small></div>
          <div class="tool-card" onclick="showPage('credits')"><span>💰</span><p>充值积分</p><small>模拟支付已开启</small></div>
          <div class="tool-card" onclick="showPage('tasks')"><span>🎁</span><p>签到领积分</p><small>每日 +5 积分</small></div>
        </div>
      </div>
    </div>
  `;
}

function renderChat() {
  const models = state.models.length > 0 ? state.models : [
    { id: 'deepseek-chat', name: 'DeepSeek V3', tierLabel: '入门档', costPer1k: 2 },
  ];
  // 确保当前模型在列表中
  if (!state.currentModel || !models.find(m => m.id === state.currentModel)) {
    state.currentModel = models[0].id;
  }
  return `
    <div class="page-chat">
      <div class="chat-layout">
        <!-- 左侧模型列表 -->
        <div class="chat-sidebar">
          <h4>选择模型</h4>
          ${models.map(m => `
            <div class="model-item ${m.tier === 'reasoning' ? 'reasoning' : ''}" onclick="selectModel('${m.id}')" id="model-${m.id}">
              <div class="model-name">${m.name}</div>
              <div class="model-tier">${m.tierLabel} · ${m.costPer1k}积分/1k tokens</div>
            </div>
          `).join('')}
          <div class="chat-tools">
            <label><input type="checkbox" id="web-search"> 联网搜索 (+2积分)</label>
          </div>
        </div>
        <!-- 右侧对话区 -->
        <div class="chat-main">
          <div class="chat-messages" id="chat-messages">
            <div class="welcome-msg">
              <p>👋 你好！我是 AIHub 助手。</p>
              <p>请选择左侧模型，然后开始对话。</p>
            </div>
          </div>
          <div class="chat-input-area">
            <div class="input-row">
              <textarea id="chat-input" placeholder="输入消息，Enter 发送，Shift+Enter 换行..." rows="1" oninput="autoResize(this)" onkeydown="handleChatKeydown(event)"></textarea>
              <button class="send-btn" id="send-btn" onclick="sendMessage()">发送</button>
            </div>
            <div class="input-hint">
              消耗预估：<span id="est-cost">${getModelCost(state.currentModel)}</span> 积分 ｜ 余额：<span id="user-credits">${state.user.credits}</span> 积分
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 获取模型积分消耗
function getModelCost(modelId) {
  const m = state.models.find(x => x.id === modelId);
  return m ? m.costPer1k : 2;
}

// Enter 发送，Shift+Enter 换行
function handleChatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// 输入框自动增高
function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function selectModel(modelId) {
  state.currentModel = modelId;
  document.querySelectorAll('.model-item').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('model-' + modelId);
  if (el) el.classList.add('active');
  const cost = getModelCost(modelId);
  const estEl = document.getElementById('est-cost');
  if (estEl) estEl.textContent = cost;
}

// ===== 消息渲染（含操作按钮）=====

function renderUserMsg(msg) {
  return `<div class="msg-user" data-msg="${escAttr(msg)}">
    <div class="msg-bubble">${escHtml(msg)}</div>
  </div>`;
}

function renderAssistantMsg(content, msgId) {
  return `<div class="msg-assistant" id="${msgId}">
    <div class="msg-bubble">${escHtml(content)}</div>
    <div class="msg-actions">
      <button class="msg-action-btn" title="复制" onclick="copyMessage('${msgId}')">📋</button>
      <button class="msg-action-btn" title="引用" onclick="quoteMessage('${msgId}')">💬</button>
    </div>
  </div>`;
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  input.style.height = 'auto';

  const messagesEl = document.getElementById('chat-messages');
  // 移除欢迎消息
  const welcome = messagesEl.querySelector('.welcome-msg');
  if (welcome) welcome.remove();

  // 用户消息
  messagesEl.innerHTML += renderUserMsg(msg);
  state.chatHistory.push({ role: 'user', content: msg });

  // 助手消息（流式占位）
  const assistantId = 'msg-' + Date.now();
  messagesEl.innerHTML += `<div class="msg-assistant" id="${assistantId}"><div class="msg-bubble"><span class="streaming-cursor">▌</span></div></div>`;
  messagesEl.scrollTop = messagesEl.scrollHeight;

  const bubble = document.querySelector('#' + assistantId + ' .msg-bubble');
  let fullContent = '';

  try {
    document.getElementById('send-btn').disabled = true;
    await api.streamChat(msg, state.currentModel,
      (token) => {
        fullContent += token;
        bubble.innerHTML = escHtml(fullContent) + '<span class="streaming-cursor">▌</span>';
        messagesEl.scrollTop = messagesEl.scrollHeight;
      },
      (content, cost, balance) => {
        // 流式结束：渲染最终内容 + 操作按钮
        bubble.innerHTML = escHtml(content);
        const msgDiv = document.getElementById(assistantId);
        msgDiv.innerHTML += `<div class="msg-actions">
          <button class="msg-action-btn" title="复制" onclick="copyMessage('${assistantId}')">📋</button>
          <button class="msg-action-btn" title="引用" onclick="quoteMessage('${assistantId}')">💬</button>
        </div>`;
        state.chatHistory.push({ role: 'assistant', content });
        document.getElementById('user-credits').textContent = balance;
        document.getElementById('header-credits').textContent = balance;
        state.user.credits = balance;
        document.getElementById('send-btn').disabled = false;
        messagesEl.scrollTop = messagesEl.scrollHeight;
      },
      (error) => {
        bubble.innerHTML = '<span class="error-msg">错误：' + escHtml(error) + '</span>';
        document.getElementById('send-btn').disabled = false;
      }
    );
  } catch (e) {
    bubble.innerHTML = '<span class="error-msg">发送失败：' + escHtml(e.message) + '</span>';
    document.getElementById('send-btn').disabled = false;
  }
}

// 复制消息
function copyMessage(msgId) {
  const bubble = document.querySelector('#' + msgId + ' .msg-bubble');
  if (!bubble) return;
  const text = bubble.innerText;
  navigator.clipboard.writeText(text).then(() => {
    showToast('已复制到剪贴板', 'success');
  }).catch(() => {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('已复制', 'success');
  });
}

// 引用消息（插入到输入框）
function quoteMessage(msgId) {
  const bubble = document.querySelector('#' + msgId + ' .msg-bubble');
  if (!bubble) return;
  const text = bubble.innerText;
  const input = document.getElementById('chat-input');
  const quoted = text.split('\n').map(l => '> ' + l).join('\n') + '\n\n';
  input.value = quoted + input.value;
  input.focus();
  autoResize(input);
  showToast('已引用到输入框', 'success');
}

function renderCredits() {
  return `
    <div class="page-credits">
      <div class="credits-header">
        <div class="credits-balance-card">
          <h3>可用积分</h3>
          <div class="balance-num" id="credits-balance">${state.user.credits}</div>
          <p>约等于 ¥${(state.user.credits * 0.085).toFixed(1)} 元</p>
        </div>
      </div>
      <div class="recharge-section">
        <h3>选择充值积分包</h3>
        <div class="packages-grid" id="packages-grid">
          <div class="package-card" data-pkg="pkg_9" onclick="selectPackage('pkg_9')">
            <div class="pkg-price">¥9.9</div>
            <div class="pkg-credits">100 积分</div>
            <div class="pkg-name">体验档</div>
            <div class="pkg-per">¥0.099/积分</div>
          </div>
          <div class="package-card recommended" data-pkg="pkg_29" onclick="selectPackage('pkg_29')">
            <div class="pkg-badge">推荐</div>
            <div class="pkg-price">¥29.9</div>
            <div class="pkg-credits">350 积分</div>
            <div class="pkg-name">入门档</div>
            <div class="pkg-per">¥0.085/积分</div>
          </div>
          <div class="package-card" data-pkg="pkg_99" onclick="selectPackage('pkg_99')">
            <div class="pkg-price">¥99</div>
            <div class="pkg-credits">1200 积分</div>
            <div class="pkg-name">常用档</div>
            <div class="pkg-per">¥0.082/积分</div>
          </div>
          <div class="package-card" data-pkg="pkg_299" onclick="selectPackage('pkg_299')">
            <div class="pkg-price">¥299</div>
            <div class="pkg-credits">4000 积分</div>
            <div class="pkg-name">重度档</div>
            <div class="pkg-per">¥0.075/积分</div>
          </div>
        </div>
      </div>
      <div class="payment-methods-section" id="payment-methods-section" style="display:none;">
        <h3>选择支付方式</h3>
        <div class="payment-methods" id="payment-methods">
          <button class="payment-method-btn wechat" data-method="wechat" onclick="payWithWechat()">微信支付</button>
          <button class="payment-method-btn alipay" data-method="alipay" onclick="payWithAlipay()">支付宝</button>
          <button class="payment-method-btn paypal" data-method="paypal" onclick="payWithPaypal()">PayPal</button>
          <button class="payment-method-btn mock" data-method="mock" onclick="payWithMock()">模拟支付</button>
        </div>
        <div class="payment-method-container" id="payment-method-container"></div>
      </div>
      <div class="transactions-section">
        <h3>积分明细</h3>
        <div id="transactions-list">加载中...</div>
      </div>
    </div>
  `;
}

function selectPackage(pkgId) {
  state.selectedPackage = pkgId;
  document.querySelectorAll('#packages-grid .package-card').forEach(card => {
    card.classList.toggle('paypal-selected', card.dataset.pkg === pkgId);
  });
  const section = document.getElementById('payment-methods-section');
  if (section) section.style.display = 'block';
  const container = document.getElementById('payment-method-container');
  if (container) container.innerHTML = '';
  // 默认不选任何支付方式，等用户点击
}

// 初始化 PayPal 按钮（在积分中心页面渲染后调用）
async function initPaymentMethods() {
  try {
    const status = await api.get('/api/config/status');
    state.paymentStatus = status.payment || {};
    const p = state.paymentStatus;

    // 根据后端配置显示/隐藏支付方式
    const methods = document.querySelectorAll('#payment-methods .payment-method-btn');
    methods.forEach(btn => {
      const method = btn.dataset.method;
      let available = true;
      if (method === 'paypal' && !p.paypal) available = false;
      if (method === 'wechat' && !p.wechat) available = false;
      if (method === 'alipay' && !p.alipay) available = false;
      if (method === 'mock' && !p.mock) available = false; // 仅开发环境显示模拟支付
      btn.style.display = available ? 'inline-block' : 'none';
    });

    // PayPal SDK：通过后端专用接口获取 Client ID（不再从前端 config/status 暴露）
    if (p.paypal) {
      try {
        const paypalConfig = await api.get('/api/payment/paypal-config');
        await loadPayPalSDK(paypalConfig.clientId, p.paypalEnv);
      } catch (e) {
        console.error('[Payment] 加载 PayPal SDK 失败:', e);
      }
    }
  } catch (e) {
    console.error('[Payment] 初始化支付方式失败:', e);
  }
}

// 兼容旧名：初始化支付方式（加载 PayPal SDK 等）
async function initPayPalButtons() {
  await initPaymentMethods();
}

// 动态加载 PayPal JavaScript SDK
function loadPayPalSDK(clientId, env) {
  return new Promise((resolve, reject) => {
    if (window.paypal) return resolve();

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture&components=buttons`;
    script.setAttribute('data-sdk-integration-source', 'button-factory');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('PayPal SDK 加载失败'));
    document.head.appendChild(script);
  });
}

// 渲染单个套餐的 PayPal 按钮
function renderPayPalButton(pkgId, containerId) {
  const container = document.getElementById(containerId);
  if (!container || !window.paypal) return;
  container.innerHTML = '';

  paypal.Buttons({
    style: {
      layout: 'vertical',
      color: 'gold',
      shape: 'rect',
      label: 'paypal',
      height: 40,
    },
    createOrder: async (data, actions) => {
      try {
        showToast('正在创建 PayPal 订单...', 'success');
        const res = await api.post('/api/payment/create-paypal-order', { packageId: pkgId });
        if (res.paypalOrderId) {
          return res.paypalOrderId;
        }
        throw new Error('创建订单失败');
      } catch (e) {
        showToast('创建订单失败：' + e.message, 'error');
        throw e;
      }
    },
    onApprove: async (data, actions) => {
      try {
        showToast('正在确认支付...', 'success');
        const res = await api.post('/api/payment/capture-paypal-order', { paypalOrderId: data.orderID });
        showToast('支付成功！积分已到账', 'success');
        state.user.credits = res.balance;
        document.getElementById('credits-balance').textContent = res.balance;
        document.getElementById('header-credits').textContent = res.balance;
        loadTransactions();
      } catch (e) {
        showToast('支付确认失败：' + e.message, 'error');
      }
    },
    onCancel: () => {
      showToast('支付已取消', 'error');
    },
    onError: (err) => {
      console.error('[PayPal] 按钮错误:', err);
      showToast('支付出错，请重试', 'error');
    },
  }).render('#' + containerId);
}

async function buyPackage(pkgId) {
  // 备用：模拟支付（仅在 PayPal 未配置时使用）
  try {
    if (!confirm('是否使用模拟支付（测试用）？')) return;
    const data = await api.post('/api/payment/create-order', { packageId: pkgId });
    showToast('模拟支付成功！积分已到账。余额：' + data.balance, 'success');
    state.user.credits = data.balance;
    document.getElementById('credits-balance').textContent = data.balance;
    document.getElementById('header-credits').textContent = data.balance;
    loadTransactions();
  } catch (e) {
    showToast('支付失败：' + e.message, 'error');
  }
}

function getSelectedPackage() {
  const pkgId = state.selectedPackage;
  if (!pkgId) {
    showToast('请先选择一个积分包', 'error');
    return null;
  }
  return pkgId;
}

function setPaymentActive(method) {
  document.querySelectorAll('#payment-methods .payment-method-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.method === method);
  });
}

async function payWithWechat() {
  const pkgId = getSelectedPackage();
  if (!pkgId) return;
  setPaymentActive('wechat');
  try {
    showToast('正在创建微信支付订单...', 'success');
    const res = await api.post('/api/payment/create-wechat-order', { packageId: pkgId });
    if (!res.success || !res.qrDataUrl) throw new Error('创建订单失败');

    const container = document.getElementById('payment-method-container');
    container.innerHTML = `
      <div class="wechat-qr-box">
        <p>请使用微信扫一扫支付</p>
        <img src="${res.qrDataUrl}" alt="微信支付二维码" />
        <p><small>订单号：${res.orderId}</small></p>
        <p><small>支付完成后将自动到账</small></p>
      </div>
    `;

    // 轮询订单状态
    pollOrderStatus(res.orderId, '微信支付');
  } catch (e) {
    showToast('微信支付订单创建失败：' + e.message, 'error');
  }
}

async function payWithAlipay() {
  const pkgId = getSelectedPackage();
  if (!pkgId) return;
  setPaymentActive('alipay');
  try {
    showToast('正在创建支付宝订单...', 'success');
    const res = await api.post('/api/payment/create-alipay-order', { packageId: pkgId });
    if (!res.success || !res.qrDataUrl) throw new Error('创建订单失败');

    const container = document.getElementById('payment-method-container');
    container.innerHTML = `
      <div class="alipay-qr-box">
        <h4>支付宝支付</h4>
        <p class="alipay-qr-price">¥${Number(res.amount).toFixed(2)}</p>
        <img src="${res.qrDataUrl}" alt="支付宝支付二维码" class="alipay-qr-img" />
        <p class="alipay-qr-tip">扫码或点击下方按钮完成支付</p>
        <a href="${res.payUrl}" target="_blank" rel="noopener" class="alipay-pay-link">打开支付页面</a>
        <p class="alipay-qr-order"><small>订单号：${res.orderId}</small></p>
      </div>
    `;

    // 轮询订单状态
    pollOrderStatus(res.orderId, '支付宝');
  } catch (e) {
    showToast('支付宝订单创建失败：' + e.message, 'error');
  }
}

async function payWithPaypal() {
  const pkgId = getSelectedPackage();
  if (!pkgId) return;
  setPaymentActive('paypal');

  const container = document.getElementById('payment-method-container');
  container.innerHTML = '<div id="paypal-active-button"></div>';

  if (!window.paypal) {
    showToast('PayPal SDK 未加载，请刷新页面重试', 'error');
    return;
  }
  renderPayPalButton(pkgId, 'paypal-active-button');
}

async function payWithMock() {
  const pkgId = getSelectedPackage();
  if (!pkgId) return;
  setPaymentActive('mock');
  try {
    if (!confirm('确认使用模拟支付？积分将立即到账。')) return;
    const data = await api.post('/api/payment/create-order', { packageId: pkgId });
    showToast('模拟支付成功！积分已到账。余额：' + data.balance, 'success');
    state.user.credits = data.balance;
    document.getElementById('credits-balance').textContent = data.balance;
    document.getElementById('header-credits').textContent = data.balance;
    loadTransactions();
  } catch (e) {
    showToast('支付失败：' + e.message, 'error');
  }
}

function pollOrderStatus(orderId, methodName) {
  if (state.pollTimer) clearInterval(state.pollTimer);
  let attempts = 0;
  const maxAttempts = 60; // 最多 60 次，每次 3 秒，共 3 分钟

  state.pollTimer = setInterval(async () => {
    attempts++;
    if (attempts > maxAttempts) {
      clearInterval(state.pollTimer);
      showToast('订单状态查询超时，请稍后刷新页面查看', 'error');
      return;
    }
    try {
      const data = await api.get('/api/payment/order-status?orderId=' + orderId);
      if (data.status === 'paid') {
        clearInterval(state.pollTimer);
        showToast(methodName + '支付成功！积分已到账', 'success');
        state.user.credits = data.balance;
        const creditsBalance = document.getElementById('credits-balance');
        if (creditsBalance) creditsBalance.textContent = data.balance;
        const headerCredits = document.getElementById('header-credits');
        if (headerCredits) headerCredits.textContent = data.balance;
        loadTransactions();
      }
    } catch (e) {
      console.error('订单状态查询失败:', e);
    }
  }, 3000);
}

async function loadTransactions() {
  try {
    const data = await api.get('/api/user/transactions');
    const list = document.getElementById('transactions-list');
    if (!list) return;
    list.innerHTML = `<table class="tx-table">
      <tr><th>时间</th><th>类型</th><th>变动</th><th>说明</th></tr>
      ${data.items.map(t => `<tr>
        <td>${t.created_at}</td>
        <td>${{recharge:'充值',consume:'消费',refund:'退款',gift:'赠送',sign_in:'签到'}[t.type]||t.type}</td>
        <td class="${t.amount > 0 ? 'tx-plus' : 'tx-minus'}">${t.amount > 0 ? '+' : ''}${t.amount}</td>
        <td>${t.description || ''}</td>
      </tr>`).join('')}
    </table>`;
  } catch (e) { console.error(e); }
}

function renderTasks() {
  return `
    <div class="page-tasks">
      <h2>任务中心</h2>
      <div class="task-card" onclick="doCheckIn()">
        <div class="task-icon">📅</div>
        <div class="task-info">
          <h4>每日签到</h4>
          <p>签到领取 5 积分，连续签到奖励递增</p>
        </div>
        <button class="btn-small" id="checkin-btn">签到</button>
      </div>
      <div class="task-card">
        <div class="task-icon">👥</div>
        <div class="task-info">
          <h4>邀请好友</h4>
          <p>每邀请 1 位好友注册，双方各得 50 积分</p>
        </div>
        <button class="btn-small" onclick="copyInviteLink()">复制链接</button>
      </div>
    </div>
  `;
}

async function doCheckIn() {
  try {
    const data = await api.post('/api/user/check-in');
    showToast(`签到成功！获得 ${data.creditsEarned} 积分，连续 ${data.consecutiveDays} 天`, 'success');
    state.user.credits = data.balance;
    document.getElementById('header-credits').textContent = data.balance;
    const btn = document.getElementById('checkin-btn');
    if (btn) { btn.disabled = true; btn.textContent = '已签到'; }
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function copyInviteLink() {
  const link = window.location.origin + '/#register';
  navigator.clipboard.writeText(link);
  showToast('邀请链接已复制', 'success');
}

// ===== AI 绘画 =====
function renderImage() {
  return `
    <div class="page-image">
      <div style="max-width:900px;margin:0 auto;">
        <h2 style="color:#1a1a2e;font-size:20px;font-weight:700;margin-bottom:20px;">🎨 AI 绘画</h2>
        <div style="display:grid;grid-template-columns:320px 1fr;gap:24px;align-items:start;">
          <!-- 左侧：输入区 -->
          <div style="background:#fff;border:1px solid #eee;border-radius:16px;padding:24px;">
            <div style="margin-bottom:16px;">
              <label style="display:block;color:#555;font-size:13px;font-weight:500;margin-bottom:6px;">绘画描述</label>
              <textarea id="img-prompt" rows="4" placeholder="描述你想要画的画面，比如：一只在太空中的猫，赛博朋克风格..."
                style="width:100%;padding:12px 14px;background:#f8f9fc;border:1.5px solid #e8e8f0;border-radius:10px;color:#1a1a2e;font-size:14px;resize:none;font-family:inherit;box-sizing:border-box;line-height:1.5;"
                oninput="updateCharCount()"></textarea>
              <div style="text-align:right;font-size:12px;color:#aaa;margin-top:4px;" id="prompt-count">0/500</div>
            </div>
            <div style="margin-bottom:14px;">
              <label style="display:block;color:#555;font-size:13px;font-weight:500;margin-bottom:6px;">画面风格</label>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;" id="style-selector">
                <button class="style-btn active" onclick="selectStyle('photorealistic',this)" style="padding:10px 12px;border:2px solid #7c5cfc;border-radius:10px;background:#f0ecff;cursor:pointer;font-size:13px;color:#7c5cfc;font-weight:500;transition:all 0.2s;">📸 写实照片</button>
                <button class="style-btn" onclick="selectStyle('anime',this)" style="padding:10px 12px;border:2px solid #eee;border-radius:10px;background:#fff;cursor:pointer;font-size:13px;color:#666;font-weight:400;transition:all 0.2s;">🎌 动漫风格</button>
                <button class="style-btn" onclick="selectStyle('oilpainting',this)" style="padding:10px 12px;border:2px solid #eee;border-radius:10px;background:#fff;cursor:pointer;font-size:13px;color:#666;font-weight:400;transition:all 0.2s;">🖼️ 油画风格</button>
                <button class="style-btn" onclick="selectStyle('cyberpunk',this)" style="padding:10px 12px;border:2px solid #eee;border-radius:10px;background:#fff;cursor:pointer;font-size:13px;color:#666;font-weight:400;transition:all 0.2s;">🌃 赛博朋克</button>
              </div>
            </div>
            <div style="margin-bottom:18px;">
              <label style="display:block;color:#555;font-size:13px;font-weight:500;margin-bottom:6px;">图片尺寸</label>
              <div style="display:flex;gap:8px;">
                <button class="size-btn active" onclick="selectSize('512x512',this)" style="flex:1;padding:8px;border:2px solid #7c5cfc;border-radius:8px;background:#f0ecff;cursor:pointer;font-size:12px;color:#7c5cfc;font-weight:500;">正方形 1:1</button>
                <button class="size-btn" onclick="selectSize('768x512',this)" style="flex:1;padding:8px;border:2px solid #eee;border-radius:8px;background:#fff;cursor:pointer;font-size:12px;color:#666;font-weight:400;">横图 3:2</button>
                <button class="size-btn" onclick="selectSize('512x768',this)" style="flex:1;padding:8px;border:2px solid #eee;border-radius:8px;background:#fff;cursor:pointer;font-size:12px;color:#666;font-weight:400;">竖图 2:3</button>
              </div>
            </div>
            <div style="background:#f8f6ff;border:1px solid #ece6ff;border-radius:10px;padding:12px 16px;margin-bottom:18px;">
              <div style="display:flex;justify-content:space-between;font-size:13px;color:#888;margin-bottom:4px;">
                <span>消耗积分</span><span style="color:#7c5cfc;font-weight:600;">8 积分/张</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13px;color:#888;">
                <span>当前余额</span><span id="img-credits">${state.user.credits} 积分</span>
              </div>
            </div>
            <button class="btn-primary" id="gen-btn" onclick="generateImage()" style="width:100%;padding:13px;font-size:15px;border-radius:12px;">🎨 开始生成</button>
          </div>
          <!-- 右侧：结果区 -->
          <div style="background:#fff;border:1px solid #eee;border-radius:16px;padding:24px;min-height:400px;">
            <div id="img-result">
              <div style="text-align:center;color:#aaa;padding:80px 20px;">
                <div style="font-size:48px;margin-bottom:16px;">🎨</div>
                <p style="font-size:15px;margin:0 0 6px;">输入描述，选择风格，开始创作</p>
                <p style="font-size:13px;color:#ccc;">生成一张图片消耗 8 积分</p>
              </div>
            </div>
            <div id="img-history" style="margin-top:24px;display:none;">
              <h4 style="color:#333;font-size:14px;font-weight:600;margin-bottom:12px;">历史记录</h4>
              <div id="img-history-list" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

let currentStyle = 'photorealistic';
let currentSize = '512x512';

function updateCharCount() {
  const len = document.getElementById('img-prompt').value.length;
  document.getElementById('prompt-count').textContent = len + '/500';
}

function selectStyle(style, btn) {
  currentStyle = style;
  document.querySelectorAll('.style-btn').forEach(b => {
    b.style.borderColor = '#eee'; b.style.background = '#fff'; b.style.color = '#666'; b.style.fontWeight = '400';
  });
  btn.style.borderColor = '#7c5cfc'; btn.style.background = '#f0ecff'; btn.style.color = '#7c5cfc'; btn.style.fontWeight = '500';
}

function selectSize(size, btn) {
  currentSize = size;
  document.querySelectorAll('.size-btn').forEach(b => {
    b.style.borderColor = '#eee'; b.style.background = '#fff'; b.style.color = '#666'; b.style.fontWeight = '400';
  });
  btn.style.borderColor = '#7c5cfc'; btn.style.background = '#f0ecff'; btn.style.color = '#7c5cfc'; btn.style.fontWeight = '500';
}

async function generateImage() {
  const prompt = document.getElementById('img-prompt').value.trim();
  if (!prompt) return showToast('请输入绘画描述', 'error');
  if (prompt.length < 2) return showToast('描述太短了', 'error');

  const btn = document.getElementById('gen-btn');
  btn.disabled = true;
  btn.textContent = '🎨 生成中...';

  const resultEl = document.getElementById('img-result');

  try {
    const data = await api.post('/api/image/generate', { prompt, style: currentStyle, size: currentSize });
    // 显示生成的图片
    resultEl.innerHTML = `
      <div style="text-align:center;">
        <img src="${data.imageUrl}" alt="${escHtml(data.prompt)}"
          style="max-width:100%;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.08);cursor:pointer;"
          onclick="window.open(this.src,'_blank')">
        <div style="margin-top:14px;text-align:left;">
          <p style="font-size:13px;color:#888;margin:0 0 6px;"><strong>提示词：</strong>${escHtml(data.prompt)}</p>
          <p style="font-size:12px;color:#aaa;margin:0 0 12px;">风格：${currentStyle} ｜ 尺寸：${data.size} ｜ 消耗：${data.cost} 积分</p>
          <div style="display:flex;gap:8px;">
            <button onclick="window.open(document.querySelector('#img-result img').src,'_blank')" style="padding:7px 16px;border:1.5px solid #7c5cfc;background:#fff;color:#7c5cfc;border-radius:8px;cursor:pointer;font-size:13px;">🔍 查看大图</button>
            <button onclick="downloadImage()" style="padding:7px 16px;border:1.5px solid #7c5cfc;background:#fff;color:#7c5cfc;border-radius:8px;cursor:pointer;font-size:13px;">💾 保存图片</button>
          </div>
        </div>
      </div>
    `;
    // 更新余额
    state.user.credits = data.balance;
    document.getElementById('img-credits').textContent = data.balance + ' 积分';
    document.getElementById('header-credits').textContent = data.balance;
    showToast('生成成功！消耗 ' + data.cost + ' 积分', 'success');
  } catch (e) {
    resultEl.innerHTML = `<div style="text-align:center;color:#ef4444;padding:40px;"><p>❌ 生成失败：${escHtml(e.message)}</p></div>`;
    showToast('生成失败：' + e.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '🎨 开始生成';
  }
}

function downloadImage() {
  const img = document.querySelector('#img-result img');
  if (!img) return;
  const a = document.createElement('a');
  a.href = img.src;
  a.download = 'aihub-image-' + Date.now() + '.png';
  a.click();
}

// ===== 页面路由 =====
function showPage(page) {
  state.currentPage = page;
  updateNavActive(page);
  const main = document.getElementById('main-content');
  switch (page) {
    case 'dashboard': main.innerHTML = renderDashboard(); break;
    case 'chat': main.innerHTML = renderChat(); selectModel('deepseek-chat'); break;
    case 'credits': main.innerHTML = renderCredits(); loadTransactions(); checkPaymentReturn(); initPayPalButtons(); break;
    case 'tasks': main.innerHTML = renderTasks(); break;
    case 'image': main.innerHTML = renderImage(); break;
    case 'video': main.innerHTML = '<div class="coming-soon"><h2>🎬 AI 视频</h2><p>接入视频生成 API 后开放，当前积分定价：80积分/条</p></div>'; break;
    case 'doc': main.innerHTML = '<div class="coming-soon"><h2>📄 文档解析</h2><p>接入文档解析服务后开放，当前积分定价：15积分/份</p></div>'; break;
    case 'profile': main.innerHTML = renderProfile(); break;
    case 'admin': if (state.user.role === 'admin') { renderAdmin(); } else main.innerHTML = '<p>无权限</p>'; break;
  }
}

function updateNavActive(page) {
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
}

function checkPaymentReturn() {
  const hash = window.location.hash;
  if (hash.includes('paid=success')) {
    const orderMatch = hash.match(/order=([^&]+)/);
    if (orderMatch) {
      const orderId = orderMatch[1];
      showToast('支付成功！正在确认订单...', 'success');
      // 调用后端捕获 PayPal 订单
      api.post('/api/payment/capture-paypal-order', { orderId })
        .then(data => {
          showToast('支付成功！积分已到账', 'success');
          state.user.credits = data.balance;
          if (document.getElementById('credits-balance')) document.getElementById('credits-balance').textContent = data.balance;
          if (document.getElementById('header-credits')) document.getElementById('header-credits').textContent = data.balance;
          loadTransactions();
        })
        .catch(e => {
          showToast('订单确认失败：' + e.message, 'error');
        });
    }
    // 清理 URL 参数
    window.history.replaceState(null, '', window.location.pathname + window.location.hash.split('?')[0]);
  } else if (hash.includes('paid=cancel')) {
    showToast('支付已取消', 'error');
    window.history.replaceState(null, '', window.location.pathname + window.location.hash.split('?')[0]);
  }
}

async function loadUserInfo() {
  try {
    const data = await api.get('/api/auth/me');
    if (data.user) {
      state.user.credits = data.user.credits;
      if (document.getElementById('credits-balance')) document.getElementById('credits-balance').textContent = data.user.credits;
      if (document.getElementById('header-credits')) document.getElementById('header-credits').textContent = data.user.credits;
    }
  } catch (e) { console.error('loadUserInfo error', e); }
}

function renderProfile() {
  const u = state.user;
  return `
    <div class="page-profile">
      <h2>个人中心</h2>
      <div class="profile-card">
        <div class="profile-avatar">${(u.nickname ? u.nickname[0] : 'U').toUpperCase()}</div>
        <h3>${u.nickname || '用户'}</h3>
        <p>手机号：${u.phone || '未绑定'}</p>
        <p>积分余额：<strong>${u.credits}</strong></p>
        <p>注册时间：${u.created_at || '-'}</p>
      </div>
    </div>
  `;
}

async function renderAdmin() {
  const main = document.getElementById('main-content');
  if (!main) return;
  main.innerHTML = '<div class="page-admin"><p style="text-align:center;padding:40px;">加载管理后台...</p></div>';
  try {
    const data = await api.get('/api/admin/dashboard');
    const s = data.stats;
    main.innerHTML = `
      <div class="page-admin admin-layout">
        <h2>管理后台</h2>
        <div class="admin-tabs" id="admin-tabs">
          <div class="admin-tab active" onclick="switchAdminTab('dashboard', this)">📊 数据看板</div>
          <div class="admin-tab" onclick="switchAdminTab('users', this)">👥 用户管理</div>
          <div class="admin-tab" onclick="switchAdminTab('orders', this)">📦 订单管理</div>
          <div class="admin-tab" onclick="switchAdminTab('profit', this)">💰 利润分析</div>
        </div>
        <div id="admin-tab-content">
          <div class="admin-stats">
            <div class="stat-card"><div class="stat-value">${s.totalUsers}</div><div class="stat-card-label">总用户</div><div class="stat-card-sub">今日+${s.todayNewUsers}</div></div>
            <div class="stat-card"><div class="stat-value">${s.activeUsers}</div><div class="stat-card-label">活跃用户</div><div class="stat-card-sub">封禁 ${s.bannedUsers}</div></div>
            <div class="stat-card"><div class="stat-value">${s.totalOrders}</div><div class="stat-card-label">总订单</div><div class="stat-card-sub">已支付</div></div>
            <div class="stat-card"><div class="stat-value">¥${s.totalRevenue.toFixed(2)}</div><div class="stat-card-label">总收入</div><div class="stat-card-sub">今日 ¥${(s.todayRevenue||0).toFixed(2)}</div></div>
            <div class="stat-card"><div class="stat-value">${s.totalCreditsConsumed}</div><div class="stat-card-label">已消耗积分</div><div class="stat-card-sub">人均 ${s.avgCreditsPerUser} 积分</div></div>
            <div class="stat-card"><div class="stat-value">${s.totalCreditsRecharged}</div><div class="stat-card-label">已充值积分</div><div class="stat-card-sub"></div></div>
          </div>
        </div>
      </div>`;
  } catch (e) {
    main.innerHTML = '<div class="page-admin"><p>加载失败：' + e.message + '</p></div>';
  }
}

// ===== 管理后台：Tab 切换 =====
async function switchAdminTab(tab, btn) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const content = document.getElementById('admin-tab-content');
  content.innerHTML = '<p style="text-align:center;padding:40px;">加载中...</p>';
  try {
    switch (tab) {
      case 'dashboard': content.innerHTML = await renderAdminDashboard(); break;
      case 'users': content.innerHTML = await renderAdminUsers(); break;
      case 'orders': content.innerHTML = await renderAdminOrders(); break;
      case 'profit': content.innerHTML = await renderAdminProfit(); break;
    }
  } catch (e) {
    content.innerHTML = '<p style="color:red;">加载失败：' + e.message + '</p>';
  }
}

// ===== 数据看板 =====
async function renderAdminDashboard() {
  const data = await api.get('/api/admin/dashboard');
  const s = data.stats;
  return `
    <div class="admin-stats">
      <div class="stat-card"><div class="stat-value">${s.totalUsers}</div><div class="stat-card-label">总用户</div><div class="stat-card-sub">今日+${s.todayNewUsers}</div></div>
      <div class="stat-card"><div class="stat-value">${s.activeUsers}</div><div class="stat-card-label">活跃用户</div><div class="stat-card-sub">封禁 ${s.bannedUsers}</div></div>
      <div class="stat-card"><div class="stat-value">${s.totalOrders}</div><div class="stat-card-label">已支付订单</div><div class="stat-card-sub"></div></div>
      <div class="stat-card"><div class="stat-value">¥${s.totalRevenue.toFixed(2)}</div><div class="stat-card-label">总收入</div><div class="stat-card-sub">今日 ¥${(s.todayRevenue||0).toFixed(2)}</div></div>
      <div class="stat-card"><div class="stat-value">${s.totalCreditsConsumed}</div><div class="stat-card-label">已消耗积分</div><div class="stat-card-sub">人均 ${s.avgCreditsPerUser} 积分</div></div>
      <div class="stat-card"><div class="stat-value">${s.totalCreditsRecharged}</div><div class="stat-card-label">充值总积分</div><div class="stat-card-sub"></div></div>
    </div>
  `;
}

// ===== 用户管理 =====
let adminUsersPage = 1, adminUsersSearch = '';
async function renderAdminUsers(search, page) {
  if (search !== undefined) adminUsersSearch = search;
  if (page !== undefined) adminUsersPage = page;
  const params = { limit: 20, page: adminUsersPage };
  if (adminUsersSearch) params.search = adminUsersSearch;
  const data = await api.get('/api/admin/users?' + new URLSearchParams(params).toString());
  const pages = Math.ceil(data.total / data.limit);
  const rows = data.users.map(u => `
    <tr>
      <td>${u.id}</td>
      <td>${escHtml(u.nickname||'')}</td>
      <td>${u.phone}${u.email ? '<br><small>'+escHtml(u.email)+'</small>' : ''}</td>
      <td><strong>${u.credits}</strong></td>
      <td>¥${(u.total_recharged||0).toFixed(2)}</td>
      <td>${u.total_consumed||0}</td>
      <td><span class="badge badge-${u.status==='active'?'success':'danger'}">${u.status}</span></td>
      <td><span class="badge badge-${u.role==='admin'?'primary':'secondary'}">${u.role}</span></td>
      <td>
        <button class="btn-sm" onclick="showEditUser(${u.id})" title="编辑">✏️</button>
      </td>
    </tr>
  `).join('');
  let pagination = '';
  if (pages > 1) {
    pagination = '<div style="margin-top:16px;display:flex;gap:8px;justify-content:center;">';
    for (let i = 1; i <= pages; i++) {
      pagination += '<button class="btn-sm' + (i === adminUsersPage ? ' btn-primary' : '') + '" onclick="renderAdminUsers(undefined,' + i + ').then(h=>document.getElementById(\'admin-tab-content\').innerHTML=h)">' + i + '</button>';
    }
    pagination += '</div>';
  }
  return `
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <input type="text" id="user-search" placeholder="搜索手机号/昵称/邮箱..." value="${escHtml(adminUsersSearch)}" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-surface);color:var(--text);">
      <button class="btn-primary" onclick="renderAdminUsers(document.getElementById('user-search').value,1).then(h=>document.getElementById('admin-tab-content').innerHTML=h)">搜索</button>
    </div>
    <div style="overflow-x:auto;"><table class="data-table" style="width:100%;border-collapse:collapse;">
      <thead><tr>
        <th>ID</th><th>昵称</th><th>手机号/邮箱</th><th>积分</th><th>累计充值</th><th>累计消费</th><th>状态</th><th>角色</th><th>操作</th>
      </tr></thead>
      <tbody>${rows || '<tr><td colspan="9" style="text-align:center;padding:20px;">暂无数据</td></tr>'}</tbody>
    </table></div>
    <div style="margin-top:8px;color:var(--text-secondary);font-size:12px;">共 ${data.total} 个用户，第 ${data.page}/${pages} 页</div>
    ${pagination}
    <div id="user-edit-modal"></div>
  `;
}

// ===== 编辑用户弹窗 =====
async function showEditUser(userId) {
  const data = await api.get('/api/admin/users/' + userId);
  const u = data.user;
  const modal = document.getElementById('user-edit-modal');
  if (!modal) return;
  modal.innerHTML = `
    <div class="modal-overlay" onclick="document.getElementById('user-edit-modal').innerHTML=''">
      <div class="modal-box" onclick="event.stopPropagation()" style="background:var(--bg-surface);border:1px solid var(--border);border-radius:12px;padding:24px;max-width:500px;margin:60px auto;">
        <h3 style="margin:0 0 16px;">编辑用户 #${u.id}</h3>
        <div style="margin-bottom:12px;"><label>手机号</label><input type="text" value="${u.phone}" disabled style="width:100%;padding:8px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text-secondary);"></div>
        <div style="margin-bottom:12px;"><label>邮箱</label><input type="email" id="edit-email" value="${escHtml(u.email||'')}" placeholder="未绑定" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg-surface);color:var(--text);"></div>
        <div style="margin-bottom:12px;"><label>昵称</label><input type="text" id="edit-nick" value="${escHtml(u.nickname||'')}" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg-surface);color:var(--text);"></div>
        <div style="margin-bottom:12px;"><label>积分余额（当前：${u.credits}）</label><input type="number" id="edit-credits" value="${u.credits}" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg-surface);color:var(--text);"></div>
        <div style="margin-bottom:12px;"><label>角色</label><select id="edit-role" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg-surface);color:var(--text);"><option value="user" ${u.role==='user'?'selected':''}>普通用户</option><option value="admin" ${u.role==='admin'?'selected':''}>管理员</option></select></div>
        <div style="margin-bottom:12px;"><label>状态</label><select id="edit-status" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:6px;background:var(--bg-surface);color:var(--text);"><option value="active" ${u.status==='active'?'selected':''}>正常</option><option value="banned" ${u.status==='banned'?'selected':''}>封禁</option></select></div>
        <div style="margin-bottom:12px;font-size:12px;color:var(--text-secondary);">
          注册时间：${u.created_at} &nbsp;|&nbsp; 累计充值：¥${(u.total_recharged||0).toFixed(2)} &nbsp;|&nbsp; 累计消费：${u.total_consumed||0}积分
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button class="btn-secondary" onclick="document.getElementById('user-edit-modal').innerHTML=''">取消</button>
          <button class="btn-primary" onclick="saveEditUser(${u.id})">保存</button>
        </div>
      </div>
    </div>
  `;
}

async function saveEditUser(userId) {
  const credits = document.getElementById('edit-credits').value;
  const role = document.getElementById('edit-role').value;
  const status = document.getElementById('edit-status').value;
  const nickname = document.getElementById('edit-nick').value;
  const email = document.getElementById('edit-email').value;
  try {
    const body = {};
    if (credits !== undefined) body.credits = parseInt(credits);
    if (role) body.role = role;
    if (status) body.status = status;
    if (nickname !== undefined) body.nickname = nickname;
    if (email !== undefined) body.email = email;
    await api.put('/api/admin/users/' + userId, body);
    document.getElementById('user-edit-modal').innerHTML = '';
    showToast('用户信息已更新', 'success');
    renderAdminUsers().then(h => document.getElementById('admin-tab-content').innerHTML = h);
  } catch (e) {
    showToast('保存失败：' + e.message, 'error');
  }
}

// ===== 订单管理 =====
let adminOrdersPage = 1, adminOrdersStatus = '';
async function renderAdminOrders(status, page) {
  if (status !== undefined) adminOrdersStatus = status;
  if (page !== undefined) adminOrdersPage = page;
  const params = { limit: 20, page: adminOrdersPage };
  if (adminOrdersStatus) params.status = adminOrdersStatus;
  const data = await api.get('/api/admin/orders?' + new URLSearchParams(params).toString());
  const pages = Math.ceil(data.total / data.limit);
  const rows = data.orders.map(o => `
    <tr>
      <td><code>${o.id}</code></td>
      <td>${escHtml(o.nickname||'')}<br><small>${o.phone||''}</small></td>
      <td>${o.package_name||''}</td>
      <td>¥${o.amount.toFixed(2)}</td>
      <td>${o.credits||0}</td>
      <td>${o.payment_method||'模拟'}</td>
      <td><span class="badge badge-${o.status==='paid'?'success':o.status==='pending'?'warning':'danger'}">${o.status}</span></td>
      <td>${o.created_at||''}</td>
    </tr>
  `).join('');
  return `
    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <select id="order-status-filter" onchange="renderAdminOrders(this.value,1).then(h=>document.getElementById('admin-tab-content').innerHTML=h)" style="padding:8px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg-surface);color:var(--text);">
        <option value="">全部状态</option>
        <option value="paid" ${adminOrdersStatus==='paid'?'selected':''}>已支付</option>
        <option value="pending" ${adminOrdersStatus==='pending'?'selected':''}>待支付</option>
        <option value="failed" ${adminOrdersStatus==='failed'?'selected':''}>失败</option>
        <option value="refunded" ${adminOrdersStatus==='refunded'?'selected':''}>已退款</option>
      </select>
    </div>
    <div style="overflow-x:auto;"><table class="data-table" style="width:100%;border-collapse:collapse;">
      <thead><tr><th>订单号</th><th>用户</th><th>套餐</th><th>金额</th><th>积分</th><th>支付方式</th><th>状态</th><th>时间</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="8" style="text-align:center;padding:20px;">暂无订单</td></tr>'}</tbody>
    </table></div>
    <div style="margin-top:8px;color:var(--text-secondary);font-size:12px;">共 ${data.total} 个订单，第 ${data.page}/${pages} 页</div>
  `;
}

// ===== 利润分析 =====
async function renderAdminProfit() {
  const data = await api.get('/api/admin/profit');
  const r = data.revenue, c = data.apiCost, p = data.profit, pr = data.pricing;
  const packageCards = data.packageSales.map((s,i) => `
    <tr>
      <td>${s.package_name||'未知'}</td>
      <td>${s.count}</td>
      <td>¥${(s.revenue||0).toFixed(2)}</td>
      <td>${s.total_credits||0}</td>
    </tr>
  `).join('');
  const modelRows = c.details.map(m => `
    <tr>
      <td>${m.model}</td>
      <td>${m.calls}</td>
      <td>${m.creditsConsumed}</td>
      <td>¥${m.unitCost.toFixed(3)}</td>
      <td>¥${m.totalCost.toFixed(2)}</td>
    </tr>
  `).join('');
  return `
    <h3>利润概览</h3>
    <div class="admin-stats">
      <div class="stat-card"><div class="stat-value">¥${r.total.toFixed(2)}</div><div class="stat-card-label">总收入</div><div class="stat-card-sub">本月 ¥${(r.month||0).toFixed(2)}</div></div>
      <div class="stat-card"><div class="stat-value">¥${c.total.toFixed(2)}</div><div class="stat-card-label">API 成本</div><div class="stat-card-sub">每次 ¥${c.perCall.toFixed(3)}</div></div>
      <div class="stat-card"><div class="stat-value" style="color:var(--accent);">¥${p.gross.toFixed(2)}</div><div class="stat-card-label">净利润</div><div class="stat-card-sub">利润率 ${p.margin}%</div></div>
      <div class="stat-card"><div class="stat-value">¥${pr.apiCostPerCreditAvg.toFixed(4)}</div><div class="stat-card-label">每积分API成本</div><div class="stat-card-sub">最低售价 ¥${pr.packages[3].costPerCredit} /积分</div></div>
    </div>
    <div class="chart-card">
      <h4 style="margin:0 0 12px;">定价与利润分析</h4>
      <div style="overflow-x:auto;"><table class="data-table" style="width:100%;border-collapse:collapse;">
        <thead><tr><th>套餐</th><th>售价</th><th>积分</th><th>售价/积分</th><th>API成本/积分</th><th>利润率</th></tr></thead>
        <tbody>
          ${pr.packages.map(pkg => {
            const apiCost = pr.apiCostPerCreditAvg * pkg.credits;
            const margin = (((pkg.price - apiCost) / pkg.price) * 100).toFixed(1);
            return '<tr><td>'+pkg.id+'</td><td>¥'+pkg.price.toFixed(2)+'</td><td>'+pkg.credits+'</td><td>¥'+pkg.costPerCredit.toFixed(3)+'</td><td>¥'+pr.apiCostPerCreditAvg.toFixed(4)+'</td><td>'+margin+'%</td></tr>';
          }).join('')}
        </tbody>
      </table></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div class="chart-card">
        <h4 style="margin:0 0 12px;">套餐销量分布</h4>
        <div style="overflow-x:auto;"><table class="data-table" style="width:100%;border-collapse:collapse;">
          <thead><tr><th>套餐</th><th>销量</th><th>收入</th><th>积分发放</th></tr></thead>
          <tbody>${packageCards || '<tr><td colspan="4">暂无数据</td></tr>'}</tbody>
        </table></div>
      </div>
      <div class="chart-card">
        <h4 style="margin:0 0 12px;">模型调用成本明细</h4>
        <div style="overflow-x:auto;"><table class="data-table" style="width:100%;border-collapse:collapse;">
          <thead><tr><th>模型</th><th>调用次数</th><th>消耗积分</th><th>单价</th><th>总成本</th></tr></thead>
          <tbody>${modelRows || '<tr><td colspan="5">暂无数据</td></tr>'}</tbody>
        </table></div>
      </div>
    </div>
    ${data.monthlyRevenue && data.monthlyRevenue.length > 0 ? `
    <div class="chart-card" style="margin-top:16px;">
      <h4 style="margin:0 0 12px;">月度收入趋势</h4>
      <div style="overflow-x:auto;"><table class="data-table" style="width:100%;border-collapse:collapse;">
        <thead><tr><th>月份</th><th>订单数</th><th>收入</th><th>卖出积分</th></tr></thead>
        <tbody>${data.monthlyRevenue.map(m => '<tr><td>'+m.month+'</td><td>'+m.orders+'</td><td>¥'+(m.revenue||0).toFixed(2)+'</td><td>'+m.credits_sold+'</td></tr>').join('')}</tbody>
      </table></div>
    </div>` : ''}
  `;
}

// ===== 工具函数 =====
function escHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML.replace(/\n/g, '<br>');
}

function escAttr(s) {
  return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function toggleUserMenu(e) {
  e.stopPropagation();
  const dd = document.getElementById('user-dropdown');
  if (dd) dd.style.display = dd.style.display === 'none' ? '' : 'none';
}
document.addEventListener('click', () => {
  const dd = document.getElementById('user-dropdown');
  if (dd) dd.style.display = 'none';
});

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  restoreSession();
});
