// =============================================
// COSMIC BASTION - Sound System
// Web Audio API programmatic sound effects
// =============================================

export class SoundSystem {
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
