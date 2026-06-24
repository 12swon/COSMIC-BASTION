// =============================================
// COSMIC BASTION - Enemy System
// Enhanced 3D enemy models with HP bars
// =============================================
import * as THREE from 'three';
import { ENEMY_DEFS } from './constants.js';

export class Enemy {
  constructor(type, curve, scene, diffMul){
    const d=ENEMY_DEFS[type];
    const hpMul=diffMul?diffMul.hpMul:1;
    const spdMul=diffMul?diffMul.spdMul:1;
    this.type=type;
    this.hp=Math.round(d.hp*hpMul); this.maxHp=this.hp;
    this.baseSpd=d.spd*spdMul; this.reward=d.reward;
    this.dead=false; this.reached=false;
    this.pathT=0; this.scene=scene; this.speedMul=1;
    const mat=new THREE.MeshStandardMaterial({color:d.color,emissive:d.color,emissiveIntensity:0.25,metalness:0.6,roughness:0.4});
    switch(type){
      case 'asteroid': {
        const geo=new THREE.IcosahedronGeometry(0.5,1);
        const pa=geo.attributes.position;
        for(let i=0;i<pa.count;i++){
          const nx=pa.getX(i),ny=pa.getY(i),nz=pa.getZ(i);
          const n=(Math.random()-0.5)*0.15;
          pa.setXYZ(i,nx+n,ny+n,nz+n);
        }
        pa.needsUpdate=true; geo.computeVertexNormals();
        this.mesh=new THREE.Mesh(geo,mat);
        this.mesh.add(new THREE.Mesh(geo.clone(),
          new THREE.MeshBasicMaterial({color:0xff6600,wireframe:true,transparent:true,opacity:0.4})));
        const trail=new THREE.Mesh(new THREE.ConeGeometry(0.12,0.35,6),
          new THREE.MeshBasicMaterial({color:0xff4400,transparent:true,opacity:0.5,blending:THREE.AdditiveBlending}));
        trail.position.set(0,0,-0.55); trail.rotation.x=Math.PI/2; this.mesh.add(trail);
        break;
      }
      case 'scout': {
        const v=new Float32Array([
          0,0,0.6, -0.5,0,-0.3, 0.5,0,-0.3,
          0,0.2,0.4, -0.3,0.2,-0.2, 0.3,0.2,-0.2,
          0,0,0.6, 0,0.2,0.4, -0.5,0,-0.3,
          -0.5,0,-0.3, 0,0.2,0.4, -0.3,0.2,-0.2,
          0,0,0.6, 0.5,0,-0.3, 0,0.2,0.4,
          0.5,0,-0.3, 0.3,0.2,-0.2, 0,0.2,0.4,
          -0.5,0,-0.3, 0.5,0,-0.3, -0.3,0.2,-0.2,
          0.5,0,-0.3, 0.3,0.2,-0.2, -0.3,0.2,-0.2,
          -0.5,0,-0.3, -0.9,0,-0.5, -0.3,0.1,-0.2,
          0.5,0,-0.3, 0.9,0,-0.5, 0.3,0.1,-0.2,
        ]);
        const geo=new THREE.BufferGeometry();
        geo.setAttribute('position',new THREE.BufferAttribute(v,3));
        geo.computeVertexNormals();
        this.mesh=new THREE.Mesh(geo,mat);
        const eg=new THREE.Mesh(new THREE.SphereGeometry(0.1,8,8),
          new THREE.MeshBasicMaterial({color:d.color,transparent:true,opacity:0.7,blending:THREE.AdditiveBlending}));
        eg.position.set(0,0.1,-0.35); this.mesh.add(eg);
        const sh=new THREE.Mesh(new THREE.TorusGeometry(0.4,0.02,6,16),
          new THREE.MeshBasicMaterial({color:d.color,transparent:true,opacity:0.25}));
        sh.rotation.x=Math.PI/2; sh.position.y=0.1; this.mesh.add(sh);
        break;
      }
      case 'cruiser': {
        const bg=new THREE.BoxGeometry(0.5,0.3,1.0);
        this.mesh=new THREE.Mesh(bg,mat);
        const br=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.25,0.25),
          new THREE.MeshStandardMaterial({color:d.color,emissive:d.color,emissiveIntensity:0.3,metalness:0.7,roughness:0.3}));
        br.position.set(0,0.27,0.15); this.mesh.add(br);
        const em=new THREE.MeshBasicMaterial({color:0xff6644,transparent:true,opacity:0.6,blending:THREE.AdditiveBlending});
        const eL=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.1,0.25,8),em);
        eL.position.set(-0.2,0,-0.55); eL.rotation.x=Math.PI/2; this.mesh.add(eL);
        const eR=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.1,0.25,8),em);
        eR.position.set(0.2,0,-0.55); eR.rotation.x=Math.PI/2; this.mesh.add(eR);
        const pm=new THREE.MeshStandardMaterial({color:0x661122,metalness:0.9,roughness:0.4});
        const pL=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.2,0.6),pm);
        pL.position.set(-0.28,0.05,0); this.mesh.add(pL);
        const pR=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.2,0.6),pm);
        pR.position.set(0.28,0.05,0); this.mesh.add(pR);
        this.mesh.add(new THREE.Mesh(bg,new THREE.MeshBasicMaterial({color:d.color,wireframe:true,transparent:true,opacity:0.2})));
        break;
      }
      case 'titan': {
        const cg=new THREE.DodecahedronGeometry(0.7,0);
        this.mesh=new THREE.Mesh(cg,mat);
        const am=new THREE.MeshStandardMaterial({color:d.color,emissive:d.color,emissiveIntensity:0.35,metalness:0.7,roughness:0.3});
        for(let i=0;i<4;i++){
          const a=(i/4)*Math.PI*2+Math.PI/4;
          const arm=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.9,6),am);
          arm.position.set(Math.cos(a)*0.7,0,Math.sin(a)*0.7);
          arm.rotation.z=Math.PI/2; arm.rotation.y=-a; this.mesh.add(arm);
          const tg=new THREE.Mesh(new THREE.SphereGeometry(0.08,6,6),
            new THREE.MeshBasicMaterial({color:d.color,transparent:true,opacity:0.6,blending:THREE.AdditiveBlending}));
          tg.position.set(Math.cos(a)*1.15,0,Math.sin(a)*1.15); this.mesh.add(tg);
        }
        this.mesh.add(new THREE.Mesh(new THREE.SphereGeometry(0.95,16,16),
          new THREE.MeshBasicMaterial({color:d.color,transparent:true,opacity:0.1,blending:THREE.AdditiveBlending,depthWrite:false})));
        this.mesh.add(new THREE.Mesh(cg,new THREE.MeshBasicMaterial({color:d.color,wireframe:true,transparent:true,opacity:0.25})));
        break;
      }
    }
    this.hpBg=new THREE.Sprite(new THREE.SpriteMaterial({color:0x330000}));
    this.hpBg.scale.set(1,0.1,1); this.hpBg.position.y=1;
    this.hpFg=new THREE.Sprite(new THREE.SpriteMaterial({color:0x00ff66}));
    this.hpFg.scale.set(1,0.1,1); this.hpFg.position.y=1;
    this.mesh.add(this.hpBg,this.hpFg);
    const p=curve.getPointAt(0);
    this.mesh.position.copy(p); this.mesh.position.y=8;
    this._entranceTime=0; this._entranceDur=0.6;
    scene.add(this.mesh); this.curve=curve;
  }
  damage(n){
    this.hp=Math.max(0,this.hp-n);
    this._frameDmg=(this._frameDmg||0)+n;
    const r=this.hp/this.maxHp;
    this.hpFg.scale.x=Math.max(r,0.001);
    this.hpFg.position.x=-(1-r)*0.5;
    this.hpFg.material.color.setHex(r>0.5?0x00ff66:r>0.25?0xffaa00:0xff3344);
    if(this.hp<=0) this.dead=true;
  }
  update(dt){
    if(this.dead||this.reached) return;
    /* Entrance drop animation */
    if(this._entranceTime<this._entranceDur){
      this._entranceTime+=dt;
      const t=Math.min(this._entranceTime/this._entranceDur,1);
      const ease=t*t;
      this.mesh.position.y=8+(0.6-8)*ease;
      this.mesh.rotation.x+=dt*4*(1-t);
      return;
    }
    this.pathT+=this.baseSpd*this.speedMul*dt;
    if(this.pathT>=1){this.reached=true; return;}
    const p=this.curve.getPointAt(Math.min(this.pathT,0.999));
    this.mesh.position.set(p.x,0.6,p.z);
    this.mesh.rotation.y+=dt*2.5;
    this.mesh.rotation.x+=dt*0.7;
  }
  destroy(){ this.scene.remove(this.mesh); }
}
