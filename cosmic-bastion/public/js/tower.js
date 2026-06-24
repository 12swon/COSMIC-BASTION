// =============================================
// COSMIC BASTION - Tower System
// Enhanced 3D models + shooting + upgrades
// =============================================
import * as THREE from 'three';
import { Projectile, MuzzleFlash, GravityPulse } from './projectiles.js';

export class Tower {
  constructor(def, pos, scene){
    this.def=def; this.scene=scene;
    this.pos=pos.clone(); this.pos.y=0.3;
    this.cooldown=0; this.target=null;
    this.level=1; this.targetMode=null;
    this._animParts={};
    this.group=new THREE.Group();
    this.group.position.copy(this.pos);
    this._build(); this._buildRangeRing();
    scene.add(this.group);
  }
  _build(){
    const c=this.def.color;
    this._animParts={};
    const bm=new THREE.MeshStandardMaterial({color:0x1a1a30,emissive:c,emissiveIntensity:0.15,metalness:0.9,roughness:0.3});
    const base=new THREE.Mesh(new THREE.CylinderGeometry(0.65,0.85,0.55,8),bm);
    base.position.set(0,0.28,0); this.group.add(base);
    const bodyM=new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:0.3,metalness:0.8,roughness:0.2});
    switch(this.def.id){
      case 'laser': {
        const bL=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,1.8,8),bodyM);
        bL.position.set(-0.15,1.45,0); this.group.add(bL);
        const bR=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,1.8,8),bodyM);
        bR.position.set(0.15,1.45,0); this.group.add(bR);
        this._animParts.barrels=[bL,bR];
        const tL=new THREE.Mesh(new THREE.SphereGeometry(0.1,6,6),bodyM);
        tL.position.set(-0.15,2.35,0); this.group.add(tL);
        const tR=new THREE.Mesh(new THREE.SphereGeometry(0.1,6,6),bodyM);
        tR.position.set(0.15,2.35,0); this.group.add(tR);
        const core=new THREE.Mesh(new THREE.SphereGeometry(0.2,12,12),
          new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.65,blending:THREE.AdditiveBlending}));
        core.position.y=1.1; this.group.add(core); this._animParts.core=core;
        const dish=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.02,0.06,12),bodyM);
        dish.position.y=2.5; this.group.add(dish); this._animParts.dish=dish;
        break;
      }
      case 'plasma': {
        const cannon=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.2,1.5,6),bodyM);
        cannon.position.y=1.3; this.group.add(cannon);
        const cont=new THREE.Mesh(new THREE.SphereGeometry(0.32,16,16),
          new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.25,blending:THREE.AdditiveBlending,depthWrite:false}));
        cont.position.y=2.1; this.group.add(cont); this._animParts.containment=cont;
        this._animParts.coils=[];
        for(let i=0;i<3;i++){
          const coil=new THREE.Mesh(new THREE.TorusGeometry(0.3,0.04,8,16),
            new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:0.5,metalness:0.9,roughness:0.2}));
          coil.position.y=0.8+i*0.35; coil.rotation.x=Math.PI/2;
          this.group.add(coil); this._animParts.coils.push(coil);
        }
        break;
      }
      case 'gravity': {
        const r1=new THREE.Mesh(new THREE.TorusGeometry(0.55,0.1,12,24),
          new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:0.4,metalness:0.8,roughness:0.2}));
        r1.position.y=1.2; r1.rotation.x=Math.PI/2; this.group.add(r1); this._animParts.ring1=r1;
        const r2=new THREE.Mesh(new THREE.TorusGeometry(0.45,0.08,12,24),
          new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:0.4,metalness:0.8,roughness:0.2}));
        r2.position.y=1.2; r2.rotation.x=Math.PI/3; r2.rotation.z=Math.PI/4;
        this.group.add(r2); this._animParts.ring2=r2;
        const sing=new THREE.Mesh(new THREE.SphereGeometry(0.18,16,16),new THREE.MeshBasicMaterial({color:0x110022}));
        sing.position.y=1.2; this.group.add(sing); this._animParts.singularity=sing;
        const sg=new THREE.Mesh(new THREE.SphereGeometry(0.3,16,16),
          new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.4,blending:THREE.AdditiveBlending}));
        sg.position.y=1.2; this.group.add(sg); this._animParts.singGlow=sg;
        this._animParts.waveRings=[];
        for(let i=0;i<2;i++){
          const wr=new THREE.Mesh(new THREE.TorusGeometry(0.7+i*0.25,0.025,8,32),
            new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.18-i*0.06}));
          wr.position.y=1.2; wr.rotation.x=Math.PI/2;
          this.group.add(wr); this._animParts.waveRings.push(wr);
        }
        break;
      }
      case 'nova': {
        const big=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.38,2.2,8),bodyM);
        big.position.y=1.6; this.group.add(big);
        const coneMat=new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.65});
        this._animParts.crowns=[];
        for(let i=0;i<3;i++){
          const a=(i/3)*Math.PI*2;
          const cone=new THREE.Mesh(new THREE.ConeGeometry(0.2,0.55,8),coneMat);
          cone.position.set(Math.cos(a)*0.22,2.95,Math.sin(a)*0.22);
          this.group.add(cone); this._animParts.crowns.push(cone);
        }
        const acc=new THREE.Mesh(new THREE.SphereGeometry(0.18,12,12),
          new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.55,blending:THREE.AdditiveBlending}));
        acc.position.y=3.25; this.group.add(acc); this._animParts.accumulator=acc;
        break;
      }
      case 'frost': {
        const crystal=new THREE.Mesh(new THREE.ConeGeometry(0.3,1.6,6),bodyM);
        crystal.position.y=1.3; this.group.add(crystal);
        this._animParts.shards=[];
        for(let i=0;i<4;i++){
          const a=(i/4)*Math.PI*2;
          const shard=new THREE.Mesh(new THREE.ConeGeometry(0.08,0.5,4),bodyM);
          shard.position.set(Math.cos(a)*0.4,1.0,Math.sin(a)*0.4);
          shard.rotation.z=Math.PI/2; shard.rotation.y=-a;
          this.group.add(shard); this._animParts.shards.push(shard);
        }
        const aura=new THREE.Mesh(new THREE.SphereGeometry(0.35,12,12),
          new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.25,blending:THREE.AdditiveBlending,depthWrite:false}));
        aura.position.y=1.3; this.group.add(aura); this._animParts.aura=aura;
        break;
      }
      case 'arc': {
        const tower=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.3,2.0,8),bodyM);
        tower.position.y=1.4; this.group.add(tower);
        this._animParts.coils=[];
        for(let i=0;i<4;i++){
          const coil=new THREE.Mesh(new THREE.TorusGeometry(0.22,0.03,6,16),
            new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:0.6,metalness:0.9,roughness:0.2}));
          coil.position.y=0.8+i*0.4; coil.rotation.x=Math.PI/2;
          this.group.add(coil); this._animParts.coils.push(coil);
        }
        const top=new THREE.Mesh(new THREE.SphereGeometry(0.22,12,12),
          new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.7,blending:THREE.AdditiveBlending}));
        top.position.y=2.5; this.group.add(top); this._animParts.topOrb=top;
        break;
      }
    }
    const ring=new THREE.Mesh(new THREE.TorusGeometry(0.75,0.04,8,24),
      new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.35}));
    ring.position.y=0.55; ring.rotation.x=Math.PI/2; this.group.add(ring);
    this._animParts.accentRing=ring;
  }
  _buildRangeRing(){
    const r=this.getRange();
    const rr=new THREE.Mesh(new THREE.RingGeometry(r-0.08,r,48),
      new THREE.MeshBasicMaterial({color:this.def.color,transparent:true,opacity:0.12,side:THREE.DoubleSide}));
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
    /* Dispose old geometries and materials to prevent WebGL memory leak */
    this.group.traverse(child=>{
      if(child.geometry) child.geometry.dispose();
      if(child.material){
        if(Array.isArray(child.material)) child.material.forEach(m=>m.dispose());
        else child.material.dispose();
      }
    });
    while(this.group.children.length>0) this.group.remove(this.group.children[0]);
    this._animParts={};
    this._build(); this._buildRangeRing();
    for(let i=1;i<this.level;i++){
      const lr=new THREE.Mesh(new THREE.TorusGeometry(0.95+i*0.12,0.035,6,20),
        new THREE.MeshBasicMaterial({color:0x00ff88,transparent:true,opacity:0.55}));
      lr.position.y=0.08+i*0.06; lr.rotation.x=Math.PI/2; this.group.add(lr);
    }
    return true;
  }
  update(dt, enemies, projectiles, gameTargetMode, sound, effects){
    this.cooldown=Math.max(0,this.cooldown-dt);
    const t=performance.now()*0.001;
    const ap=this._animParts;
    switch(this.def.id){
      case 'laser':
        if(ap.barrels){ ap.barrels[0].rotation.y+=dt*2; ap.barrels[1].rotation.y+=dt*2; }
        if(ap.core) ap.core.scale.setScalar(1+Math.sin(t*4)*0.15);
        if(ap.dish) ap.dish.rotation.y+=dt*3;
        break;
      case 'plasma':
        if(ap.containment) ap.containment.scale.setScalar(1+Math.sin(t*3)*0.12);
        if(ap.coils) ap.coils.forEach((c,i)=>{ c.rotation.z=t*(1.5+i*0.5); });
        break;
      case 'gravity':
        if(ap.ring1) ap.ring1.rotation.z+=dt*1.5;
        if(ap.ring2) ap.ring2.rotation.z-=dt*2.0;
        if(ap.singGlow) ap.singGlow.scale.setScalar(1+Math.sin(t*3)*0.2);
        if(ap.waveRings) ap.waveRings.forEach((w,i)=>{
          w.scale.setScalar(1+Math.sin(t*2+i*Math.PI)*0.15);
          w.material.opacity=0.12+Math.sin(t*2+i*Math.PI)*0.06;
        });
        break;
      case 'nova':
        if(ap.crowns) ap.crowns.forEach((c,i)=>{ c.scale.y=1+Math.sin(t*2+i*2.1)*0.2; });
        if(ap.accumulator) ap.accumulator.scale.setScalar(1+Math.sin(t*2.5)*0.25);
        break;
      case 'frost':
        if(ap.shards) ap.shards.forEach((s,i)=>{ s.rotation.y+=dt*(1.5+i*0.3); });
        if(ap.aura) ap.aura.scale.setScalar(1+Math.sin(t*2)*0.15);
        break;
      case 'arc':
        if(ap.coils) ap.coils.forEach((c,i)=>{ c.rotation.z=t*(2+i*0.5); });
        if(ap.topOrb) ap.topOrb.scale.setScalar(1+Math.sin(t*5)*0.2);
        break;
    }
    if(ap.accentRing) ap.accentRing.rotation.z+=dt*0.8;
    const range=this.getRange(), dmg=this.getDamage();
    if(this.def.slow){
      for(const e of enemies){
        if(e.dead) continue;
        if(e.mesh.position.distanceTo(this.group.position)<range){
          e.speedMul=Math.min(e.speedMul, 1-this.def.slow);
        }
      }
    }
    const mode=this.targetMode||gameTargetMode;
    this.target=null; let bestVal=null;
    for(const e of enemies){
      if(e.dead) continue;
      const d=e.mesh.position.distanceTo(this.group.position);
      if(d>range) continue;
      let pick=false;
      switch(mode){
        case 'FIRST': if(bestVal===null||e.pathT>bestVal){bestVal=e.pathT;pick=true;} break;
        case 'LAST': if(bestVal===null||e.pathT<bestVal){bestVal=e.pathT;pick=true;} break;
        case 'STRONG': if(bestVal===null||e.hp>bestVal){bestVal=e.hp;pick=true;} break;
        case 'WEAK': if(bestVal===null||e.hp<bestVal){bestVal=e.hp;pick=true;} break;
      }
      if(pick) this.target=e;
    }
    if(this.target && this.cooldown<=0){
      this.cooldown=this.def.rate;
      if(sound) sound.play('shoot');
      const muzzlePos=this.group.position.clone();
      if(this.def.id==='gravity'){
        muzzlePos.y=1.2;
        /* Spacetime ripple effect */
        if(effects) effects.push(new GravityPulse(this.group.position.clone(),range,this.group.parent));
        for(const e of enemies){
          if(!e.dead && e.mesh.position.distanceTo(this.group.position)<range){
            projectiles.push(new Projectile(muzzlePos,e,dmg,0x8844ff,6,this.group.parent));
          }
        }
      } else if(this.def.id==='frost'){
        /* Frost: shoot at primary target + slow all in range */
        muzzlePos.y=1.3;
        projectiles.push(new Projectile(muzzlePos,this.target,dmg,this.def.color,7,this.group.parent));
        if(effects) effects.push(new GravityPulse(this.group.position.clone(),range,this.group.parent));
      } else if(this.def.id==='arc'){
        /* Arc: chain lightning to up to N targets */
        muzzlePos.y=2.5;
        const chain=this.def.chain||3;
        let current=this.target;
        const hit=new Set();
        for(let i=0;i<chain&&current&&!current.dead;i++){
          projectiles.push(new Projectile(muzzlePos.clone(),current,dmg*(1-i*0.2),this.def.color,12,this.group.parent));
          hit.add(current);
          /* Find nearest unhit enemy to current */
          let next=null,nextD=3.0;
          for(const e of enemies){
            if(e.dead||hit.has(e)) continue;
            const d=e.mesh.position.distanceTo(current.mesh.position);
            if(d<nextD){nextD=d;next=e;}
          }
          current=next;
        }
      } else {
        muzzlePos.y=1.8;
        projectiles.push(new Projectile(muzzlePos,this.target,dmg,this.def.color,
          this.def.id==='nova'?5:8, this.group.parent));
      }
      /* Muzzle flash for all towers */
      if(effects) effects.push(new MuzzleFlash(muzzlePos,this.def.color,this.group.parent));
    }
  }
  destroy(){
    this.group.traverse(child=>{
      if(child.geometry) child.geometry.dispose();
      if(child.material){
        if(Array.isArray(child.material)) child.material.forEach(m=>m.dispose());
        else child.material.dispose();
      }
    });
    this.scene.remove(this.group);
  }
}
