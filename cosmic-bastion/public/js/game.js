// =============================================
// COSMIC BASTION - Game Controller
// State machine, waves, UI, achievements
// =============================================
import * as THREE from 'three';
import { TOWER_DEFS, ENEMY_DEFS, WAVES, DIFFICULTY, TARGET_MODES, ACHIEVEMENT_DEFS, WAVE_STORIES, getWaveTheme } from './constants.js';
import { SoundSystem } from './sound.js';
import { Tower } from './tower.js';
import { Enemy } from './enemy.js';
import { NovaExplosion, Explosion, Debris, MuzzleFlash, FloatingNumber } from './projectiles.js';

/* ---- Tower Preview Renderer (3D preview on button hover) ---- */
class TowerPreview {
  constructor(){
    this.renderer=null; this.scene=null; this.cam=null;
    this.canvas=null; this.model=null; this.animId=null;
    this._active=false;
  }
  _ensureRenderer(){
    if(this.renderer) return;
    this.canvas=document.createElement('canvas');
    this.canvas.width=140; this.canvas.height=140;
    this.canvas.className='tower-preview-canvas hidden';
    this.canvas.style.cssText='position:fixed;z-index:100;pointer-events:none;border:1px solid rgba(0,240,255,0.3);background:rgba(3,3,8,0.95);';
    document.body.appendChild(this.canvas);
    this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,antialias:true,alpha:true});
    this.renderer.setSize(140,140);
    this.renderer.setClearColor(0x030308,0.95);
    this.scene=new THREE.Scene();
    this.scene.add(new THREE.AmbientLight(0x334466,0.8));
    const dl=new THREE.DirectionalLight(0xffeedd,0.7);
    dl.position.set(2,4,3); this.scene.add(dl);
    this.cam=new THREE.PerspectiveCamera(40,1,0.1,50);
    this.cam.position.set(2.5,2.5,2.5); this.cam.lookAt(0,0.8,0);
  }
  show(btn,def){
    this._ensureRenderer();
    if(this.model){
      this.scene.remove(this.model);
      this.model.traverse(c=>{if(c.geometry)c.geometry.dispose();if(c.material){if(Array.isArray(c.material))c.material.forEach(m=>m.dispose());else c.material.dispose();}});
    }
    try{ const t=new Tower(def,new THREE.Vector3(0,0,0),this.scene); this.model=t.group; }
    catch(e){ console.warn('Tower preview build failed:',e); return; }
    this._active=true;
    const rect=btn.getBoundingClientRect();
    this.canvas.style.left=(rect.right+8)+'px';
    this.canvas.style.top=rect.top+'px';
    this.canvas.classList.remove('hidden');
    if(!this.animId){ const self=this; (function animate(){ self.animId=requestAnimationFrame(animate); if(self.model)self.model.rotation.y+=0.025; self.renderer.render(self.scene,self.cam); })(); }
  }
  hide(){
    this._active=false;
    if(this.canvas) this.canvas.classList.add('hidden');
    if(this.animId){cancelAnimationFrame(this.animId);this.animId=null;}
    if(this.model){
      this.scene.remove(this.model);
      this.model.traverse(c=>{if(c.geometry)c.geometry.dispose();if(c.material){if(Array.isArray(c.material))c.material.forEach(m=>m.dispose());else c.material.dispose();}});
      this.model=null;
    }
  }
}

export class Game {
  constructor(bgScene, gameScene){
    this.bg=bgScene; this.gs=gameScene; this.state='menu'; this.reset();
    this.towers=[]; this.enemies=[]; this.projectiles=[]; this.effects=[];
    this.selectedTower=null; this.sellMode=false;
    this.ray=new THREE.Raycaster(); this.mouse=new THREE.Vector2();
    this.hoveredPlatform=null; this.highlightMesh=this._makeHighlight();
    this.gs.scene.add(this.highlightMesh);
    this.spawnQueue=[]; this.spawnTimer=0; this.waveActive=false;
    this.sound=new SoundSystem(); this.paused=false; this.gameSpeed=1;
    this.targetMode='FIRST'; this.targetModeIdx=0;
    this.achievements=new Set(); this.totalCreditsEarned=0;
    this.towerTypesPlaced=new Set();
    this.difficulty='normal'; this.diffMul=DIFFICULTY.normal;
    this.autoWave=false; this.autoWaveTimer=0; this.autoWaveCountdown=5;
    this._waveDmgTaken=false; this._startFromLevel=1;
    this._contextTower=null;
    /* Combo system */
    this._comboCount=0; this._comboTimer=0; this._comboMaxTime=1.5;
    /* Camera drag */
    this._dragging=false; this._dragX=0; this._dragY=0;
    /* Follow mode */
    this._followMode=false;
    this._persistentAchievements=new Set(); this._unlockedLevels=[1,2,3];
    this._loadPersistentData();
    this._cacheUI(); this._buildTowerButtons();
    this._towerPreview=new TowerPreview();
    this._bindEvents(); this._updateWavePreview();
  }
  reset(){this.credits=200;this.coreHp=100;this.maxHp=100;this.score=0;this.kills=0;this.currentWave=0;this.totalWaves=WAVES.length;}
  _setupDifficulty(){this.diffMul=DIFFICULTY[this.difficulty];this.credits=this.diffMul.credits;}
  _loadPersistentData(){try{const ach=localStorage.getItem('cosmic_achievements');if(ach)this._persistentAchievements=new Set(JSON.parse(ach));else this._persistentAchievements=new Set();}catch(e){this._persistentAchievements=new Set();}try{const lv=localStorage.getItem('cosmic_unlocked_levels');this._unlockedLevels=lv?JSON.parse(lv):[1,2,3];}catch(e){this._unlockedLevels=[1,2,3];}}
  _savePersistentData(){try{this.achievements.forEach(a=>this._persistentAchievements.add(a));localStorage.setItem('cosmic_achievements',JSON.stringify([...this._persistentAchievements]));}catch(e){}try{const mc=this.currentWave;if(!this._unlockedLevels.includes(mc+1)&&mc+1<=WAVES.length){this._unlockedLevels.push(mc+1);}localStorage.setItem('cosmic_unlocked_levels',JSON.stringify(this._unlockedLevels));}catch(e){}}
  _renderAchievementsPanel(){const list=document.getElementById('achievements-list');if(!list)return;const allAch=this._persistentAchievements||new Set();this.achievements.forEach(a=>allAch.add(a));list.innerHTML=ACHIEVEMENT_DEFS.map(a=>{const u=allAch.has(a.id);return`<div class="achievement-item ${u?'unlocked':''}"><div class="ach-icon">${u?a.icon:'?'}</div><div class="ach-info"><div class="ach-name">${u?a.name:'???'}</div><div class="ach-desc">${a.desc}</div></div><div class="ach-status">${u?'UNLOCKED':'LOCKED'}</div></div>`;}).join('');}
  _renderLevels(){const grid=document.getElementById('levels-grid');if(!grid)return;const unlocked=this._unlockedLevels||[1,2,3];grid.innerHTML=WAVES.map((wave,i)=>{const wn=i+1;const iu=unlocked.includes(wn);const ic=unlocked.includes(wn+1);let ei='';for(const grp of wave){const ed=ENEMY_DEFS[grp.t];ei+=`${ed.name}\u00d7${grp.n} `;}return`<div class="level-card ${iu?'':'locked'} ${ic?'cleared':''}" data-wave="${wn}"><div class="level-num">WAVE ${wn}</div><div class="level-enemies">${iu?ei:'???'}</div></div>`;}).join('');grid.querySelectorAll('.level-card:not(.locked)').forEach(card=>{card.addEventListener('click',()=>{this._startFromLevel=parseInt(card.dataset.wave);this.startGame();});});}
  _showTowerMenu(tower){this._hideTowerMenu();this._contextTower=tower;const v=tower.group.position.clone();v.project(this.gs.cam);const x=(v.x*0.5+0.5)*innerWidth;const y=(-v.y*0.5+0.5)*innerHeight;const menu=document.getElementById('tower-context-menu');const mx=x<innerWidth-250?x+60:x-250;const my=Math.max(10,Math.min(y-80,innerHeight-300));menu.style.left=mx+'px';menu.style.top=my+'px';document.getElementById('tcm-name').textContent=tower.def.name;document.getElementById('tcm-level').textContent='Lv.'+tower.level;const dm=tower.getDamage(),rn=tower.getRange().toFixed(1),rt=(1/tower.def.rate).toFixed(1);document.getElementById('tcm-stats').innerHTML=`\u4f24\u5bb3: ${dm} | \u5c04\u7a0b: ${rn} | \u5c04\u901f: ${rt}/s`;const ub=document.getElementById('tcm-upgrade'),ut=document.getElementById('tcm-upgrade-text');if(tower.level>=3){ub.disabled=true;ut.textContent='\u5df2\u6ee1\u7ea7 MAX';}else{const cost=tower.getUpgradeCost();ub.disabled=this.credits<cost;ut.textContent=`\u5347\u7ea7 (${cost} CR)`;}document.getElementById('tcm-sell-text').textContent=`\u51fa\u552e (+${Math.floor(tower.def.cost*0.6)} CR)`;const cm=tower.targetMode||this.targetMode;document.querySelectorAll('.tcm-target-btn').forEach(b=>{b.classList.toggle('active',b.dataset.mode===cm);});menu.classList.remove('hidden');}
  _hideTowerMenu(){document.getElementById('tower-context-menu').classList.add('hidden');this._contextTower=null;}
  _cacheUI(){const $=id=>document.getElementById(id);this.ui={wave:$('hud-wave'),enemies:$('hud-enemies'),credits:$('hud-credits'),hp:$('hud-hp'),score:$('hud-score'),announce:$('wave-announce'),towerInfo:$('tower-info'),towerInfoName:$('tower-info-name'),towerInfoStats:$('tower-info-stats'),towerBtns:$('tower-buttons'),overOverlay:$('gameover-overlay'),vicOverlay:$('victory-overlay'),goWave:$('go-wave'),goKills:$('go-kills'),goScore:$('go-score'),goAch:$('go-ach'),vKills:$('v-kills'),vHp:$('v-hp'),vScore:$('v-score'),vAch:$('v-ach'),pauseOverlay:$('pause-overlay'),speed:$('hud-speed'),wavePreview:$('wave-preview'),targetText:$('target-mode-text'),achPopup:$('achievement-popup'),achTitle:$('ach-title'),achDesc:$('ach-desc')};}
  _buildTowerButtons(){const c=this.ui.towerBtns;c.innerHTML='';this.towerBtnEls=[];TOWER_DEFS.forEach((d,i)=>{const b=document.createElement('div');b.className='tower-btn';b.dataset.idx=i;const ch='#'+d.color.toString(16).padStart(6,'0');b.innerHTML=`<span class="tower-hotkey">${i+1}</span><div class="tower-icon" style="background:${ch}22;border:1px solid ${ch}"><svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="${ch}"/></svg></div><div class="tower-meta"><span class="tower-name">${d.name}</span><span class="tower-cost">${d.cost} CR</span></div>`;b.addEventListener('click',()=>this._selectTower(i));b.addEventListener('mouseenter',()=>{if(this._towerPreview)this._towerPreview.show(b,TOWER_DEFS[i]);});b.addEventListener('mouseleave',()=>{if(this._towerPreview)this._towerPreview.hide();});c.appendChild(b);this.towerBtnEls.push(b);});}
  _makeHighlight(){const m=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.55,0.5,6),new THREE.MeshBasicMaterial({color:0x00ff88,transparent:true,opacity:0,blending:THREE.AdditiveBlending}));m.position.y=0.05;return m;}
  _bindEvents(){
    const cvs=this.gs.canvas;cvs.addEventListener('mousemove',e=>this._onMouseMove(e));cvs.addEventListener('click',e=>this._onClick(e));cvs.addEventListener('contextmenu',e=>{e.preventDefault();this._cancelSelect();});window.addEventListener('keydown',e=>this._onKey(e));
    /* Camera: scroll zoom */
    cvs.addEventListener('wheel',e=>{e.preventDefault();this.gs.zoom(e.deltaY>0?1:-1);},{passive:false});
    /* Camera: right-click drag pan */
    cvs.addEventListener('mousedown',e=>{if(e.button===2){this._dragging=true;this._dragX=e.clientX;this._dragY=e.clientY;}});
    window.addEventListener('mouseup',e=>{if(e.button===2) this._dragging=false;});
    cvs.addEventListener('mousemove',e=>{if(this._dragging){this.gs.pan(e.clientX-this._dragX,e.clientY-this._dragY);this._dragX=e.clientX;this._dragY=e.clientY;}});
    const bindBtn=(id,fn)=>{const el=document.getElementById(id);if(el)el.addEventListener('click',e=>{e.stopPropagation();fn();});};
    bindBtn('btn-next-wave',()=>this._startWave());bindBtn('btn-sell-mode',()=>this._toggleSell());bindBtn('btn-restart',()=>this._restart());bindBtn('btn-restart-v',()=>this._restart());bindBtn('btn-menu',()=>this._toMenu());bindBtn('btn-menu-v',()=>this._toMenu());bindBtn('btn-submit-score',()=>this._submitScore('go-name'));bindBtn('btn-submit-score-v',()=>this._submitScore('v-name'));bindBtn('btn-resume',()=>this._togglePause());bindBtn('btn-pause-menu',()=>{this._togglePause();this._toMenu();});
    ['gameover-overlay','victory-overlay','pause-overlay'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('click',e=>e.stopPropagation());});
    document.querySelectorAll('.diff-btn').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('.diff-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');this.difficulty=btn.dataset.diff;this.diffMul=DIFFICULTY[this.difficulty];});});
    bindBtn('tcm-upgrade',()=>{if(this._contextTower){const cost=this._contextTower.getUpgradeCost();if(this.credits>=cost&&this._contextTower.level<3){this.credits-=cost;this._contextTower.upgrade();this.sound.play('upgrade');if(this._contextTower.level>=3)this._checkAchievement('upgrade_max');this._showTowerMenu(this._contextTower);this._updateHUD();}}});
    bindBtn('tcm-sell',()=>{if(this._contextTower){const plat=this.gs.platforms.find(p=>p.towerId===this._contextTower);if(plat)this._sellTower(plat);this._hideTowerMenu();}});
    document.querySelectorAll('.tcm-target-btn').forEach(btn=>{btn.addEventListener('click',(e)=>{e.stopPropagation();if(this._contextTower){this._contextTower.targetMode=btn.dataset.mode;document.querySelectorAll('.tcm-target-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}});});
    document.addEventListener('click',(e)=>{const menu=document.getElementById('tower-context-menu');if(!menu.classList.contains('hidden')&&!menu.contains(e.target)){this._hideTowerMenu();}});
  }
  _onClick(e){e.stopPropagation();if(this.state!=='playing'||this.paused)return;
    if(this.sellMode){if(this.hoveredPlatform&&this.hoveredPlatform.occupied){this._sellTower(this.hoveredPlatform);}return;}
    if(this.selectedTower===null){if(this.hoveredPlatform&&this.hoveredPlatform.occupied){this._showTowerMenu(this.hoveredPlatform.towerId);}else{this._hideTowerMenu();}return;}
    if(!this.hoveredPlatform||this.hoveredPlatform.occupied)return;
    const def=TOWER_DEFS[this.selectedTower];
    if(this.credits<def.cost) return;
    this.credits-=def.cost;
    try {
      const t=new Tower(def,this.hoveredPlatform.pos,this.gs.scene);
      this.towers.push(t);
      this.hoveredPlatform.occupied=true;
      this.hoveredPlatform.towerId=t;
      this.sound.play('place');
      this.towerTypesPlaced.add(def.id);
      this._checkAchievement('first_tower');
      if(this.towerTypesPlaced.size>=TOWER_DEFS.length) this._checkAchievement('all_types');
      this._hideTowerMenu();
    } catch(err) {
      console.error('Tower placement failed:', err.message);
      this.credits+=def.cost;
    }
    this._updateHUD();
  }
  _onMouseMove(e){
    this.mouse.x=(e.clientX/innerWidth)*2-1;
    this.mouse.y=-(e.clientY/innerHeight)*2+1;
  }
  _onKey(e){
    if(this.state==='playing'){
      if(e.key>='1'&&e.key<='9'&&+e.key-1<TOWER_DEFS.length) this._selectTower(+e.key-1);
      if(e.key===' '){e.preventDefault();this._startWave();}
      if(e.key==='s'||e.key==='S') this._toggleSell();
      if(e.key==='Escape'){this._cancelSelect();this._hideTowerMenu();}
      if(e.key==='q'||e.key==='Q'){this.gs.rotate(0.15);}
      if(e.key==='e'||e.key==='E'){this.gs.rotate(-0.15);}
      if(e.key==='p'||e.key==='P') this._togglePause();
      if(e.key==='+'||e.key==='='){this.gameSpeed=Math.min(3,this.gameSpeed+1);this._updateSpeedDisplay();}
      if(e.key==='-'||e.key==='_'){this.gameSpeed=Math.max(1,this.gameSpeed-1);this._updateSpeedDisplay();}
      if(e.key==='f'||e.key==='F'){
        this._followMode=!this._followMode;
        const ind=document.getElementById('follow-indicator');
        if(this._followMode&&this.projectiles.length>0){
          this.gs.follow(this.projectiles[this.projectiles.length-1]);
          if(ind){ind.classList.remove('hidden');}
        } else {
          this.gs.unfollow(); this._followMode=false;
          if(ind){ind.classList.add('hidden');}
        }
      }
      if(e.key==='t'||e.key==='T'){this.targetModeIdx=(this.targetModeIdx+1)%TARGET_MODES.length;this.targetMode=TARGET_MODES[this.targetModeIdx];this.ui.targetText.textContent=this.targetMode;}
      if(e.key==='a'||e.key==='A'){
        this.autoWave=!this.autoWave; this.autoWaveTimer=this.autoWaveCountdown;
        const ind=document.getElementById('auto-wave-indicator');
        if(this.autoWave){ind.classList.remove('hidden');document.getElementById('auto-timer').textContent=Math.ceil(this.autoWaveTimer);}
        else{ind.classList.add('hidden');}
      }
    }
    if(this.state==='menu'&&e.key==='Enter') document.getElementById('btn-start').click();
  }
  _selectTower(i){
    if(i<0||i>=TOWER_DEFS.length) return;
    this.sellMode=false; this._hideTowerMenu();
    document.getElementById('btn-sell-mode').classList.remove('active-sell');
    this.selectedTower=this.selectedTower===i?null:i;
    this.towerBtnEls.forEach((b,j)=>b.classList.toggle('selected',j===this.selectedTower));
    if(this.selectedTower!==null){
      const d=TOWER_DEFS[this.selectedTower];
      this.ui.towerInfo.classList.remove('hidden');
      this.ui.towerInfoName.textContent=d.name;
      this.ui.towerInfoStats.innerHTML=`\u4f24\u5bb3: ${d.dmg}<br>\u5c04\u7a0b: ${d.range}<br>\u5c04\u901f: ${(1/d.rate).toFixed(1)}/s<br>${d.desc}`;
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
    this.sellMode=!this.sellMode; this.selectedTower=null; this._hideTowerMenu();
    this.towerBtnEls.forEach(b=>b.classList.remove('selected'));
    this.ui.towerInfo.classList.add('hidden');
    document.getElementById('btn-sell-mode').classList.toggle('active-sell',this.sellMode);
  }
  _sellTower(plat){
    const t=plat.towerId; if(!t) return;
    const idx=this.towers.indexOf(t); if(idx>=0) this.towers.splice(idx,1);
    this.credits+=Math.floor(t.def.cost*0.6);
    t.destroy(); plat.occupied=false; plat.towerId=null;
    this._updateHUD();
  }
  _togglePause(){
    this.paused=!this.paused;
    if(this.paused) this.ui.pauseOverlay.classList.remove('hidden');
    else this.ui.pauseOverlay.classList.add('hidden');
  }
  _updateSpeedDisplay(){if(this.ui.speed) this.ui.speed.textContent=this.gameSpeed+'x';}
  _checkAchievement(id){
    if(this.achievements.has(id)) return;
    this.achievements.add(id);
    const def=ACHIEVEMENT_DEFS.find(a=>a.id===id); if(!def) return;
    this.sound.play('achieve');
    this.ui.achTitle.textContent=def.name;
    this.ui.achDesc.textContent=def.desc;
    this.ui.achPopup.classList.remove('hidden');
    this.ui.achPopup.style.animation='none'; this.ui.achPopup.offsetHeight; this.ui.achPopup.style.animation='';
    clearTimeout(this._achTimeout);
    this._achTimeout=setTimeout(()=>this.ui.achPopup.classList.add('hidden'),3000);
  }
  _updateWavePreview(){
    if(!this.ui.wavePreview) return;
    const ni=this.currentWave;
    if(ni>=this.totalWaves||this.waveActive){this.ui.wavePreview.classList.add('hidden');return;}
    const waveDef=WAVES[ni];
    let html='<span style="color:var(--red)">WAVE '+(ni+1)+' \u9884\u544a:</span> ';
    const parts=[];
    for(const grp of waveDef){const ed=ENEMY_DEFS[grp.t];parts.push(`<span class="preview-type">${ed.name}</span>\u00d7<span class="preview-count">${grp.n}</span>`);}
    html+=parts.join('  ');
    this.ui.wavePreview.innerHTML=html; this.ui.wavePreview.classList.remove('hidden');
  }
  _startWave(){
    if(this.waveActive||this.state!=='playing'||this.paused) return;
    if(this.currentWave>=this.totalWaves) return;
    this.currentWave++;
    this.gs.applyTheme(getWaveTheme(this.currentWave));
    const waveDef=WAVES[this.currentWave-1];
    this.spawnQueue=[];
    for(const grp of waveDef){for(let i=0;i<grp.n;i++) this.spawnQueue.push({type:grp.t,delay:grp.iv});}
    for(let i=this.spawnQueue.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));if(Math.random()<0.3)[this.spawnQueue[i],this.spawnQueue[j]]=[this.spawnQueue[j],this.spawnQueue[i]];}
    this.spawnTimer=0.5; this.waveActive=true; this._waveDmgTaken=false;
    this.autoWaveTimer=0;
    this.ui.announce.textContent=`\u26a0 WAVE ${this.currentWave} INCOMING`;
    this.ui.announce.classList.remove('hidden');
    setTimeout(()=>this.ui.announce.classList.add('hidden'),2500);
    this.sound.play('waveStart');
    /* Story narration */
    const storyEl=document.getElementById('story-narration');
    if(storyEl&&WAVE_STORIES[this.currentWave-1]){
      storyEl.textContent=WAVE_STORIES[this.currentWave-1];
      storyEl.classList.remove('hidden');
      setTimeout(()=>storyEl.classList.add('hidden'),5000);
    }
    if(this.ui.wavePreview) this.ui.wavePreview.classList.add('hidden');
    /* Cinematic camera: start wide/high, animate to gameplay position */
    this.gs.camDist=60; this.gs.camPolar=0.6;
    this.gs.animateTo(44,0.95,this.gs.camTarget,1.5);
    this._updateHUD();
  }
  _spawnEnemy(type){const e=new Enemy(type,this.gs.path.curve,this.gs.scene,this.diffMul);this.enemies.push(e);}
  _updateHUD(){
    this.ui.wave.textContent=`${this.currentWave}/${this.totalWaves}`;
    this.ui.enemies.textContent=this.enemies.filter(e=>!e.dead&&!e.reached).length+this.spawnQueue.length;
    this.ui.credits.textContent=this.credits; this.ui.hp.textContent=this.coreHp;
    this.ui.score.textContent=this.score;
    if(this.ui.speed) this.ui.speed.textContent=this.gameSpeed+'x';
    if(this.ui.targetText) this.ui.targetText.textContent=this.targetMode;
    this.towerBtnEls.forEach((b,i)=>b.classList.toggle('disabled',this.credits<TOWER_DEFS[i].cost));
  }
  startGame(){
    this.state='playing'; this.reset(); this._setupDifficulty();
    this.currentWave=Math.max(0,this._startFromLevel-1);
    this._clearEntities();
    for(const p of this.gs.platforms){p.occupied=false;p.towerId=null;}
    this.paused=false; this.gameSpeed=1;
    this.targetMode='FIRST'; this.targetModeIdx=0;
    this.achievements=new Set(); this.totalCreditsEarned=0;
    this.towerTypesPlaced=new Set();
    this.autoWave=false; this.autoWaveTimer=0; this._waveDmgTaken=false;
    this._contextTower=null;
    if(this.ui.pauseOverlay) this.ui.pauseOverlay.classList.add('hidden');
    if(this.ui.achPopup) this.ui.achPopup.classList.add('hidden');
    this._hideTowerMenu();
    if(this._towerPreview) this._towerPreview.hide();
    const autoInd=document.getElementById('auto-wave-indicator');
    if(autoInd) autoInd.classList.add('hidden');
    this.gs.show();
    this.gs.applyTheme(getWaveTheme(Math.max(1,this._startFromLevel)));
    document.getElementById('start-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    document.getElementById('gameover-overlay').classList.add('hidden');
    document.getElementById('victory-overlay').classList.add('hidden');
    this._updateHUD(); this._updateWavePreview();
  }
  _gameOver(){
    this.state='over'; this.sound.play('gameOver'); this._savePersistentData();
    this.ui.goWave.textContent=this.currentWave; this.ui.goKills.textContent=this.kills;
    this.ui.goScore.textContent=this.score;
    if(this.ui.goAch) this.ui.goAch.textContent=this.achievements.size;
    document.getElementById('gameover-overlay').classList.remove('hidden');
  }
  _victory(){
    this.state='victory'; this.score+=this.coreHp*10;
    this.sound.play('victory'); this._checkAchievement('wave_10');
    this._savePersistentData();
    this.ui.vKills.textContent=this.kills; this.ui.vHp.textContent=this.coreHp;
    this.ui.vScore.textContent=this.score;
    if(this.ui.vAch) this.ui.vAch.textContent=this.achievements.size;
    document.getElementById('victory-overlay').classList.remove('hidden');
  }
  _restart(){
    document.getElementById('gameover-overlay').classList.add('hidden');
    document.getElementById('victory-overlay').classList.add('hidden');
    this._startFromLevel=1; this.startGame();
  }
  _toMenu(){
    this.state='menu'; this.paused=false; this._clearEntities();
    this.gs.hide(); this._hideTowerMenu();
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
    this.spawnQueue=[]; this.waveActive=false; this._cancelSelect();
    this._comboCount=0; this._comboTimer=0;
    clearTimeout(this._comboTimeout);
    const cd=document.getElementById('combo-display'); if(cd) cd.classList.add('hidden');
  }
  async _submitScore(inputId){
    const name=document.getElementById(inputId).value.trim()||'Unknown';
    try{
      const res=await fetch('/api/scores',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,score:this.score,wave:this.currentWave})});
      if(res.ok) alert('\u5206\u6570\u5df2\u63d0\u4ea4\uff01');
    }catch(e){console.warn('submit failed',e);}
  }
  /* ---------- main update loop ---------- */
  update(rawDt){
    if(this.paused) return;
    const dt=rawDt*this.gameSpeed;
    /* Auto-wave countdown */
    if(this.autoWave&&!this.waveActive&&this.state==='playing'){
      this.autoWaveTimer-=rawDt;
      const timerEl=document.getElementById('auto-timer');
      if(timerEl) timerEl.textContent=Math.max(0,Math.ceil(this.autoWaveTimer));
      if(this.autoWaveTimer<=0) this._startWave();
    }
    /* Spawning */
    if(this.spawnQueue.length>0){
      this.spawnTimer-=dt;
      if(this.spawnTimer<=0){const s=this.spawnQueue.shift();this._spawnEnemy(s.type);this.spawnTimer=s.delay;}
    }
    for(const e of this.enemies) e.speedMul=1;
    for(const t of this.towers) t.update(dt,this.enemies,this.projectiles,this.targetMode,this.sound,this.effects);
    for(const e of this.enemies) e.update(dt);
    for(const p of this.projectiles) p.update(dt);
    /* Collect damage numbers from enemies hit this frame */
    for(const e of this.enemies){
      if(e._frameDmg>0){
        this.effects.push(new FloatingNumber(e.mesh.position.clone(),e._frameDmg,'#ffaa00',this.gs.cam));
        e._frameDmg=0;
      }
    }
    for(const f of this.effects){if(f instanceof NovaExplosion) f.update(dt,this.enemies);else f.update(dt);}
    /* Process dead/reached */
    for(const e of this.enemies){
      if(e.dead&&!e._processed){
        e._processed=true; this.credits+=e.reward; this.totalCreditsEarned+=e.reward;
        this.score+=e.reward*2; this.kills++; this.sound.play('hit');
        this.effects.push(new Explosion(e.mesh.position.clone(),ENEMY_DEFS[e.type].color,this.gs.scene));
        this.effects.push(new Debris(e.mesh.position.clone(),ENEMY_DEFS[e.type].color,this.gs.scene));
        /* Combo kill system */
        this._comboCount++;
        this._comboTimer=this._comboMaxTime;
        if(this._comboCount>=3){
          const mul=1+Math.min(this._comboCount-3,7)*0.2;
          const bonus=Math.round(e.reward*2*mul);
          this.score+=bonus;
          const cd=document.getElementById('combo-display');
          const cc=document.getElementById('combo-count');
          if(cd&&cc){
            cd.classList.remove('hidden');
            cc.textContent=this._comboCount+'x';
            cd.style.animation='none'; cd.offsetHeight; cd.style.animation='';
          }
        }
        if(this.kills===1) this._checkAchievement('first_blood');
        if(this.kills>=50) this._checkAchievement('kill_50');
        if(this.kills>=100) this._checkAchievement('kill_100');
        if(this.totalCreditsEarned>=1000) this._checkAchievement('rich');
      }
      if(e.reached&&!e._processed){
        e._processed=true; this.coreHp-=10; this._waveDmgTaken=true;
        if(this.coreHp<=0){this.coreHp=0;this._updateHUD();this._gameOver();return;}
      }
    }
    this.enemies=this.enemies.filter(e=>{if((e.dead||e.reached)&&e._processed){e.destroy();return false;}return true;});
    this.projectiles=this.projectiles.filter(p=>{if(p.dead){p.destroy();return false;}return true;});
    this.effects=this.effects.filter(f=>{if(f.dead){f.destroy();return false;}return true;});
    /* Combo timer countdown */
    if(this._comboCount>0){
      this._comboTimer-=dt;
      if(this._comboTimer<=0){
        this._comboCount=0;
        const cd=document.getElementById('combo-display');
        if(cd) cd.classList.add('hidden');
      }
    }
    /* Follow mode sync: hide indicator if target was auto-cleared */
    if(this._followMode&&!this.gs._followTarget){
      this._followMode=false;
      const ind=document.getElementById('follow-indicator');
      if(ind) ind.classList.add('hidden');
    }
    /* Wave complete */
    if(this.waveActive&&this.spawnQueue.length===0&&this.enemies.length===0){
      this.waveActive=false; this._savePersistentData();
      if(!this._waveDmgTaken) this._checkAchievement('no_damage');
      if(this.currentWave>=5) this._checkAchievement('wave_5');
      if(this.currentWave>=this.totalWaves){this._victory();}
      else{
        const bonus=20+this.currentWave*5; this.credits+=bonus; this.totalCreditsEarned+=bonus;
        if(this.autoWave) this.autoWaveTimer=this.autoWaveCountdown;
        this._updateWavePreview();
      }
    }
    /* Raycasting */
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
          if(plat.occupied){
            const tw=plat.towerId;
            if(tw&&tw.level<3){this.highlightMesh.material.color.setHex(0x00ff88);this.highlightMesh.material.opacity=0.25;}
            else{this.highlightMesh.material.color.setHex(0xffaa00);this.highlightMesh.material.opacity=0.12;}
          } else {
            const canPlace=this.credits>=TOWER_DEFS[this.selectedTower].cost;
            this.highlightMesh.material.color.setHex(canPlace?0x00ff88:0xff3344);
            this.highlightMesh.material.opacity=0.2;
          }
        } else {
          if(plat.occupied){this.highlightMesh.material.color.setHex(0x00ff88);this.highlightMesh.material.opacity=0.15;}
          else{this.highlightMesh.material.opacity=0;}
        }
      }
    } else { this.highlightMesh.material.opacity=0; }
    /* Tower info on hover — hide when context menu is open */
    if(this._contextTower){
      this.ui.towerInfo.classList.add('hidden');
    } else if(this.hoveredPlatform&&this.hoveredPlatform.occupied&&this.selectedTower===null&&!this.sellMode){
      const tw=this.hoveredPlatform.towerId;
      if(tw){
        this.ui.towerInfo.classList.remove('hidden');
        this.ui.towerInfoName.textContent=tw.name||tw.def.name;
        let stats=`\u4f24\u5bb3: ${tw.getDamage()}<br>\u5c04\u7a0b: ${tw.getRange().toFixed(1)}<br>\u5c04\u901f: ${(1/tw.def.rate).toFixed(1)}/s`;
        if(tw.level<3) stats+=`<br><span style="color:var(--green)">\u70b9\u51fb\u5347\u7ea7 (${tw.getUpgradeCost()} CR)</span>`;
        else stats+=`<br><span style="color:var(--gold)">\u2605 \u5df2\u6ee1\u7ea7</span>`;
        this.ui.towerInfoStats.innerHTML=stats;
      }
    } else if(this.selectedTower===null&&!this.sellMode){
      this.ui.towerInfo.classList.add('hidden');
    }
    this._updateHUD();
  }
}
