// =============================================
// COSMIC BASTION - Game Constants & Config
// =============================================
import * as THREE from 'three';

export const TOWER_DEFS = [
  { id:'laser',   name:'激光塔',   cost:50,  dmg:18,  range:5.5, rate:0.45, color:0x00ffff, desc:'高射速稳定输出' },
  { id:'plasma',  name:'等离子炮', cost:100, dmg:50,  range:4,   rate:1.4,  color:0xff00ff, desc:'高伤害慢射速' },
  { id:'gravity', name:'引力井',   cost:150, dmg:6,   range:6.5, rate:0.12, color:0x8844ff, desc:'持续减速范围控制', slow:0.45 },
  { id:'nova',    name:'新星炮',   cost:200, dmg:100, range:7,   rate:2.8,  color:0xffaa00, desc:'超远毁灭打击' },
];

export const ENEMY_DEFS = {
  asteroid:{ name:'陨石舰', hp:70,   spd:0.09, reward:10,  color:0x999999, geo:'ico' },
  scout:   { name:'侦察机', hp:45,   spd:0.16, reward:15,  color:0x00ff88, geo:'oct' },
  cruiser: { name:'巡洋舰', hp:250,  spd:0.06, reward:30,  color:0xff4444, geo:'box' },
  titan:   { name:'宇宙泰坦',hp:1000,spd:0.035,reward:120, color:0xdd44ff, geo:'dodec' },
};

export const WAVES = [
  [{t:'asteroid',n:8,iv:1.4}],
  [{t:'asteroid',n:10,iv:1.1},{t:'scout',n:4,iv:1.8}],
  [{t:'asteroid',n:12,iv:0.9},{t:'scout',n:6,iv:1.3}],
  [{t:'scout',n:10,iv:0.9},{t:'cruiser',n:3,iv:2.5}],
  [{t:'asteroid',n:16,iv:0.7},{t:'cruiser',n:5,iv:2}],
  [{t:'cruiser',n:7,iv:1.3},{t:'scout',n:12,iv:0.7}],
  [{t:'asteroid',n:20,iv:0.45},{t:'cruiser',n:6,iv:1.3},{t:'titan',n:1,iv:5}],
  [{t:'cruiser',n:10,iv:1},{t:'titan',n:2,iv:3.5}],
  [{t:'scout',n:22,iv:0.35},{t:'cruiser',n:8,iv:1},{t:'titan',n:3,iv:2.5}],
  [{t:'titan',n:5,iv:2},{t:'cruiser',n:15,iv:0.55},{t:'asteroid',n:30,iv:0.25}],
];

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
  '巡洋舰主力编队出现！它们装备了重型装甲。',
  '警告：检测到巨型能量特征——宇宙泰坦正在接近。',
  '敌方投入全部兵力，这是决定性的一战。',
  '虚空涌潮的第二梯队到达，攻势更加猛烈。',
  '虫洞稳定器能量波动！必须守住防线。',
  '泰坦旗舰编队出现，它们的护盾异常强大。',
  '最终决战前夕。所有平台进入最高战备状态。',
  '虚空领主的最后进攻——要么胜利，要么堡垒陷落。',
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
