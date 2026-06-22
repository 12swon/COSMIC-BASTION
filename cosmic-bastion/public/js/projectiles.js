// =============================================
// COSMIC BASTION - Projectile System
// Trail, Projectile, NovaExplosion, Explosion
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
    this.mesh=new THREE.Mesh(new THREE.SphereGeometry(0.12,6,6),
      new THREE.MeshBasicMaterial({color,blending:THREE.AdditiveBlending}));
    this.mesh.position.copy(pos);
    this.trail=null; this.scene=scene||null; this._trailFrame=0;
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
  destroy(){ this.scene.remove(this.mesh); }
}

/* ---- Particle Burst Explosion ---- */
export class Explosion {
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
      arr[i*3]+=this.vels[i].x*dt; arr[i*3+1]+=this.vels[i].y*dt; arr[i*3+2]+=this.vels[i].z*dt;
    }
    this.geo.attributes.position.needsUpdate=true;
    this.pts.material.opacity=this.life/0.6;
  }
  destroy(){ this.scene.remove(this.pts); }
}
