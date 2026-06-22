// =============================================
// COSMIC BASTION - Tower System
// Enhanced 3D models + shooting + upgrades
// =============================================
import * as THREE from 'three';
import { Projectile } from './projectiles.js';

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
  update(dt, enemies, projectiles, gameTargetMode, sound){
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
      if(this.def.id==='gravity'){
        for(const e of enemies){
          if(!e.dead && e.mesh.position.distanceTo(this.group.position)<range){
            projectiles.push(new Projectile(this.group.position.clone().setY(1.2),e,dmg,0x8844ff,6,this.group.parent));
          }
        }
      } else {
        projectiles.push(new Projectile(this.group.position.clone().setY(1.8),this.target,dmg,this.def.color,
          this.def.id==='nova'?5:8, this.group.parent));
      }
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
