// =============================================
// COSMIC BASTION - Projectile & VFX System
// Trail, Projectile, NovaExplosion, Explosion,
// Debris, MuzzleFlash, GravityPulse, FloatingNumber
// =============================================
import * as THREE from 'three';

/* ---- Trail (projectile trail renderer) ---- */
export class Trail {
  constructor(color, scene){
    this.maxPts=6; this.positions=[]; this.scene=scene; this.dead=false;
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
    this.dead=true; this.scene.remove(this.line);
    this.geo.dispose(); this.line.material.dispose();
  }
}

/* ---- Homing Projectile ---- */
export class Projectile {
  constructor(pos,target,dmg,color,spd,scene){
    this.target=target; this.dmg=dmg; this.spd=spd||8;
    this.dead=false; this.color=color;
    this.scene=scene||null;
    this.mesh=new THREE.Mesh(new THREE.SphereGeometry(0.12,6,6),
      new THREE.MeshBasicMaterial({color,blending:THREE.AdditiveBlending}));
    this.mesh.position.copy(pos);
    this.trail=null; this._trailFrame=0;
    if(scene){ this.trail=new Trail(color,scene); }
  }
  update(dt){
    if(this.dead) return;
    if(!this.target||this.target.dead||this.target.reached){this.dead=true;return;}
    const dir=this.target.mesh.position.clone().sub(this.mesh.position);
    const d=dir.length();
    if(d<0.4){this.target.damage(this.dmg);this.dead=true;return;}
    dir.normalize();
    this.mesh.position.addScaledVector(dir,this.spd*dt);
    if(this.trail){ this._trailFrame++; if(this._trailFrame%2===0) this.trail.addPoint(this.mesh.position); }
  }
  destroy(){
    if(this.trail){ this.trail.destroy(); this.trail=null; }
    if(this.mesh.parent) this.mesh.parent.remove(this.mesh);
    this.mesh.geometry.dispose(); this.mesh.material.dispose();
  }
}

/* ---- Area-of-Effect Nova Explosion ---- */
export class NovaExplosion {
  constructor(pos,maxR,dmg,color,scene){
    this.pos=pos; this.maxR=maxR; this.dmg=dmg; this.r=0;
    this.dead=false; this.hit=new Set(); this.scene=scene; this.life=0.5;
    const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.5,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
    this.mesh=new THREE.Mesh(new THREE.SphereGeometry(1,16,16),m);
    this.mesh.position.copy(pos); scene.add(this.mesh);
  }
  update(dt,enemies){
    if(this.dead) return;
    this.r+=this.maxR*dt*3; this.life-=dt;
    this.mesh.scale.setScalar(this.r);
    this.mesh.material.opacity=Math.max(0,this.life);
    for(const e of enemies){
      if(e.dead||this.hit.has(e)) continue;
      if(e.mesh.position.distanceTo(this.pos)<this.r){e.damage(this.dmg);this.hit.add(e);}
    }
    if(this.life<=0) this.dead=true;
  }
  destroy(){ this.scene.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); }
}

/* ---- Enhanced Particle Burst Explosion ---- */
export class Explosion {
  constructor(pos,color,scene){
    this.scene=scene; this.life=0.7; this.dead=false;
    const N=32, arr=new Float32Array(N*3), vels=[];
    for(let i=0;i<N;i++){
      arr[i*3]=pos.x; arr[i*3+1]=pos.y; arr[i*3+2]=pos.z;
      const theta=Math.random()*Math.PI*2, phi=Math.random()*Math.PI;
      const spd=2+Math.random()*5;
      vels.push(new THREE.Vector3(
        Math.sin(phi)*Math.cos(theta)*spd,
        Math.cos(phi)*spd*0.8+2,
        Math.sin(phi)*Math.sin(theta)*spd
      ));
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(arr,3));
    this.vels=vels; this.geo=g;
    this.mat=new THREE.PointsMaterial({color,size:0.35,transparent:true,opacity:1,blending:THREE.AdditiveBlending,sizeAttenuation:true});
    this.pts=new THREE.Points(g,this.mat);
    scene.add(this.pts);
    /* Central flash light */
    this.flash=new THREE.PointLight(color,3,8);
    this.flash.position.copy(pos); scene.add(this.flash);
    this._flashLife=0.25;
  }
  update(dt){
    this.life-=dt;
    if(this.life<=0){this.dead=true;return;}
    const arr=this.geo.attributes.position.array;
    for(let i=0;i<this.vels.length;i++){
      this.vels[i].y-=9.8*dt;
      arr[i*3]+=this.vels[i].x*dt; arr[i*3+1]+=this.vels[i].y*dt; arr[i*3+2]+=this.vels[i].z*dt;
    }
    this.geo.attributes.position.needsUpdate=true;
    this.mat.opacity=this.life/0.7;
    this.mat.size=0.35*(this.life/0.7);
    /* Fade flash light */
    if(this._flashLife>0){
      this._flashLife-=dt;
      this.flash.intensity=Math.max(0,this._flashLife/0.25)*3;
    }
  }
  destroy(){
    this.scene.remove(this.pts); this.scene.remove(this.flash);
    this.geo.dispose(); this.mat.dispose();
  }
}

/* ---- Debris (tumbling mesh fragments on enemy death) ---- */
export class Debris {
  constructor(pos, color, scene){
    this.scene=scene; this.dead=false; this.life=0.8;
    this.meshes=[]; this.vels=[]; this.rotSpeeds=[];
    const count=3+Math.floor(Math.random()*3);
    const mat=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:0.4,metalness:0.7,roughness:0.4});
    for(let i=0;i<count;i++){
      const geo=Math.random()>0.5?new THREE.TetrahedronGeometry(0.1+Math.random()*0.1):new THREE.BoxGeometry(0.08+Math.random()*0.08,0.08+Math.random()*0.08,0.12+Math.random()*0.1);
      const m=new THREE.Mesh(geo,mat.clone());
      m.position.copy(pos); m.position.x+=(Math.random()-0.5)*0.3; m.position.z+=(Math.random()-0.5)*0.3;
      scene.add(m); this.meshes.push(m);
      const theta=Math.random()*Math.PI*2, spd=2+Math.random()*4;
      this.vels.push(new THREE.Vector3(Math.cos(theta)*spd, 3+Math.random()*4, Math.sin(theta)*spd));
      this.rotSpeeds.push(new THREE.Vector3((Math.random()-0.5)*12,(Math.random()-0.5)*12,(Math.random()-0.5)*12));
    }
    this._mat=mat;
  }
  update(dt){
    this.life-=dt;
    if(this.life<=0){this.dead=true;return;}
    for(let i=0;i<this.meshes.length;i++){
      this.vels[i].y-=12*dt;
      const m=this.meshes[i];
      m.position.addScaledVector(this.vels[i],dt);
      if(m.position.y<0){m.position.y=0;this.vels[i].y=0;this.vels[i].x*=0.5;this.vels[i].z*=0.5;}
      m.rotation.x+=this.rotSpeeds[i].x*dt;
      m.rotation.y+=this.rotSpeeds[i].y*dt;
      m.rotation.z+=this.rotSpeeds[i].z*dt;
      m.material.opacity=this.life/0.8; m.material.transparent=true;
    }
  }
  destroy(){
    for(const m of this.meshes){this.scene.remove(m);m.geometry.dispose();m.material.dispose();}
    this._mat.dispose();
  }
}

/* ---- Muzzle Flash (tower shooting flash) ---- */
export class MuzzleFlash {
  constructor(pos, color, scene){
    this.scene=scene; this.dead=false; this.life=0.1;
    this.mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending});
    this.mesh=new THREE.Mesh(new THREE.SphereGeometry(0.25,8,8),this.mat);
    this.mesh.position.copy(pos); scene.add(this.mesh);
    this.light=new THREE.PointLight(color,2,5);
    this.light.position.copy(pos); scene.add(this.light);
  }
  update(dt){
    this.life-=dt;
    if(this.life<=0){this.dead=true;return;}
    const t=this.life/0.1;
    this.mesh.scale.setScalar(1+(1-t)*2);
    this.mat.opacity=t*0.9;
    this.light.intensity=t*2;
  }
  destroy(){
    this.scene.remove(this.mesh); this.scene.remove(this.light);
    this.mesh.geometry.dispose(); this.mat.dispose();
  }
}

/* ---- Gravity Pulse (expanding spacetime ripple from gravity well) ---- */
export class GravityPulse {
  constructor(pos, maxR, scene){
    this.scene=scene; this.dead=false; this.life=0.6; this.r=0.3; this.maxR=maxR;
    this.mat=new THREE.MeshBasicMaterial({color:0x8844ff,transparent:true,opacity:0.4,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
    this.mesh=new THREE.Mesh(new THREE.TorusGeometry(0.3,0.06,8,32),this.mat);
    this.mesh.position.copy(pos); this.mesh.position.y=0.5;
    this.mesh.rotation.x=Math.PI/2; scene.add(this.mesh);
  }
  update(dt){
    this.life-=dt;
    if(this.life<=0){this.dead=true;return;}
    const progress=1-this.life/0.6;
    const r=this.r+(this.maxR-this.r)*progress;
    this.mesh.scale.setScalar(r/0.3);
    this.mat.opacity=0.4*(1-progress);
    this.mat.color.setHSL(0.75-progress*0.1,0.8,0.5+progress*0.2);
  }
  destroy(){
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose(); this.mat.dispose();
  }
}

/* ---- Floating Damage Number (DOM-based) ---- */
export class FloatingNumber {
  constructor(worldPos, text, color, camera){
    this.dead=false; this.life=0.8;
    const v=worldPos.clone().project(camera);
    const x=(v.x*0.5+0.5)*innerWidth;
    const y=(-v.y*0.5+0.5)*innerHeight;
    this.el=document.createElement('div');
    this.el.className='damage-number';
    this.el.textContent=text;
    this.el.style.left=x+'px'; this.el.style.top=y+'px';
    this.el.style.color=color;
    const container=document.getElementById('damage-numbers');
    if(container) container.appendChild(this.el);
    else this.dead=true;
  }
  update(dt){
    this.life-=dt;
    if(this.life<=0){this.dead=true;return;}
  }
  destroy(){
    if(this.el&&this.el.parentNode) this.el.parentNode.removeChild(this.el);
  }
}
