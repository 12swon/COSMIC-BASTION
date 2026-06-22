# Cosmic Bastion - 宇宙堡垒

一款基于 Three.js 构建的 3D 太空塔防网页游戏。玩家扮演公元 3187 年人类最后星际堡垒的防御指挥官，在 15 个浮空平台上部署四座远古武器矩阵，抵御暗物质军团 Void Swarm 的 10 波进攻，守护连接银河的唯一虫洞枢纽。

![Three.js](https://img.shields.io/badge/Three.js-r160-black)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## 在线预览

```bash
npm install
npm start
# 访问 http://localhost:3456
```

## 游戏特色

### 四座防御塔

| 防御塔 | 特性 | 价格 |
|--------|------|------|
| **激光塔** | 双管旋转炮塔 + 能量核心，高射速稳定输出 | 50 CR |
| **等离子炮** | 六边形炮身 + 等离子球体 + 三层充能环，高伤害慢射速 | 100 CR |
| **引力井** | 双层反旋环 + 中心奇点 + 引力波纹，持续减速范围控制 | 150 CR |
| **新星炮** | 八棱镜炮管 + 三叉王冠 + 能量蓄积球，超远毁灭打击 | 200 CR |

每座塔均可升级至 3 级，升级后 3D 模型实时重建并添加等级指示环。

### 四类敌人

| 敌人 | 特性 |
|------|------|
| **陨石舰** | 不规则岩石 + 发光裂纹 + 尾焰，基础单位 |
| **侦察机** | 自定义三角翼几何体 + 引擎发光 + 护盾环，高速低血量 |
| **巡洋舰** | 舰桥 + 双引擎 + 侧装甲板，重型装甲单位 |
| **宇宙泰坦** | 四臂延伸 + 能量护盾场，终极 Boss 级单位 |

### 核心系统

- **10 波关卡** — 难度递增的敌方舰队编队
- **三档难度** — 简单 / 普通 / 困难，影响敌人属性和初始资源
- **成就系统** — 10 项成就（第一滴血、杀戮机器、完美防御等），localStorage 跨局持久化
- **关卡选择** — 波次选择器，初始解锁 1-3 波，通关自动解锁下一波
- **防御塔上下文菜单** — 点击已放置的塔弹出升级 / 出售 / 目标模式切换面板
- **四档目标模式** — FIRST / LAST / STRONG / WEAK，支持全局和单塔独立设置
- **倍速控制** — 1x / 2x / 3x 游戏速度
- **自动波次** — 开启后自动倒计时开波
- **暂停系统** — P 键暂停 / 恢复
- **波次预告** — 战前展示下一波敌方舰队构成
- **故事叙事** — 每波开始时显示叙事文本，营造沉浸式氛围
- **排行榜** — 后端持久化存储 Top 100 分数
- **Web Audio 音效** — 程序化生成射击、爆炸、升级、成就等 8 种音效
- **弹道拖尾** — 弹丸飞行时的粒子尾迹特效

### 操作指南

| 操作 | 快捷键 |
|------|--------|
| 选择防御塔 | `1` `2` `3` `4` |
| 开波 | `Space` |
| 出售模式 | `S` |
| 暂停 | `P` |
| 目标模式切换 | `T` |
| 自动波次 | `A` |
| 加速 / 减速 | `+` / `-` |
| 旋转视角 | `Q` / `E` |
| 取消选择 | `Esc` |

## 技术架构

### 项目结构

```
cosmic-bastion/
├── server.js                  # Express 后端（排行榜 API + 静态文件服务）
├── package.json
├── data/
│   └── scores.json            # 排行榜数据
└── public/
    ├── index.html             # 游戏 UI（起始页 / HUD / 弹窗 / 面板）
    ├── css/
    │   └── style.css          # 全局样式（CSS 变量主题系统）
    └── js/
        ├── main.js            # 启动入口 + 游戏循环（~46 行）
        ├── constants.js       # 游戏数据常量（塔/敌/波次/成就/路径）
        ├── sound.js           # SoundSystem — Web Audio API 音效
        ├── scenes.js          # BackgroundScene + GameScene — 3D 场景管理
        ├── projectiles.js     # Trail / Projectile / NovaExplosion / Explosion
        ├── enemy.js           # Enemy — 4 种敌人 3D 模型 + 寻路
        ├── tower.js           # Tower — 4 种塔 3D 模型 + 射击 + 升级
        └── game.js            # Game — 主控制器（状态机/波次/UI/成就）
```

### 模块依赖图

```
constants.js  ← 纯数据，零导入
sound.js      ← Web Audio API，零导入
scenes.js     ← import THREE, constants.js
projectiles.js ← import THREE
enemy.js      ← import THREE, constants.js
tower.js      ← import THREE, constants.js, projectiles.js
game.js       ← import THREE, 所有模块
main.js       ← import game.js, scenes.js
```

### 技术栈

- **前端渲染** — Three.js r160（CDN via import map，无打包工具）
- **前端架构** — 原生 ES Modules，8 个独立模块，无循环依赖
- **后端** — Node.js + Express 4.18
- **音效** — Web Audio API 程序化合成（OscillatorNode + GainNode）
- **数据持久化** — 排行榜：JSON 文件（服务端）/ 成就 & 关卡解锁：localStorage（客户端）
- **字体** — Google Fonts（Orbitron / Rajdhani / Share Tech Mono）

## 快速开始

### 环境要求

- Node.js 18+
- 现代浏览器（Chrome / Firefox / Edge，支持 WebGL 2 和 ES Modules）

### 安装和运行

```bash
git clone https://github.com/your-username/cosmic-bastion.git
cd cosmic-bastion
npm install
npm start
```

浏览器访问 `http://localhost:3456` 即可游玩。

### 开发模式

```bash
npm run dev
```

当前开发模式与生产模式相同（直接运行 Express 静态服务）。如需热重载，可自行添加 nodemon：

```bash
npx nodemon server.js
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/scores` | 获取排行榜 Top 100 |
| `POST` | `/api/scores` | 提交分数 `{name, score, wave}` |
| `GET` | `/api/config` | 获取游戏配置数据 |

## 许可证

MIT License
