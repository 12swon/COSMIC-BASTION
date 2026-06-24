// =============================================
// COSMIC BASTION - Game Constants & Config
// =============================================
import * as THREE from 'three';

export const TOWER_DEFS = [
  { id:'laser',   name:'激光塔',   cost:50,  dmg:18,  range:5.5, rate:0.45, color:0x00ffff, desc:'高射速稳定输出' },
  { id:'plasma',  name:'等离子炮', cost:100, dmg:50,  range:4,   rate:1.4,  color:0xff00ff, desc:'高伤害慢射速' },
  { id:'gravity', name:'引力井',   cost:150, dmg:6,   range:6.5, rate:0.12, color:0x8844ff, desc:'持续减速范围控制', slow:0.45 },
  { id:'nova',    name:'新星炮',   cost:200, dmg:100, range:7,   rate:2.8,  color:0xffaa00, desc:'超远毁灭打击' },
  { id:'frost',   name:'冰冻塔',   cost:80,  dmg:8,   range:4.5, rate:0.6,  color:0x66ddff, desc:'减速+持续冰冻伤害', slow:0.55 },
  { id:'arc',     name:'电弧塔',   cost:130, dmg:35,  range:5,   rate:0.9,  color:0xffff44, desc:'链式闪电连击', chain:3 },
];

export const ENEMY_DEFS = {
  asteroid:   { name:'陨石舰',     hp:70,    spd:0.09,  reward:10,  color:0x999999, geo:'ico' },
  scout:      { name:'侦察机',     hp:45,    spd:0.16,  reward:15,  color:0x00ff88, geo:'oct' },
  cruiser:    { name:'巡洋舰',     hp:250,   spd:0.06,  reward:30,  color:0xff4444, geo:'box' },
  titan:      { name:'宇宙泰坦',   hp:1000,  spd:0.035, reward:120, color:0xdd44ff, geo:'dodec' },
  interceptor:{ name:'拦截舰',     hp:160,   spd:0.13,  reward:25,  color:0xff8800, geo:'tri' },
  drone:      { name:'蜂群无人机',  hp:25,    spd:0.22,  reward:8,   color:0x88ff00, geo:'drone' },
  fortress:   { name:'要塞',       hp:2500,  spd:0.025, reward:200, color:0xff2266, geo:'fort' },
};

export const WAVES = [
  [{t:'asteroid',n:8,iv:1.4}],
  [{t:'asteroid',n:10,iv:1.1},{t:'scout',n:4,iv:1.8}],
  [{t:'asteroid',n:8,iv:0.8},{t:'interceptor',n:4,iv:1.5}],
  [{t:'scout',n:10,iv:0.9},{t:'cruiser',n:3,iv:2.5}],
  [{t:'asteroid',n:12,iv:0.6},{t:'drone',n:8,iv:0.4},{t:'interceptor',n:5,iv:1.2}],
  [{t:'cruiser',n:7,iv:1.3},{t:'scout',n:10,iv:0.7},{t:'interceptor',n:6,iv:0.8}],
  [{t:'asteroid',n:16,iv:0.4},{t:'cruiser',n:5,iv:1.3},{t:'titan',n:1,iv:5}],
  [{t:'interceptor',n:10,iv:0.5},{t:'cruiser',n:8,iv:1},{t:'titan',n:2,iv:3.5}],
  [{t:'drone',n:16,iv:0.25},{t:'scout',n:18,iv:0.3},{t:'cruiser',n:8,iv:1},{t:'titan',n:3,iv:2.5}],
  [{t:'fortress',n:2,iv:4},{t:'titan',n:3,iv:2.5},{t:'cruiser',n:12,iv:0.6},{t:'asteroid',n:20,iv:0.3}],
];

/* Theme system: each range of waves has different visual atmosphere */
export const WAVE_THEMES = {
  // Waves 1-3: Asteroid Belt (default cyan)
  default: {
    bgColor: 0x030310, fogColor: 0x030310, fogDensity: 0.012,
    pathColor: 0x00f0ff, pathInner: 0x88ffff, gridColor: 0x111133,
    nebulaPalette: [0x2244aa,0x6622aa,0x224488,0xaa2266,0x224466,0x442288,0x882244,0x224488],
    ambientColor: 0x334466, ambientIntensity: 0.7,
    sunColor: 0xffeedd, sunIntensity: 0.6,
    coreColor: 0x00f0ff,
  },
  // Waves 4-6: Crimson Nebula (red/orange atmosphere)
  crimson: {
    bgColor: 0x100303, fogColor: 0x180505, fogDensity: 0.015,
    pathColor: 0xff4422, pathInner: 0xffaa44, gridColor: 0x331111,
    nebulaPalette: [0xaa3322,0x882222,0xaa4411,0x661122,0x883311,0xaa5533,0x992200,0x663322],
    ambientColor: 0x664433, ambientIntensity: 0.65,
    sunColor: 0xff8844, sunIntensity: 0.7,
    coreColor: 0xff6644,
  },
  // Waves 7-8: Void Storm (purple/dark)
  void: {
    bgColor: 0x0a0315, fogColor: 0x0a0315, fogDensity: 0.018,
    pathColor: 0xaa44ff, pathInner: 0xdd88ff, gridColor: 0x220a33,
    nebulaPalette: [0x440088,0x6600aa,0x220066,0x8822cc,0x440099,0x2a0055,0x6611bb,0x330077],
    ambientColor: 0x443366, ambientIntensity: 0.6,
    sunColor: 0xcc88ff, sunIntensity: 0.55,
    coreColor: 0xaa66ff,
  },
  // Waves 9-10: Final Battle (gold/intense)
  finale: {
    bgColor: 0x0c0800, fogColor: 0x0c0800, fogDensity: 0.02,
    pathColor: 0xffaa00, pathInner: 0xffff88, gridColor: 0x332200,
    nebulaPalette: [0xaa6600,0x884400,0xcc8822,0xaa7711,0x995500,0xddaa33,0x886611,0x664400],
    ambientColor: 0x665544, ambientIntensity: 0.65,
    sunColor: 0xffcc44, sunIntensity: 0.75,
    coreColor: 0xffcc44,
  },
};

/* Map wave number to theme name */
export function getWaveTheme(waveNum) {
  if(waveNum<=3) return WAVE_THEMES.default;
  if(waveNum<=6) return WAVE_THEMES.crimson;
  if(waveNum<=8) return WAVE_THEMES.void;
  return WAVE_THEMES.finale;
}

export const DIFFICULTY = {
  easy:  { hpMul:0.7,  spdMul:0.85, credits:300, label:'简单' },
  normal:{ hpMul:1.0,  spdMul:1.0,  credits:200, label:'普通' },
  hard:  { hpMul:1.5,  spdMul:1.15, credits:150, label:'困难' },
};

export const TARGET_MODES = ['FIRST','LAST','STRONG','WEAK'];

export const ACHIEVEMENT_DEFS = [
  { id:'first_blood',  name:'第一滴血',      desc:'消灭第一个敌人',                icon:'🎯' },
  { id:'kill_50',      name:'杀戮机器',      desc:'累计消灭50个敌人',              icon:'💀' },
  { id:'kill_100',     name:'毁灭者',        desc:'累计消灭100个敌人',             icon:'☠️' },
  { id:'wave_5',       name:'坚守者',        desc:'通过第5波',                     icon:'🛡️' },
  { id:'wave_10',      name:'传奇指挥官',    desc:'通过全部10波',                  icon:'👑' },
  { id:'first_tower',  name:'防御部署',      desc:'放置第一座防御塔',              icon:'🏗️' },
  { id:'upgrade_max',  name:'满级强化',      desc:'将任意塔升级到3级',             icon:'⬆️' },
  { id:'rich',         name:'资源大亨',      desc:'累计获得1000信用点',            icon:'💰' },
  { id:'no_damage',    name:'完美防御',      desc:'完成一波不损失核心HP',          icon:'✨' },
  { id:'all_types',    name:'全面布防',      desc:'放置所有类型的塔',              icon:'🔧' },
];

export const WAVE_STORIES = [
  '外围雷达探测到不明飞行物...陨石舰编队正在逼近。',
  '侦察机群突破了第二防线，它们在刺探我们的弱点。',
  '拦截舰出现！它们速度极快，小心防线缺口。',
  '巡洋舰主力编队出现！它们装备了重型装甲。红色星云笼罩战场。',
  '蜂群无人机群涌入！拦截舰配合巡洋舰发动钳形攻势。',
  '敌方第二梯队到达。猩红星云中隐藏着更多威胁。',
  '虫洞稳定器能量波动！虚空风暴中，泰坦正在逼近。',
  '泰坦旗舰编队出现。紫色虚空中，它们的护盾异常强大。',
  '最终决战前夕。蜂群铺天盖地，所有平台进入最高战备状态。',
  '虚空领主的终极要塞——金色战云中，一切即将终结。',
];

export const PATH_PTS = [
  [-20,0,-15],[-13,0,-7],[-5,0,-13],[3,0,-5],
  [11,0,-11],[15,0,-2],[9,0,6],[1,0,11],
  [-9,0,5],[-16,0,13],[-9,0,18]
].map(p=>new THREE.Vector3(p[0],p[1],p[2]));

export const PLATFORM_POS = [
  [-15,-4],[-8,-11],[0,-8],[7,-8],[14,-6],
  [13,2],[5,3],[3,9],[-5,8],[-12,9],
  [-18,5],[-6,-2],[8,-1],[-2,3],[-14,16],
];
