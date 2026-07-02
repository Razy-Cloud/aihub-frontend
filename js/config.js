// AIHub 前端配置
// 生产环境：Vercel 通过 vercel.json rewrites 代理 /api/* 到后端，使用相对路径即可
// 本地开发：取消注释下一行，填写后端地址
//
// 注意：vercel.json 中的 ${BACKEND_URL} 需要在 Vercel 项目设置中配置环境变量：
//   BACKEND_URL = https://aihub-backend-app-production.up.railway.app
const AIHUB_CONFIG = {
  // API 基础地址：空字符串 = 使用相对路径（Vercel 代理）
  // API_BASE: 'https://aihub-backend-app-production.up.railway.app',
  API_BASE: '',
};
