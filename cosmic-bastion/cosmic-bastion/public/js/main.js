// =============================================
// COSMIC BASTION — 宇宙堡垒 3D Tower Defense
// Core Engine v2.0  (Three.js r160, ES Modules)
// 10 New Features Integrated
// =============================================
import * as THREE from 'three';

/* ---------- constants ---------- */
const TOWER_DEFS = [
  { id:'laser',   name:'激光塔',   cost:50,  dmg:18,  range:5.5, rate:0.45, color:0x00ffff, desc:'高射速稳定输出' },
  { id:'plasma',  name:'等离子炮', cost:100, dmg:50,  range:4,   rate:1.4,  color:0xff00ff, desc:'高伤害慢射速' },
  { id:'gravity', name:'引力井',   cost:150, dmg:6,   range:6.5, rate:0.12, color:0x8844ff, desc:'持续减速范围控制', slow:0.45 },
  { id:'nova',    name:'新星炮',   cost:200, dmg:100, range:7,   rate:2.8,  color:0xffaa00, desc:'超远毁灭打击' },
];
const ENEMY_DEFS = {
  asteroid:{ name:'陨石舰', hp:70,  spd:0.09, reward:10,  color:0x999999, geo:'ico' },
  scout:   { name:'侦察机', hp:45,  spd:0.16, reward:15,  color:0x00ff88, geo:'oct' },
  cruiser: { name:'巡洋舰', hp:250, spd:0.06, reward:30,  color:0xff4444, geo:'box' },
  titan:   { name:'宇宙泰坦',hp:1000,spd:0.035,reward:120, color:0xdd44ff, geo:'dodec' },
};
const WAVES = [
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

const DIFFICULTY = {
  easy:  { hpMul:0.7,  spdMul:0.85, credits:300, label:'简单' },
  normal:{ hpMul:1.0,  spdMul:1.0,  credits:200, label:'普通' },
  hard:  { hpMul:1.5,  spdMul:1.15, credits:150, label:'困难' },
};

const TARGET_MODES = ['FIRST','LAST','STRONG','WEAK'];

const ACHIEVEMENT_DEFS = [
  { id:'first_blood',  name:'第一滴血',     desc:'消灭第一个敌人',        icon:'🎯' },
  { id:'kill_50',      name:'杀戮机器',     desc:'累计消灭50个敌人',      icon:'💀' },
  { id:'kill_100',     name:'毁灭者',       desc:'累计消灭100个敌人',     icon:'☠️' },
  { id:'wave_5',       name:'坚守者',       desc:'通过第5波',             icon:'🛡️' },
  { id:'wave_10',      name:'传奇指挥官',   desc:'通过全部10波',          icon:'👑' },
  { id:'first_tower',  name:'防御部署',     desc:'放置第一座防御塔',      icon:'🏗️' },
  { id:'upgrade_max',  name:'满级强化',     desc:'将任意塔升级到3级',     icon:'⬆️' },
  { id:'rich',         name:'资源大亨',     desc:'累计获得1000信用点',    icon:'💰' },
  { id:'no_damage',    name:'完美防御',     desc:'完成一波不损失核心HP',  icon:'✨' },
  { id:'all_types',    name:'全面布防',     desc:'放置所有类型的塔',      icon:'🔧' },
];

/* ---------- path control points ---------- */
const PATH_PTS = [
  [-20,0,-15],[-13,0,-7],[-5,0,-13],[3,0,-5],
  [11,0,-11],[15,0,-2],[9,0,6],[1,0,11],
  [-9,0,5],[-16,0,13],[-9,0,18]
].map(p=>new THREE.Vector3(p[0],p[1],p[2]));

/* ---------- platform positions ---------- */
const PLATFORM_POS = [
  [-15,-4],[-8,-11],[0,-8],[7,-8],[14,-6],
  [13,2],[5,3],[3,9],[-5,8],[-12,9],
  [-18,5],[-6,-2],[8,-1],[-2,3],[-14,16],
];

/* =========================================================
   [F2] SOUND SYSTEM — Web Audio API procedural sounds
   ========================================================= */
class SoundSystem {
  constructor(){ this.ctx=null; this.enabled=true; }
  _ensure(){
    if(!this.ctx) this.ctx=new (window.AudioContext||window.webkitAudioContext)();
    if(this.ctx.state==='suspended') this.ctx.resume();
  }
  play(type){
    if(!this.enabled) return;
    try{ this._ensure(); this['_'+type](); }catch(e){}
  }
  _shoot(){
    const o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type='sine';
    o.frequency.setValueAtTime(1400,this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(600,this.ctx.currentTime+0.06);
    g.gain.setValueAtTime(0.07,this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,this.ctx.currentTime+0.06);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime+0.06);
  }
  _hit(){
    const o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type='triangle';
    o.frequency.setValueAtTime(280,this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(60,this.ctx.currentTime+0.12);
    g.gain.setValueAtTime(0.1,this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,this.ctx.currentTime+0.12);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime+0.12);
  }
  _waveStart(){
    const t=this.ctx.currentTime;
    const o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type='sawtooth';
    o.frequency.setValueAtTime(180,t);
    o.frequency.exponentialRampToValueAtTime(700,t+0.35);
    g.gain.setValueAtTime(0.06,t);
    g.gain.linearRampToValueAtTime(0.09,t+0.15);
    g.gain.exponentialRampToValueAtTime(0.001,t+0.45);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(t+0.45);
  }
  _upgrade(){
    const t=this.ctx.currentTime;
    const o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type='sine';
    o.frequency.setValueAtTime(400,t);
    o.frequency.exponentialRampToValueAtTime(900,t+0.18);
    g.gain.setValueAtTime(0.08,t);
    g.gain.exponentialRampToValueAtTime(0.001,t+0.22);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(t+0.22);
  }
  _achieve(){
    const t=this.ctx.currentTime;
    [523,659,784].forEach((f,i)=>{
      const o=this.ctx.createOscillator(), g=this.ctx.createGain();
      o.type='sine';
      o.frequency.setValueAtTime(f,t+i*0.1);
      g.gain.setValueAtTime(0.07,t+i*0.1);
      g.gain.exponentialRampToValueAtTime(0.001,t+i*0.1+0.25);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(t+i*0.1); o.stop(t+i*0.1+0.25);
    });
  }
  _place(){
    const o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type='sine';
    o.frequency.setValueAtTime(500,this.ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(700,this.ctx.currentTime+0.1);
    g.gain.setValueAtTime(0.06,this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,this.ctx.currentTime+0.1);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime+0.1);
  }
  _gameOver(){
    const t=this.ctx.currentTime;
    const o=this.ctx.createOscillator(), g=this.ctx.createGain();
    o.type='sawtooth';
    o.frequency.setValueAtTime(350,t);
    o.frequency.exponentialRampToValueAtTime(80,t+0.7);
    g.gain.setValueAtTime(0.08,t);
    g.gain.exponentialRampToValueAtTime(0.001,t+0.7);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(t+0.7);
  }
  _victory(){
    const t=this.ctx.currentTime;
    [523,659,784,1047].forEach((f,i)=>{
      const o=this.ctx.createOscillator(), g=this.ctx.createGain();
      o.type='sine';
      o.frequency.setValueAtTime(f,t+i*0.14);
      g.gain.setValueAtTime(0.08,t+i*0.14);
      g.gain.exponentialRampToValueAtTime(0.001,t+i*0.14+0.35);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(t+i*0.14); o.stop(t+i*0.14+0.35);
    });
  }
}

/* =========================================================
   [F6] TRAIL — fading line behind projectiles
   ========================================================= */
class Trail {
  constructor(color, scene){
    this.maxPts=6;
    this.positions=[];
    this.scene=scene;
    this.dead=false;
    const maxSegs=this.maxPts-1;
    this.arr=new Float32Array(this.maxPts*3);
    this.geo=new THREE.BufferGeometry();
    this.geo.setAttribute('position',new THREE.BufferAttribute(this.arr,3));
    this.geo.setDrawRange(0,0);
    this.line=new THREE.Line(this.geo,new THREE.LineBasicMaterial({
      color, transparent:true, opacity:0.55, blending:THREE.AdditiveBlending
    }));
    scene.add(this.line);
  }
  addPoint(pos){
    this.positions.push(pos.clone());
    if(this.positions.length>this.maxPts) this.positions.shift();
    for(let i=0;i<this.positions.length;i++){
      this.arr[i*3]=this.positions[i].x;
      this.arr[i*3+1]=this.positions[i].y;
      this.arr[i*3+2]=this.positions[i].z;
    }
    this.geo.attributes.position.needsUpdate=true;
    this.geo.setDrawRange(0,this.positions.length);
  }
  destroy(){
    this.dead=true;
    this.scene.remove(this.line);
    this.geo.dispose();
    this.line.material.dispose();
  }
}

/* =========================================================
   BACKGROUND SCENE — starfield + nebula
   ========================================================= */
class BackgroundScene {
  constructor(canvas){
    const W=innerWidth||1280, H=innerHeight||800;
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(60, W/H, 0.1, 2000);
    this.cam.position.set(0,0,1);
    this.renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false});
    this.renderer.setSize(W, H);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    this.renderer.setClearColor(0x030308);
    this._buildStars();
    this._buildNebula();
    this.clock = new THREE.Clock();
    window.addEventListener('resize',()=>this._resize());
  }
  _buildStars(){
    const N=4000, pos=new Float32Array(N*3), cols=new Float32Array(N*3);
    for(let i=0;i<N;i++){
      pos[i*3]=(Math.random()-0.5)*600;
      pos[i*3+1]=(Math.random()-0.5)*600;
      pos[i*3+2]=(Math.random()-0.5)*600;
      const c=new THREE.Color().setHSL(Math.random()*0.15+0.55,0.6,0.7+Math.random()*0.3);
      cols[i*3]=c.r; cols[i*3+1]=c.g; cols[i*3+2]=c.b;
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(pos,3));
    g.setAttribute('color',new THREE.BufferAttribute(cols,3));
    this.stars=new THREE.Points(g,new THREE.PointsMaterial({size:1.2,vertexColors:true,transparent:true,opacity:0.85,sizeAttenuation:true}));
    this.scene.add(this.stars);
  }
  _buildNebula(){
    this.clouds=[];
    const palette=[0x2244aa,0x6622aa,0x224488,0xaa2266,0x224466,0x442288,0x882244,0x224488];
    for(let i=0;i<8;i++){
      const g=new THREE.SphereGeometry(25+Math.random()*35,12,12);
      const m=new THREE.MeshBasicMaterial({color:palette[i],transparent:true,opacity:0.025+Math.random()*0.025,blending:THREE.AdditiveBlending,depthWrite:false});
      const mesh=new THREE.Mesh(g,m);
      mesh.position.set((Math.random()-0.5)*180,(Math.random()-0.5)*120,(Math.random()-0.5)*120-60);
      mesh.scale.set(1+Math.random(),0.4+Math.random()*0.5,1+Math.random());
      this.scene.add(mesh);
      this.clouds.push({mesh,baseOp:m.opacity,phase:Math.random()*Math.PI*2});
    }
  }
  _resize(){
    const W=innerWidth||1280, H=innerHeight||800;
    this.cam.aspect=W/H;
    this.cam.updateProjectionMatrix();
    this.renderer.setSize(W, H);
  }
  render(){
    const t=this.clock.getElapsedTime();
    this.stars.rotation.y=t*0.008;
    this.stars.rotation.x=t*0.003;
    for(const c of this.clouds){
      c.mesh.material.opacity=c.baseOp+Math.sin(t*0.3+c.phase)*0.008;
    }
    this.renderer.render(this.scene,this.cam);
  }
}

/* =========================================================
   GAME SCENE — tower defense playfield
   ========================================================= */
class GameScene {
  constructor(){
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x030310, 0.012);

    this.cam = new THREE.PerspectiveCamera(50,(innerWidth||1280)/(innerHeight||800),0.1,500);
    this.cam.position.set(0,38,26);
    this.cam.lookAt(0,0,2);

    this.renderer = new THREE.WebGLRenderer({antialias:true,alpha:false});
    const gW=innerWidth||1280, gH=innerHeight||800;
    this.renderer.setSize(gW, gH);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    this.renderer.setClearColor(0x030310);
    this.renderer.shadowMap.enabled=false;
    const cvs=this.renderer.domElement;
    cvs.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;z-index:1;display:none;';
    document.body.appendChild(cvs);
    this.canvas=cvs;

    /* lights */
    this.scene.add(new THREE.AmbientLight(0x334466,0.7));
    const sun=new THREE.DirectionalLight(0xffeedd,0.6);
    sun.position.set(10,30,15);
    this.scene.add(sun);
    const core=new THREE.PointLight(0x00f0ff,1.5,50);
    core.position.set(-9,3,18);
    this.scene.add(core);

    /* build world */
    this._buildStars();
    this.path = this._buildPath();
    this.platforms = this._buildPlatforms();
    this._buildCore();
    this._buildGrid();

    window.addEventListener('resize',()=>this._resize());
  }

  _resize(){
    const W=innerWidth||1280, H=innerHeight||800;
    this.cam.aspect=W/H;
    this.cam.updateProjectionMatrix();
    this.renderer.setSize(W, H);
  }

  _buildStars(){
    const N=2000,pos=new Float32Array(N*3);
    for(let i=0;i<N;i++){
      pos[i*3]=(Math.random()-0.5)*200;
      pos[i*3+1]=Math.random()*80+10;
      pos[i*3+2]=(Math.random()-0.5)*200;
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(pos,3));
    this.scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:0.3,color:0xaabbee,transparent:true,opacity:0.6})));
  }

  _buildPath(){
    const curve=new THREE.CatmullRomCurve3(PATH_PTS,false,'catmullrom',0.5);
    const pts=curve.getPoints(400);

    /* outer glow tube */
    const tubeG=new THREE.TubeGeometry(curve,200,0.35,8,false);
    const tubeM=new THREE.MeshBasicMaterial({color:0x00f0ff,transparent:true,opacity:0.35,blending:THREE.AdditiveBlending});
    this.scene.add(new THREE.Mesh(tubeG,tubeM));

    /* inner bright tube */
    const tube2G=new THREE.TubeGeometry(curve,200,0.12,6,false);
    const tube2M=new THREE.MeshBasicMaterial({color:0x88ffff,transparent:true,opacity:0.7});
    this.scene.add(new THREE.Mesh(tube2G,tube2M));

    /* direction markers */
    for(let i=0;i<pts.length;i+=20){
      const s=new THREE.Mesh(new THREE.SphereGeometry(0.15,6,6),new THREE.MeshBasicMaterial({color:0x00ffff,transparent:true,opacity:0.5}));
      s.position.copy(pts[i]); s.position.y+=0.2;
      this.scene.add(s);
    }
    return {curve, points:pts};
  }

  _buildPlatforms(){
    return PLATFORM_POS.map(([x,z])=>{
      const g=new THREE.CylinderGeometry(1.3,1.5,0.45,6);
      const m=new THREE.MeshStandardMaterial({color:0x14142a,emissive:0x0a0a20,metalness:0.85,roughness:0.35});
      const mesh=new THREE.Mesh(g,m);
      mesh.position.set(x,0,z);
      /* ring */
      const ring=new THREE.Mesh(new THREE.RingGeometry(1.35,1.55,6),new THREE.MeshBasicMaterial({color:0x00f0ff,transparent:true,opacity:0.18,side:THREE.DoubleSide}));
      ring.rotation.x=-Math.PI/2; ring.position.y=0.25;
      mesh.add(ring);
      this.scene.add(mesh);
      return {mesh,pos:new THREE.Vector3(x,0,z),occupied:false,towerId:null};
    });
  }

  _buildCore(){
    const g=new THREE.IcosahedronGeometry(1.4,1);
    const m=new THREE.MeshStandardMaterial({color:0x00f0ff,emissive:0x005577,emissiveIntensity:0.6,metalness:0.9,roughness:0.15});
    this.coreMesh=new THREE.Mesh(g,m);
    const end=PATH_PTS[PATH_PTS.length-1];
    this.coreMesh.position.set(end.x,2,end.z);
    this.scene.add(this.coreMesh);
    /* glow */
    const glow=new THREE.Mesh(new THREE.SphereGeometry(2.5,16,16),new THREE.MeshBasicMaterial({color:0x00f0ff,transparent:true,opacity:0.08,blending:THREE.AdditiveBlending}));
    glow.position.copy(this.coreMesh.position);
    this.scene.add(glow);
    this.coreGlow=glow;
  }

  _buildGrid(){
    const gridMat=new THREE.LineBasicMaterial({color:0x111133,transparent:true,opacity:0.25});
    for(let i=-25;i<=25;i+=5){
      const pts1=[new THREE.Vector3(i,-0.3,-25),new THREE.Vector3(i,-0.3,25)];
      const pts2=[new THREE.Vector3(-25,-0.3,i),new THREE.Vector3(25,-0.3,i)];
      this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts1),gridMat));
      this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts2),gridMat));
    }
  }

  show(){ this.canvas.style.display='block'; }
  hide(){ this.canvas.style.display='none'; }

  render(){
    const t=performance.now()*0.001;
    this.coreMesh.rotation.y=t*0.5;
    this.coreMesh.rotation.x=Math.sin(t*0.3)*0.2;
    this.coreMesh.position.y=2+Math.sin(t*0.8)*0.3;
    this.coreGlow.material.opacity=0.06+Math.sin(t)*0.03;
    this.renderer.render(this.scene,this.cam);
  }
}

/* =========================================================
   TOWER — 3D model + shooting logic + [F1] upgrade system
   ========================================================= */
class Tower {
  constructor(def, pos, scene){
    this.def=def; this.scene=scene;
    this.pos=pos.clone(); this.pos.y=0.3;
    this.cooldown=0; this.target=null;
    this.level=1; this.targetMode=null; // null = use game default
    this.group=new THREE.Group();
    this.group.position.copy(this.pos);
    this._build();
    this._buildRangeRing();
    scene.add(this.group);
  }
  _build(){
    const c=this.def.color;
    const bm=new THREE.MeshStandardMaterial({color:0x1a1a30,emissive:c,emissiveIntensity:0.15,metalness:0.9,roughness:0.3});
    /* base */
    const base=new THREE.Mesh(new THREE.CylinderGeometry(0.65,0.85,0.55,8),bm);
    base.position.set(0,0.28,0);
    this.group.add(base);
    /* body */
    const bodyM=new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:0.3,metalness:0.8,roughness:0.2});
    switch(this.def.id){
      case 'laser':{
        const barrel=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,1.6,8),bodyM);
        barrel.position.y=1.35; this.group.add(barrel);
        const top=new THREE.Mesh(new THREE.SphereGeometry(0.22,8,8),bodyM);
        top.position.y=2.15; this.group.add(top);
        break;
      }
      case 'plasma':{
        const cannon=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.18,1.3,6),bodyM);
        cannon.position.y=1.2; this.group.add(cannon);
        const dish=new THREE.Mesh(new THREE.TorusGeometry(0.35,0.07,8,16),bodyM);
        dish.position.y=1.9; dish.rotation.x=Math.PI/2; this.group.add(dish);
        break;
      }
      case 'gravity':{
        const well=new THREE.Mesh(new THREE.TorusGeometry(0.55,0.12,12,24),bodyM);
        well.position.y=1.1; well.rotation.x=Math.PI/2; this.group.add(well);
        const orb=new THREE.Mesh(new THREE.SphereGeometry(0.25,12,12),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.55,blending:THREE.AdditiveBlending}));
        orb.position.y=1.1; this.group.add(orb);
        this._gravOrb=orb;
        break;
      }
      case 'nova':{
        const big=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.35,2,8),bodyM);
        big.position.y=1.5; this.group.add(big);
        const crown=new THREE.Mesh(new THREE.ConeGeometry(0.45,0.6,8),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.65}));
        crown.position.y=2.7; this.group.add(crown);
        break;
      }
    }
    /* accent ring */
    const ring=new THREE.Mesh(new THREE.TorusGeometry(0.75,0.04,8,24),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.35}));
    ring.position.y=0.55; ring.rotation.x=Math.PI/2; this.group.add(ring);
  }
  _buildRangeRing(){
    const r=this.getRange();
    const rr=new THREE.Mesh(new THREE.RingGeometry(r-0.08,r,48),new THREE.MeshBasicMaterial({color:this.def.color,transparent:true,opacity:0.12,side:THREE.DoubleSide}));
    rr.rotation.x=-Math.PI/2; rr.position.y=-0.2;
    this.rangeRing=rr; this.group.add(rr);
  }
  getDamage(){ return Math.round(this.def.dmg*(1+(this.level-1)*0.4)); }
  getRange(){ return this.def.range*(1+(this.level-1)*0.15); }
  getUpgradeCost(){
    if(this.level>=3) return Infinity;
    return Math.round(this.def.cost*(this.level===1?0.6:0.8));
  }
  upgrade(){
    if(this.level>=3) return false;
    this.level++;
    /* clear old visuals */
    while(this.group.children.length>0) this.group.remove(this.group.children[0]);
    this._build();
    this._buildRangeRing();
    /* level indicator rings */
    for(let i=1;i<this.level;i++){
      const lr=new THREE.Mesh(
        new THREE.TorusGeometry(0.95+i*0.12,0.035,6,20),
        new THREE.MeshBasicMaterial({color:0x00ff88,transparent:true,opacity:0.55})
      );
      lr.position.y=0.08+i*0.06; lr.rotation.x=Math.PI/2;
      this.group.add(lr);
    }
    return true;
  }
  update(dt, enemies, projectiles, gameTargetMode, sound){
    this.cooldown=Math.max(0,this.cooldown-dt);
    const t=performance.now()*0.001;
    if(this._gravOrb) this._gravOrb.scale.setScalar(1+Math.sin(t*3)*0.15);
    const range=this.getRange();
    const dmg=this.getDamage();
    /* gravity well: slow enemies in range */
    if(this.def.slow){
      for(const e of enemies){
        if(e.dead) continue;
        if(e.mesh.position.distanceTo(this.group.position)<range){
          e.speedMul=Math.min(e.speedMul, 1-this.def.slow);
        }
      }
    }
    /* find target using [F7] targeting mode */
    const mode=this.targetMode||gameTargetMode;
    this.target=null;
    let bestVal=null;
    for(const e of enemies){
      if(e.dead) continue;
      const d=e.mesh.position.distanceTo(this.group.position);
      if(d>range) continue;
      let pick=false;
      switch(mode){
        case 'FIRST':
          if(bestVal===null||e.pathT>bestVal){bestVal=e.pathT;pick=true;}
          break;
        case 'LAST':
          if(bestVal===null||e.pathT<bestVal){bestVal=e.pathT;pick=true;}
          break;
        case 'STRONG':
          if(bestVal===null||e.hp>bestVal){bestVal=e.hp;pick=true;}
          break;
        case 'WEAK':
          if(bestVal===null||e.hp<bestVal){bestVal=e.hp;pick=true;}
          break;
      }
      if(pick) this.target=e;
    }
    if(this.target && this.cooldown<=0){
      this.cooldown=this.def.rate;
      if(sound) sound.play('shoot');
      if(this.def.id==='gravity'){
        /* AoE pulse */
        for(const e of enemies){
          if(!e.dead && e.mesh.position.distanceTo(this.group.position)<range){
            projectiles.push(new Projectile(this.group.position.clone().setY(1.2),e,dmg,0x8844ff,6,this.group.parent));
          }
        }
      } else {
        projectiles.push(new Projectile(this.group.position.clone().setY(1.8),this.target,dmg,this.def.color, this.def.id==='nova'?5:8, this.group.parent));
      }
    }
  }
  destroy(){
    this.scene.remove(this.group);
  }
}

/* =========================================================
   ENEMY — follows path, has HP
   ========================================================= */
class Enemy {
  constructor(type, curve, scene, diffMul){
    const d=ENEMY_DEFS[type];
    const hpMul=diffMul?diffMul.hpMul:1;
    const spdMul=diffMul?diffMul.spdMul:1;
    this.type=type;
    this.hp=Math.round(d.hp*hpMul); this.maxHp=this.hp;
    this.baseSpd=d.spd*spdMul; this.reward=d.reward;
    this.dead=false; this.reached=false;
    this.pathT=0; this.scene=scene; this.speedMul=1;

    const gMap={ico:new THREE.IcosahedronGeometry(0.45,0), oct:new THREE.OctahedronGeometry(0.4,0), box:new THREE.BoxGeometry(0.7,0.35,0.5), dodec:new THREE.DodecahedronGeometry(0.65,0)};
    const mat=new THREE.MeshStandardMaterial({color:d.color,emissive:d.color,emissiveIntensity:0.25,metalness:0.6,roughness:0.4});
    this.mesh=new THREE.Mesh(gMap[d.geo],mat);
    this.mesh.add(new THREE.Mesh(gMap[d.geo],new THREE.MeshBasicMaterial({color:d.color,wireframe:true,transparent:true,opacity:0.35})));

    /* HP bar */
    this.hpBg=new THREE.Sprite(new THREE.SpriteMaterial({color:0x330000}));
    this.hpBg.scale.set(1,0.1,1); this.hpBg.position.y=1;
    this.hpFg=new THREE.Sprite(new THREE.SpriteMaterial({color:0x00ff66}));
    this.hpFg.scale.set(1,0.1,1); this.hpFg.position.y=1;
    this.mesh.add(this.hpBg,this.hpFg);

    const p=curve.getPointAt(0);
    this.mesh.position.copy(p); this.mesh.position.y=0.6;
    scene.add(this.mesh);
    this.curve=curve;
  }
  damage(n){
    this.hp=Math.max(0,this.hp-n);
    const r=this.hp/this.maxHp;
    this.hpFg.scale.x=Math.max(r,0.001);
    this.hpFg.position.x=-(1-r)*0.5;
    this.hpFg.material.color.setHex(r>0.5?0x00ff66:r>0.25?0xffaa00:0xff3344);
    if(this.hp<=0) this.dead=true;
  }
  update(dt){
    if(this.dead||this.reached) return;
    this.pathT+=this.baseSpd*this.speedMul*dt;
    if(this.pathT>=1){this.reached=true; return;}
    const p=this.curve.getPointAt(Math.min(this.pathT,0.999));
    this.mesh.position.set(p.x,0.6,p.z);
    this.mesh.rotation.y+=dt*2.5;
    this.mesh.rotation.x+=dt*0.7;
  }
  destroy(){ this.scene.remove(this.mesh); }
}

/* =========================================================
   PROJECTILE — homing + [F6] trail effects
   ========================================================= */
class Projectile {
  constructor(pos,target,dmg,color,spd,scene){
    this.target=target; this.dmg=dmg; this.spd=spd||8;
    this.dead=false; this.color=color;
    this.mesh=new THREE.Mesh(new THREE.SphereGeometry(0.12,6,6),new THREE.MeshBasicMaterial({color,blending:THREE.AdditiveBlending}));
    this.mesh.position.copy(pos);
    this.trail=null; this.scene=scene||null;
    this._trailFrame=0;
    if(scene){
      this.trail=new Trail(color,scene);
    }
  }
  update(dt){
    if(this.dead) return;
    if(!this.target||this.target.dead||this.target.reached){this.dead=true;return;}
    const dir=this.target.mesh.position.clone().sub(this.mesh.position);
    const d=dir.length();
    if(d<0.4){this.target.damage(this.dmg);this.dead=true;return;}
    dir.normalize();
    this.mesh.position.addScaledVector(dir,this.spd*dt);
    /* [F6] trail */
    if(this.trail){
      this._trailFrame++;
      if(this._trailFrame%2===0) this.trail.addPoint(this.mesh.position);
    }
  }
  destroy(){
    if(this.trail){ this.trail.destroy(); this.trail=null; }
    if(this.mesh.parent) this.mesh.parent.remove(this.mesh);
  }
}

/* Nova explosion projectile */
class NovaExplosion {
  constructor(pos,maxR,dmg,color,scene){
    this.pos=pos; this.maxR=maxR; this.dmg=dmg; this.r=0;
    this.dead=false; this.hit=new Set(); this.scene=scene; this.life=0.5;
    const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.5,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
    this.mesh=new THREE.Mesh(new THREE.SphereGeometry(1,16,16),m);
    this.mesh.position.copy(pos);
    scene.add(this.mesh);
  }
  update(dt,enemies){
    if(this.dead) return;
    this.r+=this.maxR*dt*3;
    this.life-=dt;
    this.mesh.scale.setScalar(this.r);
    this.mesh.material.opacity=Math.max(0,this.life);
    for(const e of enemies){
      if(e.dead||this.hit.has(e)) continue;
      if(e.mesh.position.distanceTo(this.pos)<this.r){e.damage(this.dmg);this.hit.add(e);}
    }
    if(this.life<=0) this.dead=true;
  }
  destroy(){ this.scene.remove(this.mesh); }
}

/* =========================================================
   EXPLOSION PARTICLES — small burst effect
   ========================================================= */
class Explosion {
  constructor(pos,color,scene){
    this.scene=scene; this.life=0.6; this.dead=false;
    const N=16, arr=new Float32Array(N*3), vels=[];
    for(let i=0;i<N;i++){
      arr[i*3]=pos.x; arr[i*3+1]=pos.y; arr[i*3+2]=pos.z;
      vels.push(new THREE.Vector3((Math.random()-0.5)*6,(Math.random()-0.5)*6,(Math.random()-0.5)*6));
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(arr,3));
    this.vels=vels; this.geo=g;
    this.pts=new THREE.Points(g,new THREE.PointsMaterial({color,size:0.3,transparent:true,opacity:1,blending:THREE.AdditiveBlending}));
    scene.add(this.pts);
  }
  update(dt){
    this.life-=dt;
    if(this.life<=0){this.dead=true;return;}
    const arr=this.geo.attributes.position.array;
    for(let i=0;i<this.vels.length;i++){
      arr[i*3]+=this.vels[i].x*dt;
      arr[i*3+1]+=this.vels[i].y*dt;
      arr[i*3+2]+=this.vels[i].z*dt;
    }
    this.geo.attributes.position.needsUpdate=true;
    this.pts.material.opacity=this.life/0.6;
  }
  destroy(){ this.scene.remove(this.pts); }
}

/* =========================================================
   MAIN GAME CONTROLLER — with all 10 new features
   ========================================================= */
class Game {
  constructor(bgScene, gameScene){
    this.bg=bgScene; this.gs=gameScene;
    this.state='menu'; // menu | playing | over | victory
    this.reset();
    this.towers=[]; this.enemies=[]; this.projectiles=[]; this.effects=[];
    this.selectedTower=null; this.sellMode=false;
    this.ray=new THREE.Raycaster();
    this.mouse=new THREE.Vector2();
    this.hoveredPlatform=null;
    this.highlightMesh=this._makeHighlight();
    this.gs.scene.add(this.highlightMesh);

    /* spawn queue */
    this.spawnQueue=[]; this.spawnTimer=0;
    this.waveActive=false;

    /* [F2] Sound */
    this.sound=new SoundSystem();
    /* [F3] Pause */
    this.paused=false;
    /* [F4] Speed */
    this.gameSpeed=1;
    /* [F7] Target mode */
    this.targetMode='FIRST';
    this.targetModeIdx=0;
    /* [F8] Achievements */
    this.achievements=new Set();
    this.totalCreditsEarned=0;
    this.towerTypesPlaced=new Set();
    /* [F9] Difficulty */
    this.difficulty='normal';
    this.diffMul=DIFFICULTY.normal;
    /* [F10] Auto-wave */
    this.autoWave=false;
    this.autoWaveTimer=0;
    this.autoWaveCountdown=5;
    /* [F3] wave damage tracking for achievement */
    this._waveDmgTaken=false;

    /* UI refs */
    this._cacheUI();
    this._buildTowerButtons();
    this._bindEvents();
    /* [F5] initial wave preview */
    this._updateWavePreview();
  }

  reset(){
    this.credits=200; this.coreHp=100; this.maxHp=100;
    this.score=0; this.kills=0;
    this.currentWave=0; this.totalWaves=WAVES.length;
  }

  /* [F9] difficulty setup */
  _setupDifficulty(){
    this.diffMul=DIFFICULTY[this.difficulty];
    this.credits=this.diffMul.credits;
  }

  _cacheUI(){
    const $=id=>document.getElementById(id);
    this.ui={
      wave:$('hud-wave'), enemies:$('hud-enemies'), credits:$('hud-credits'),
      hp:$('hud-hp'), score:$('hud-score'), announce:$('wave-announce'),
      towerInfo:$('tower-info'), towerInfoName:$('tower-info-name'), towerInfoStats:$('tower-info-stats'),
      towerBtns:$('tower-buttons'),
      overOverlay:$('gameover-overlay'), vicOverlay:$('victory-overlay'),
      goWave:$('go-wave'), goKills:$('go-kills'), goScore:$('go-score'), goAch:$('go-ach'),
      vKills:$('v-kills'), vHp:$('v-hp'), vScore:$('v-score'), vAch:$('v-ach'),
      /* [F3] pause */
      pauseOverlay:$('pause-overlay'),
      /* [F4] speed */
      speed:$('hud-speed'),
      /* [F5] wave preview */
      wavePreview:$('wave-preview'),
      /* [F7] target mode */
      targetText:$('target-mode-text'),
      /* [F8] achievements */
      achPopup:$('achievement-popup'), achTitle:$('ach-title'), achDesc:$('ach-desc'),
    };
  }

  _buildTowerButtons(){
    const container=this.ui.towerBtns;
    container.innerHTML='';
    this.towerBtnEls=[];
    TOWER_DEFS.forEach((d,i)=>{
      const btn=document.createElement('div');
      btn.className='tower-btn';
      btn.dataset.idx=i;
      const colorHex='#'+d.color.toString(16).padStart(6,'0');
      btn.innerHTML=`<div class="tower-icon" style="background:${colorHex}22;border:1px solid ${colorHex}"><svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="${colorHex}"/></svg></div><div class="tower-meta"><span class="tower-name">${d.name}</span><span class="tower-cost">${d.cost} CR</span></div>`;
      btn.addEventListener('click',()=>this._selectTower(i));
      container.appendChild(btn);
      this.towerBtnEls.push(btn);
    });
  }

  _makeHighlight(){
    const m=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.55,0.5,6),new THREE.MeshBasicMaterial({color:0x00ff88,transparent:true,opacity:0,blending:THREE.AdditiveBlending}));
    m.position.y=0.05;
    return m;
  }

  _bindEvents(){
    const cvs=this.gs.canvas;
    cvs.addEventListener('mousemove',e=>this._onMouseMove(e));
    cvs.addEventListener('click',e=>this._onClick(e));
    cvs.addEventListener('contextmenu',e=>{e.preventDefault();this._cancelSelect();});
    window.addEventListener('keydown',e=>this._onKey(e));
    document.getElementById('btn-next-wave').addEventListener('click',()=>this._startWave());
    document.getElementById('btn-sell-mode').addEventListener('click',()=>this._toggleSell());
    document.getElementById('btn-restart').addEventListener('click',()=>this._restart());
    document.getElementById('btn-restart-v').addEventListener('click',()=>this._restart());
    document.getElementById('btn-menu').addEventListener('click',()=>this._toMenu());
    document.getElementById('btn-menu-v').addEventListener('click',()=>this._toMenu());
    document.getElementById('btn-submit-score').addEventListener('click',()=>this._submitScore('go-name'));
    document.getElementById('btn-submit-score-v').addEventListener('click',()=>this._submitScore('v-name'));
    /* [F3] pause buttons */
    document.getElementById('btn-resume').addEventListener('click',()=>this._togglePause());
    document.getElementById('btn-pause-menu').addEventListener('click',()=>{this._togglePause();this._toMenu();});
    /* [F9] difficulty buttons */
    document.querySelectorAll('.diff-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        document.querySelectorAll('.diff-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        this.difficulty=btn.dataset.diff;
        this.diffMul=DIFFICULTY[this.difficulty];
      });
    });
  }

  /* ---------- input handlers ---------- */
  _onMouseMove(e){
    this.mouse.x=(e.clientX/innerWidth)*2-1;
    this.mouse.y=-(e.clientY/innerHeight)*2+1;
  }

  _onClick(e){
    if(this.state!=='playing'||this.paused) return;
    /* sell mode */
    if(this.sellMode){
      if(this.hoveredPlatform&&this.hoveredPlatform.occupied){
        this._sellTower(this.hoveredPlatform);
      }
      return;
    }
    /* [F1] tower upgrade — click occupied platform with no tower selected */
    if(this.selectedTower===null){
      if(this.hoveredPlatform&&this.hoveredPlatform.occupied){
        this._upgradeTower(this.hoveredPlatform);
      }
      return;
    }
    /* place new tower */
    if(!this.hoveredPlatform||this.hoveredPlatform.occupied) return;
    const def=TOWER_DEFS[this.selectedTower];
    if(this.credits<def.cost) return;
    this.credits-=def.cost;
    try {
      const t=new Tower(def,this.hoveredPlatform.pos,this.gs.scene);
      this.towers.push(t);
      this.hoveredPlatform.occupied=true;
      this.hoveredPlatform.towerId=t;
      this.sound.play('place');
      /* [F8] achievements */
      this.towerTypesPlaced.add(def.id);
      this._checkAchievement('first_tower');
      if(this.towerTypesPlaced.size>=4) this._checkAchievement('all_types');
      console.log('Tower placed! Total towers:', this.towers.length);
    } catch(err) {
      console.error('Tower placement failed:', err.message, err.stack);
      this.credits+=def.cost; // refund
    }
    this._updateHUD();
  }

  _onKey(e){
    if(this.state==='playing'){
      if(e.key>='1'&&e.key<='4') this._selectTower(+e.key-1);
      if(e.key===' '||e.key==='Space'){e.preventDefault();this._startWave();}
      if(e.key==='s'||e.key==='S') this._toggleSell();
      if(e.key==='Escape') this._cancelSelect();
      if(e.key==='q'||e.key==='Q'){
        this.gs.cam.position.applyAxisAngle(new THREE.Vector3(0,1,0),0.15);
        this.gs.cam.lookAt(0,0,2);
      }
      if(e.key==='e'||e.key==='E'){
        this.gs.cam.position.applyAxisAngle(new THREE.Vector3(0,1,0),-0.15);
        this.gs.cam.lookAt(0,0,2);
      }
      /* [F3] pause — P key */
      if(e.key==='p'||e.key==='P') this._togglePause();
      /* [F4] speed control — +/- keys */
      if(e.key==='+'||e.key==='='){
        this.gameSpeed=Math.min(3,this.gameSpeed+1);
        this._updateSpeedDisplay();
      }
      if(e.key==='-'||e.key==='_'){
        this.gameSpeed=Math.max(1,this.gameSpeed-1);
        this._updateSpeedDisplay();
      }
      /* [F7] target mode — T key */
      if(e.key==='t'||e.key==='T'){
        this.targetModeIdx=(this.targetModeIdx+1)%TARGET_MODES.length;
        this.targetMode=TARGET_MODES[this.targetModeIdx];
        this.ui.targetText.textContent=this.targetMode;
      }
      /* [F10] auto-wave — A key */
      if(e.key==='a'||e.key==='A'){
        this.autoWave=!this.autoWave;
        this.autoWaveTimer=this.autoWaveCountdown;
        const ind=document.getElementById('auto-wave-indicator');
        if(this.autoWave){
          ind.classList.remove('hidden');
          document.getElementById('auto-timer').textContent=Math.ceil(this.autoWaveTimer);
        } else {
          ind.classList.add('hidden');
        }
      }
    }
    /* start screen shortcuts */
    if(this.state==='menu'){
      if(e.key==='Enter') document.getElementById('btn-start').click();
    }
  }

  /* [F3] pause toggle */
  _togglePause(){
    this.paused=!this.paused;
    if(this.paused){
      this.ui.pauseOverlay.classList.remove('hidden');
    } else {
      this.ui.pauseOverlay.classList.add('hidden');
    }
  }

  /* [F4] speed display */
  _updateSpeedDisplay(){
    if(this.ui.speed) this.ui.speed.textContent=this.gameSpeed+'x';
  }

  /* [F1] tower upgrade */
  _upgradeTower(plat){
    const t=plat.towerId;
    if(!t||t.level>=3) return;
    const cost=t.getUpgradeCost();
    if(this.credits<cost) return;
    this.credits-=cost;
    t.upgrade();
    this.sound.play('upgrade');
    /* [F8] achievement */
    if(t.level>=3) this._checkAchievement('upgrade_max');
    this._updateHUD();
  }

  _selectTower(i){
    if(i<0||i>=TOWER_DEFS.length) return;
    this.sellMode=false;
    document.getElementById('btn-sell-mode').classList.remove('active-sell');
    this.selectedTower=this.selectedTower===i?null:i;
    this.towerBtnEls.forEach((b,j)=>{
      b.classList.toggle('selected',j===this.selectedTower);
    });
    if(this.selectedTower!==null){
      const d=TOWER_DEFS[this.selectedTower];
      this.ui.towerInfo.classList.remove('hidden');
      this.ui.towerInfoName.textContent=d.name;
      this.ui.towerInfoStats.innerHTML=`伤害: ${d.dmg}<br>射程: ${d.range}<br>射速: ${(1/d.rate).toFixed(1)}/s<br>${d.desc}`;
    } else {
      this.ui.towerInfo.classList.add('hidden');
    }
  }
  _cancelSelect(){
    this.selectedTower=null; this.sellMode=false;
    document.getElementById('btn-sell-mode').classList.remove('active-sell');
    this.towerBtnEls.forEach(b=>b.classList.remove('selected'));
    this.ui.towerInfo.classList.add('hidden');
  }
  _toggleSell(){
    this.sellMode=!this.sellMode;
    this.selectedTower=null;
    this.towerBtnEls.forEach(b=>b.classList.remove('selected'));
    this.ui.towerInfo.classList.add('hidden');
    document.getElementById('btn-sell-mode').classList.toggle('active-sell',this.sellMode);
  }
  _sellTower(plat){
    const t=plat.towerId;
    if(!t) return;
    const idx=this.towers.indexOf(t);
    if(idx>=0) this.towers.splice(idx,1);
    this.credits+=Math.floor(t.def.cost*0.6);
    t.destroy();
    plat.occupied=false; plat.towerId=null;
    this._updateHUD();
  }

  /* [F8] achievement system */
  _checkAchievement(id){
    if(this.achievements.has(id)) return;
    this.achievements.add(id);
    const def=ACHIEVEMENT_DEFS.find(a=>a.id===id);
    if(!def) return;
    this.sound.play('achieve');
    /* show popup */
    this.ui.achTitle.textContent=def.name;
    this.ui.achDesc.textContent=def.desc;
    this.ui.achPopup.classList.remove('hidden');
    /* reset animation */
    this.ui.achPopup.style.animation='none';
    this.ui.achPopup.offsetHeight; // reflow
    this.ui.achPopup.style.animation='';
    clearTimeout(this._achTimeout);
    this._achTimeout=setTimeout(()=>{
      this.ui.achPopup.classList.add('hidden');
    },3000);
  }

  /* [F5] wave preview */
  _updateWavePreview(){
    if(!this.ui.wavePreview) return;
    const nextIdx=this.currentWave; // 0-based, currentWave is last completed
    if(nextIdx>=this.totalWaves||this.waveActive){
      this.ui.wavePreview.classList.add('hidden');
      return;
    }
    const waveDef=WAVES[nextIdx];
    let html='<span style="color:var(--red)">WAVE '+(nextIdx+1)+' 预告:</span> ';
    const parts=[];
    for(const grp of waveDef){
      const ed=ENEMY_DEFS[grp.t];
      parts.push(`<span class="preview-type">${ed.name}</span>×<span class="preview-count">${grp.n}</span>`);
    }
    html+=parts.join('  ');
    this.ui.wavePreview.innerHTML=html;
    this.ui.wavePreview.classList.remove('hidden');
  }

  /* ---------- wave system ---------- */
  _startWave(){
    if(this.waveActive||this.state!=='playing'||this.paused) return;
    if(this.currentWave>=this.totalWaves) return;
    this.currentWave++;
    const waveDef=WAVES[this.currentWave-1];
    this.spawnQueue=[];
    for(const grp of waveDef){
      for(let i=0;i<grp.n;i++){
        this.spawnQueue.push({type:grp.t, delay:grp.iv});
      }
    }
    /* shuffle slightly for variety */
    for(let i=this.spawnQueue.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      if(Math.random()<0.3)[this.spawnQueue[i],this.spawnQueue[j]]=[this.spawnQueue[j],this.spawnQueue[i]];
    }
    this.spawnTimer=0.5;
    this.waveActive=true;
    this._waveDmgTaken=false; // reset for no_damage achievement
    /* [F10] disable auto-wave countdown during wave */
    this.autoWaveTimer=0;
    /* announce */
    this.ui.announce.textContent=`⚠ WAVE ${this.currentWave} INCOMING`;
    this.ui.announce.classList.remove('hidden');
    setTimeout(()=>this.ui.announce.classList.add('hidden'),2500);
    this.sound.play('waveStart');
    /* hide preview */
    if(this.ui.wavePreview) this.ui.wavePreview.classList.add('hidden');
    /* reset camera */
    this.gs.cam.position.set(0,38,26);
    this.gs.cam.lookAt(0,0,2);
    this._updateHUD();
  }

  _spawnEnemy(type){
    const e=new Enemy(type,this.gs.path.curve,this.gs.scene,this.diffMul);
    this.enemies.push(e);
  }

  /* ---------- HUD ---------- */
  _updateHUD(){
    this.ui.wave.textContent=`${this.currentWave}/${this.totalWaves}`;
    this.ui.enemies.textContent=this.enemies.filter(e=>!e.dead&&!e.reached).length+this.spawnQueue.length;
    this.ui.credits.textContent=this.credits;
    this.ui.hp.textContent=this.coreHp;
    this.ui.score.textContent=this.score;
    /* [F4] speed */
    if(this.ui.speed) this.ui.speed.textContent=this.gameSpeed+'x';
    /* [F7] target mode */
    if(this.ui.targetText) this.ui.targetText.textContent=this.targetMode;
    /* update tower button affordability */
    this.towerBtnEls.forEach((b,i)=>{
      b.classList.toggle('disabled',this.credits<TOWER_DEFS[i].cost);
    });
  }

  /* ---------- game state transitions ---------- */
  startGame(){
    this.state='playing';
    this.reset();
    /* [F9] apply difficulty */
    this._setupDifficulty();
    this._clearEntities();
    /* reset platforms */
    for(const p of this.gs.platforms){
      p.occupied=false; p.towerId=null;
    }
    /* reset new feature states */
    this.paused=false;
    this.gameSpeed=1;
    this.targetMode='FIRST'; this.targetModeIdx=0;
    this.achievements=new Set();
    this.totalCreditsEarned=0;
    this.towerTypesPlaced=new Set();
    this.autoWave=false; this.autoWaveTimer=0;
    this._waveDmgTaken=false;
    if(this.ui.pauseOverlay) this.ui.pauseOverlay.classList.add('hidden');
    if(this.ui.achPopup) this.ui.achPopup.classList.add('hidden');
    const autoInd=document.getElementById('auto-wave-indicator');
    if(autoInd) autoInd.classList.add('hidden');

    this.gs.show();
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('gameover-overlay').classList.add('hidden');
    document.getElementById('victory-overlay').classList.add('hidden');
    this._updateHUD();
    this._updateWavePreview();
  }

  _gameOver(){
    this.state='over';
    this.sound.play('gameOver');
    this.ui.goWave.textContent=this.currentWave;
    this.ui.goKills.textContent=this.kills;
    this.ui.goScore.textContent=this.score;
    if(this.ui.goAch) this.ui.goAch.textContent=this.achievements.size;
    document.getElementById('gameover-overlay').classList.remove('hidden');
  }
  _victory(){
    this.state='victory';
    this.score+=this.coreHp*10;
    this.sound.play('victory');
    this._checkAchievement('wave_10');
    this.ui.vKills.textContent=this.kills;
    this.ui.vHp.textContent=this.coreHp;
    this.ui.vScore.textContent=this.score;
    if(this.ui.vAch) this.ui.vAch.textContent=this.achievements.size;
    document.getElementById('victory-overlay').classList.remove('hidden');
  }
  _restart(){
    document.getElementById('gameover-overlay').classList.add('hidden');
    document.getElementById('victory-overlay').classList.add('hidden');
    this.startGame();
  }
  _toMenu(){
    this.state='menu';
    this.paused=false;
    this._clearEntities();
    this.gs.hide();
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('start-screen').classList.add('active');
    document.getElementById('gameover-overlay').classList.add('hidden');
    document.getElementById('victory-overlay').classList.add('hidden');
    if(this.ui.pauseOverlay) this.ui.pauseOverlay.classList.add('hidden');
  }
  _clearEntities(){
    for(const t of this.towers) t.destroy();
    for(const e of this.enemies) e.destroy();
    for(const p of this.projectiles) p.destroy();
    for(const f of this.effects) f.destroy();
    this.towers=[]; this.enemies=[]; this.projectiles=[]; this.effects=[];
    this.spawnQueue=[]; this.waveActive=false;
    this._cancelSelect();
  }

  async _submitScore(inputId){
    const name=document.getElementById(inputId).value.trim()||'Unknown';
    try{
      const res=await fetch('/api/scores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,score:this.score,wave:this.currentWave})});
      if(res.ok) alert('分数已提交！');
    }catch(e){console.warn('submit failed',e);}
  }

  /* ---------- main update ---------- */
  update(rawDt){
    /* [F3] pause check */
    if(this.paused) return;

    /* [F4] apply speed multiplier */
    const dt=rawDt*this.gameSpeed;

    /* [F10] auto-wave countdown */
    if(this.autoWave&&!this.waveActive&&this.state==='playing'){
      this.autoWaveTimer-=rawDt; // real time, not game speed
      const timerEl=document.getElementById('auto-timer');
      if(timerEl) timerEl.textContent=Math.max(0,Math.ceil(this.autoWaveTimer));
      if(this.autoWaveTimer<=0){
        this._startWave();
      }
    }

    /* spawning */
    if(this.spawnQueue.length>0){
      this.spawnTimer-=dt;
      if(this.spawnTimer<=0){
        const s=this.spawnQueue.shift();
        this._spawnEnemy(s.type);
        this.spawnTimer=s.delay;
      }
    }
    /* reset speed multipliers */
    for(const e of this.enemies) e.speedMul=1;
    /* update towers (pass [F7] target mode and [F2] sound) */
    for(const t of this.towers) t.update(dt,this.enemies,this.projectiles,this.targetMode,this.sound);
    /* update enemies */
    for(const e of this.enemies) e.update(dt);
    /* update projectiles */
    for(const p of this.projectiles) p.update(dt);
    /* update effects */
    for(const f of this.effects){
      if(f instanceof NovaExplosion) f.update(dt,this.enemies);
      else f.update(dt);
    }
    /* process dead/reached enemies */
    for(const e of this.enemies){
      if(e.dead&&!e._processed){
        e._processed=true;
        this.credits+=e.reward;
        this.totalCreditsEarned+=e.reward;
        this.score+=e.reward*2;
        this.kills++;
        this.sound.play('hit');
        this.effects.push(new Explosion(e.mesh.position.clone(),ENEMY_DEFS[e.type].color,this.gs.scene));
        /* [F8] kill achievements */
        if(this.kills===1) this._checkAchievement('first_blood');
        if(this.kills>=50) this._checkAchievement('kill_50');
        if(this.kills>=100) this._checkAchievement('kill_100');
        if(this.totalCreditsEarned>=1000) this._checkAchievement('rich');
      }
      if(e.reached&&!e._processed){
        e._processed=true;
        this.coreHp-=10;
        this._waveDmgTaken=true;
        if(this.coreHp<=0){this.coreHp=0; this._updateHUD(); this._gameOver(); return;}
      }
    }
    /* cleanup */
    this.enemies=this.enemies.filter(e=>{
      if((e.dead||e.reached)&&e._processed){e.destroy();return false;}
      return true;
    });
    this.projectiles=this.projectiles.filter(p=>{if(p.dead){p.destroy();return false;}return true;});
    this.effects=this.effects.filter(f=>{if(f.dead){f.destroy();return false;}return true;});
    /* wave complete check */
    if(this.waveActive&&this.spawnQueue.length===0&&this.enemies.length===0){
      this.waveActive=false;
      /* [F8] wave achievements */
      if(!this._waveDmgTaken) this._checkAchievement('no_damage');
      if(this.currentWave>=5) this._checkAchievement('wave_5');
      if(this.currentWave>=this.totalWaves){
        this._victory();
      } else {
        /* bonus credits between waves */
        const bonus=20+this.currentWave*5;
        this.credits+=bonus;
        this.totalCreditsEarned+=bonus;
        /* [F10] reset auto-wave timer */
        if(this.autoWave) this.autoWaveTimer=this.autoWaveCountdown;
        /* [F5] show next wave preview */
        this._updateWavePreview();
      }
    }
    /* raycasting for hover */
    this.ray.setFromCamera(this.mouse,this.gs.cam);
    const hits=this.ray.intersectObjects(this.gs.platforms.map(p=>p.mesh));
    this.hoveredPlatform=null;
    if(hits.length>0){
      const hitMesh=hits[0].object;
      const plat=this.gs.platforms.find(p=>p.mesh===hitMesh);
      if(plat){
        this.hoveredPlatform=plat;
        this.highlightMesh.position.set(plat.pos.x,0.05,plat.pos.z);
        if(this.sellMode){
          this.highlightMesh.material.color.setHex(plat.occupied?0xff3344:0x333333);
          this.highlightMesh.material.opacity=plat.occupied?0.25:0.05;
        } else if(this.selectedTower!==null){
          /* placing new tower */
          if(plat.occupied){
            /* [F1] show upgrade highlight */
            const tw=plat.towerId;
            if(tw&&tw.level<3){
              const cost=tw.getUpgradeCost();
              this.highlightMesh.material.color.setHex(this.credits>=cost?0x00ff88:0xff3344);
              this.highlightMesh.material.opacity=0.25;
            } else {
              this.highlightMesh.material.color.setHex(0xffaa00);
              this.highlightMesh.material.opacity=0.12;
            }
          } else {
            const canPlace=this.credits>=TOWER_DEFS[this.selectedTower].cost;
            this.highlightMesh.material.color.setHex(canPlace?0x00ff88:0xff3344);
            this.highlightMesh.material.opacity=0.2;
          }
        } else {
          /* no tower selected — show upgrade hint on occupied platforms */
          if(plat.occupied){
            const tw=plat.towerId;
            if(tw&&tw.level<3){
              this.highlightMesh.material.color.setHex(0x00ff88);
              this.highlightMesh.material.opacity=0.15;
            } else {
              this.highlightMesh.material.color.setHex(0xffaa00);
              this.highlightMesh.material.opacity=0.08;
            }
          } else {
            this.highlightMesh.material.opacity=0;
          }
        }
      }
    } else {
      this.highlightMesh.material.opacity=0;
    }

    /* [F1] update tower info panel for hovered occupied platform */
    if(this.hoveredPlatform&&this.hoveredPlatform.occupied&&this.selectedTower===null&&!this.sellMode){
      const tw=this.hoveredPlatform.towerId;
      if(tw){
        this.ui.towerInfo.classList.remove('hidden');
        this.ui.towerInfoName.textContent=tw.def.name+' Lv.'+tw.level;
        let stats=`伤害: ${tw.getDamage()}<br>射程: ${tw.getRange().toFixed(1)}<br>射速: ${(1/tw.def.rate).toFixed(1)}/s`;
        if(tw.level<3){
          stats+=`<br><span style="color:var(--green)">升级费用: ${tw.getUpgradeCost()} CR</span>`;
        } else {
          stats+=`<br><span style="color:var(--gold)">★ 已满级 MAX</span>`;
        }
        this.ui.towerInfoStats.innerHTML=stats;
      }
    } else if(this.selectedTower===null&&!this.sellMode){
      this.ui.towerInfo.classList.add('hidden');
    }

    this._updateHUD();
  }
}

/* =========================================================
   APP BOOTSTRAP
   ========================================================= */
(function boot(){
  const bgCanvas=document.getElementById('bg-canvas');
  const bgScene=new BackgroundScene(bgCanvas);
  const gameScene=new GameScene();
  const game=new Game(bgScene,gameScene);
  window.__game=game; // debug reference

  /* start screen buttons */
  document.getElementById('btn-start').addEventListener('click',()=>game.startGame());
  document.getElementById('btn-scores').addEventListener('click',async()=>{
    const panel=document.getElementById('scores-panel');
    const list=document.getElementById('scores-list');
    try{
      const res=await fetch('/api/scores');
      const scores=await res.json();
      if(!scores.length){list.innerHTML='<div style="color:#556;text-align:center;padding:20px">暂无记录</div>';}
      else{
        list.innerHTML=scores.map((s,i)=>`<div class="score-entry"><span class="score-rank">#${i+1}</span><span class="score-name">${s.name}</span><span class="score-val">${s.score}</span><span class="score-wave">W${s.wave}</span></div>`).join('');
      }
    }catch(e){list.innerHTML='<div style="color:#844">加载失败</div>';}
    panel.classList.remove('hidden');
  });
  document.getElementById('btn-help').addEventListener('click',()=>document.getElementById('help-panel').classList.remove('hidden'));

  /* main loop */
  let last=0;
  function loop(now){
    requestAnimationFrame(loop);
    const rawDt=Math.min((now-last)/1000,0.05);
    last=now;
    /* always render background */
    bgScene.render();
    /* game update + render */
    if(game.state==='playing'){
      game.update(rawDt);
      gameScene.render();
    }
  }
  requestAnimationFrame(loop);
})();
