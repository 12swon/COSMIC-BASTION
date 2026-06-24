// =============================================
// COSMIC BASTION - Scene Management
// BackgroundScene + GameScene
// =============================================
import * as THREE from 'three';
import { PATH_PTS, PLATFORM_POS } from './constants.js';

/* ---- Background Scene (starfield + nebula) ---- */
export class BackgroundScene {
  constructor(canvas){
    const W=innerWidth||1280, H=innerHeight||800;
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(60, W/H, 0.1, 2000);
    this.cam.position.set(0,0,1);
    this.renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false});
    this.renderer.setSize(W, H);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    this.renderer.setClearColor(0x030308);
    this._buildStars(); this._buildNebula();
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
    this.cam.aspect=W/H; this.cam.updateProjectionMatrix();
    this.renderer.setSize(W, H);
  }
  render(){
    const t=this.clock.getElapsedTime();
    this.stars.rotation.y=t*0.008; this.stars.rotation.x=t*0.003;
    for(const c of this.clouds){
      c.mesh.material.opacity=c.baseOp+Math.sin(t*0.3+c.phase)*0.008;
    }
    this.renderer.render(this.scene,this.cam);
  }
}

/* ---- Game Scene (main 3D battlefield) ---- */
export class GameScene {
  constructor(){
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x030310, 0.012);
    this.cam = new THREE.PerspectiveCamera(50,(innerWidth||1280)/(innerHeight||800),0.1,500);
    this.cam.position.set(0,38,26); this.cam.lookAt(0,0,2);
    /* Spherical camera control state */
    this.camTarget=new THREE.Vector3(0,0,2);
    this.camDist=44; this.camPolar=0.95; this.camAzimuth=0;
    this.camMinDist=15; this.camMaxDist=70;
    this._camAnim=null; this._followTarget=null;
    this.renderer = new THREE.WebGLRenderer({antialias:true,alpha:false});
    const gW=innerWidth||1280, gH=innerHeight||800;
    this.renderer.setSize(gW, gH);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    this.renderer.setClearColor(0x030310);
    this.renderer.shadowMap.enabled=false;
    const cvs=this.renderer.domElement;
    cvs.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;z-index:1;display:none;pointer-events:none;';
    document.body.appendChild(cvs); this.canvas=cvs;
    this.scene.add(new THREE.AmbientLight(0x334466,0.7));
    const sun=new THREE.DirectionalLight(0xffeedd,0.6);
    sun.position.set(10,30,15); this.scene.add(sun);
    const core=new THREE.PointLight(0x00f0ff,1.5,50);
    core.position.set(-9,3,18); this.scene.add(core);
    this._buildStars(); this.path = this._buildPath();
    this.platforms = this._buildPlatforms();
    this._buildCore(); this._buildGrid();
    window.addEventListener('resize',()=>this._resize());
  }
  _resize(){
    const W=innerWidth||1280, H=innerHeight||800;
    this.cam.aspect=W/H; this.cam.updateProjectionMatrix();
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
    const tubeG=new THREE.TubeGeometry(curve,200,0.35,8,false);
    const tubeM=new THREE.MeshBasicMaterial({color:0x00f0ff,transparent:true,opacity:0.35,blending:THREE.AdditiveBlending});
    this.scene.add(new THREE.Mesh(tubeG,tubeM));
    const tube2G=new THREE.TubeGeometry(curve,200,0.12,6,false);
    const tube2M=new THREE.MeshBasicMaterial({color:0x88ffff,transparent:true,opacity:0.7});
    this.scene.add(new THREE.Mesh(tube2G,tube2M));
    for(let i=0;i<pts.length;i+=20){
      const s=new THREE.Mesh(new THREE.SphereGeometry(0.15,6,6),new THREE.MeshBasicMaterial({color:0x00ffff,transparent:true,opacity:0.5}));
      s.position.copy(pts[i]); s.position.y+=0.2; this.scene.add(s);
    }
    return {curve, points:pts};
  }
  _buildPlatforms(){
    return PLATFORM_POS.map(([x,z])=>{
      const g=new THREE.CylinderGeometry(1.3,1.5,0.45,6);
      const m=new THREE.MeshStandardMaterial({color:0x14142a,emissive:0x0a0a20,metalness:0.85,roughness:0.35});
      const mesh=new THREE.Mesh(g,m); mesh.position.set(x,0,z);
      const ring=new THREE.Mesh(new THREE.RingGeometry(1.35,1.55,6),new THREE.MeshBasicMaterial({color:0x00f0ff,transparent:true,opacity:0.18,side:THREE.DoubleSide}));
      ring.rotation.x=-Math.PI/2; ring.position.y=0.25; mesh.add(ring);
      this.scene.add(mesh);
      return {mesh,pos:new THREE.Vector3(x,0,z),occupied:false,towerId:null};
    });
  }
  _buildCore(){
    const g=new THREE.IcosahedronGeometry(1.4,1);
    const m=new THREE.MeshStandardMaterial({color:0x00f0ff,emissive:0x005577,emissiveIntensity:0.6,metalness:0.9,roughness:0.15});
    this.coreMesh=new THREE.Mesh(g,m);
    const end=PATH_PTS[PATH_PTS.length-1];
    this.coreMesh.position.set(end.x,2,end.z); this.scene.add(this.coreMesh);
    const glow=new THREE.Mesh(new THREE.SphereGeometry(2.5,16,16),new THREE.MeshBasicMaterial({color:0x00f0ff,transparent:true,opacity:0.08,blending:THREE.AdditiveBlending}));
    glow.position.copy(this.coreMesh.position); this.scene.add(glow);
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
  /* BUG FIX: enable pointer-events when game canvas is shown */
  show(){ this.canvas.style.display='block'; this.canvas.style.pointerEvents='auto'; }
  hide(){ this.canvas.style.display='none'; this.canvas.style.pointerEvents='none'; }
  /* Camera control methods */
  zoom(delta){
    this.camDist=Math.max(this.camMinDist,Math.min(this.camMaxDist,this.camDist+delta*2));
  }
  pan(dx,dy){
    const speed=this.camDist*0.002;
    const sinA=Math.sin(this.camAzimuth), cosA=Math.cos(this.camAzimuth);
    this.camTarget.x+=(-dx*cosA-dy*sinA)*speed;
    this.camTarget.z+=(dx*sinA-dy*cosA)*speed;
    this.camTarget.x=Math.max(-30,Math.min(30,this.camTarget.x));
    this.camTarget.z=Math.max(-30,Math.min(30,this.camTarget.z));
  }
  rotate(da){ this.camAzimuth+=da; }
  follow(target){ this._followTarget=target; }
  unfollow(){ this._followTarget=null; }
  updateCamera(){
    if(this._followTarget){
      if(this._followTarget.dead){this._followTarget=null;}
      else{this.camTarget.lerp(this._followTarget.mesh.position,0.1);}
    }
    if(this._camAnim){
      const a=this._camAnim;
      a.t+=performance.now()*0.001-a._lastT; a._lastT=performance.now()*0.001;
      const p=Math.min(a.t/a.dur,1);
      const ease=1-Math.pow(1-p,3);
      this.camDist=a.fromDist+(a.toDist-a.fromDist)*ease;
      this.camPolar=a.fromPolar+(a.toPolar-a.fromPolar)*ease;
      this.camTarget.lerpVectors(a.fromTarget,a.toTarget,ease);
      if(p>=1) this._camAnim=null;
    }
    const sp=Math.sin(this.camPolar), cp=Math.cos(this.camPolar);
    const sa=Math.sin(this.camAzimuth), ca=Math.cos(this.camAzimuth);
    this.cam.position.set(
      this.camTarget.x+this.camDist*sp*sa,
      this.camTarget.y+this.camDist*cp,
      this.camTarget.z+this.camDist*sp*ca
    );
    this.cam.lookAt(this.camTarget);
  }
  animateTo(dist,polar,target,dur){
    this._camAnim={
      fromDist:this.camDist, toDist:dist,
      fromPolar:this.camPolar, toPolar:polar,
      fromTarget:this.camTarget.clone(), toTarget:target.clone(),
      dur:dur, t:0, _lastT:performance.now()*0.001
    };
  }
  render(){
    this.updateCamera();
    const t=performance.now()*0.001;
    this.coreMesh.rotation.y=t*0.5;
    this.coreMesh.rotation.x=Math.sin(t*0.3)*0.2;
    this.coreMesh.position.y=2+Math.sin(t*0.8)*0.3;
    this.coreGlow.material.opacity=0.06+Math.sin(t)*0.03;
    this.renderer.render(this.scene,this.cam);
  }
}
