// =============================================
// COSMIC BASTION - Entry Point
// Application bootstrap + game loop
// =============================================
import { BackgroundScene, GameScene } from './scenes.js';
import { Game } from './game.js';

(function boot(){
  const bgCanvas=document.getElementById('bg-canvas');
  const bgScene=new BackgroundScene(bgCanvas);
  const gameScene=new GameScene();
  const game=new Game(bgScene,gameScene);
  window.__game=game;

  document.getElementById('btn-start').addEventListener('click',()=>{game._startFromLevel=1;game.startGame();});
  document.getElementById('btn-scores').addEventListener('click',async()=>{
    const panel=document.getElementById('scores-panel');
    const list=document.getElementById('scores-list');
    try{
      const res=await fetch('/api/scores');
      const scores=await res.json();
      if(!scores.length){list.innerHTML='<div style="color:#556;text-align:center;padding:20px">\u6682\u65e0\u8bb0\u5f55</div>';}
      else{list.innerHTML=scores.map((s,i)=>`<div class="score-entry"><span class="score-rank">#${i+1}</span><span class="score-name">${s.name}</span><span class="score-val">${s.score}</span><span class="score-wave">W${s.wave}</span></div>`).join('');}
    }catch(e){list.innerHTML='<div style="color:#844">\u52a0\u8f7d\u5931\u8d25</div>';}
    panel.classList.remove('hidden');
  });
  document.getElementById('btn-help').addEventListener('click',()=>document.getElementById('help-panel').classList.remove('hidden'));
  document.getElementById('btn-story').addEventListener('click',()=>document.getElementById('story-panel').classList.remove('hidden'));
  document.getElementById('btn-achievements').addEventListener('click',()=>{game._renderAchievementsPanel();document.getElementById('achievements-panel').classList.remove('hidden');});

  /* Level select button (programmatic) */
  const levelBtn=document.createElement('button');
  levelBtn.id='btn-levels'; levelBtn.className='menu-btn';
  levelBtn.innerHTML='<span class="btn-icon">\u229e</span><span class="btn-text">\u5173\u5361\u9009\u62e9</span><span class="btn-sub">LEVEL SELECT</span>';
  levelBtn.addEventListener('click',()=>{game._renderLevels();document.getElementById('levels-panel').classList.remove('hidden');});
  document.querySelector('.menu-buttons').appendChild(levelBtn);

  let last=0;
  function loop(now){
    requestAnimationFrame(loop);
    const rawDt=Math.min((now-last)/1000,0.05); last=now;
    bgScene.render();
    if(game.state==='playing'){game.update(rawDt);gameScene.render();}
  }
  requestAnimationFrame(loop);
})();
