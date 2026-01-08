# Vercel 部署指南

## 前置准备

1. **GitHub 账号**
2. **Vercel 账号** (可用 GitHub 登录: https://vercel.com)
3. **代码已推送到 GitHub**

---

## 快速部署 (3步)

### 步骤 1: 推送代码到 GitHub

```bash
# 初始化 git 仓库（如果没有）
cd D:\AI\1stpro
git init
git add .
git commit -m "feat: 完成待办事项应用全部功能"

# 创建 GitHub 仓库并推送
# 在 GitHub 网站创建空仓库，然后：
git remote add origin https://github.com/你的用户名/1stpro.git
git branch -M main
git push -u origin main
```

### 步骤 2: 在 Vercel 部署

1. 打开 https://vercel.com
2. 点击 **"Add New..."** → **"Project"**
3. 选择刚刚推送的 GitHub 仓库 **"1stpro"**
4. 点击 **"Import"**

### 步骤 3: 配置环境变量

在 Vercel 项目设置中，添加以下环境变量：

| 变量名 | 值 |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tizxvwmhcxdhompbjbri.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_VfFNgAB6X98iGaA7_UTFIw_kdul7mUc` |

**操作路径：**
- 项目页面 → **"Settings"** → **"Environment Variables"**
- 添加上述两个变量
- 点击 **"Save"**

### 步骤 4: 部署

1. 滚动到页面底部，点击 **"Deploy"**
2. 等待构建完成（通常 1-2 分钟）
3. 完成后会获得一个访问链接，如：`https://1stpro.vercel.app`

---

## 后续更新

推送新代码到 GitHub main 分支后，Vercel 会自动重新部署：

```bash
git add .
git commit -m "feat: 新功能描述"
git push
```

---

## 常见问题

### 1. 部署失败？

检查 Vercel 构建日志，常见问题：
- 环境变量未配置
- TypeScript 错误
- 依赖安装失败

### 2. 访问慢？

Vercel 在海外有节点，国内访问可能稍慢。可以考虑：
- 使用 Cloudflare Pages
- 或部署到国内平台（如腾讯云）

### 3. 自定义域名？

Vercel 支持自定义域名：
- 项目 → **Settings** → **Domains**
- 添加你的域名，按提示配置 DNS

---

## 部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] 在 Vercel 导入项目
- [ ] 配置了 Supabase 环境变量
- [ ] 部署成功，获得访问链接
- [ ] 测试功能正常

---

## 祝你部署顺利！ 🎉

有问题随时找浮浮酱哦～
