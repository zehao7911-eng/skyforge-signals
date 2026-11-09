import {chapters,beam} from './core.mjs';
import {World} from './view.mjs';
import {Music} from './audio.mjs';
import {BeaconHost} from './sdk.mjs';
const $=s=>document.querySelector(s),canvas=$('canvas'),music=new Music();
const key='skyforge-signals-save-v1', fresh=()=>({game:'skyforge-signals',v:1,cleared:0,gold:false,confetti:false});
let save=fresh(),world;
function merge(v){if(v?.game!==save.game||v.v!==1)return;save.cleared=Math.max(save.cleared,Number.isInteger(v.cleared)?Math.min(3,v.cleared):0);for(const k of ['gold','confetti'])save[k]||=v[k]===true}
try{merge(JSON.parse(localStorage.getItem(key)))}catch{}
function store(){try{localStorage.setItem(key,JSON.stringify(save))}catch{}host.save(save)}
const host=new BeaconHost(window,{load(v){merge(v);store();if(phase==='menu')menuText()},reward(k){if(save[k])return;save[k]=true;store();announce(k==='gold'?'GOLD BADGE UNLOCKED!':'STAR BADGE UNLOCKED!',2)}});
let i=0,chapter=chapters[0],angles=[...chapter.initial],x=-3,z=2.5,heading=0,near=-1,phase='menu',sceneTime=0,ttl=0,pointer=null,dx=0,dz=0;
const keys=new Set();
function announce(s,t=0){$('#caption').textContent=s;ttl=t}
function menuText(){if(save.cleared>0)$('#go').textContent=save.cleared===3?'REPLAY THE ISLANDS →':'CONTINUE →'}
function resetInput(){keys.clear();pointer=null;dx=dz=0;$('#stick').hidden=true}
function enter(n){i=n;chapter=chapters[i];angles=[...chapter.initial];x=chapter.mirrors[0][0];z=4;near=-1;heading=0;sceneTime=0;phase='intro';resetInput();world.layout(chapter);world.setBeam(beam(chapter,angles));$('#panel').hidden=true;$('#hud').hidden=true;$('#rotate').hidden=true;announce(chapter.name.toUpperCase());music.start()}
function play(){phase='play';sceneTime=0;announce('');$('#hud').hidden=false;$('#chapter').textContent='ISLAND '+(i+1)+' / '+chapters.length+'  ·  '+chapter.name.toUpperCase();host.start()}
function rotate(){if(phase!=='play'||near<0)return;angles[near]^=1;const result=beam(chapter,angles);world.setBeam(result);music.hit(result.lit?6:near+1);if(!result.lit){announce('BEAM REDIRECTED',.65);return}phase='celebrate';sceneTime=0;resetInput();$('#rotate').hidden=true;$('#hud').hidden=true;host.end();save.cleared=Math.max(save.cleared,i+1);store();announce(chapter.story)}
function finish(){phase='result';announce('');$('#panel').hidden=false;$('#title').textContent=i===2?'Skyforge restored!':'Beacon lit!';$('#desc').textContent=i===2?'The sunbird is home. The islands shine again.':'The next island is open. Follow the beam to find your next mirror.';$('#go').textContent=i===2?'PLAY AGAIN ↻':'NEXT ISLAND →'}
$('#go').onclick=()=>{if(world)enter(phase==='menu'?(save.cleared%3):(i+1)%3)};
$('#sound').onclick=()=>{music.toggle();$('#sound').textContent=music.enabled?'♫':'♪̸';$('#sound').setAttribute('aria-pressed',String(music.enabled))};
$('#rotate').onclick=rotate;
canvas.onpointerdown=e=>{if(phase==='intro'){play();return}if(phase!=='play'||pointer)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);$('#stick').hidden=false};
canvas.onpointermove=e=>{if(pointer?.id!==e.pointerId)return;let a=e.clientX-pointer.x,b=e.clientY-pointer.y,d=Math.max(36,Math.hypot(a,b));dx=a/d;dz=b/d;$('#stick b').style.transform='translate('+dx*24+'px,'+dz*24+'px)'};
for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,e=>{if(pointer?.id===e.pointerId)resetInput()});
addEventListener('keydown',e=>{if(!/^(Arrow|[wasde]$)/i.test(e.key))return;const k=e.key.toLowerCase();e.preventDefault();if(k==='e'&&!e.repeat)rotate();else keys.add(k)});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',resetInput);
document.addEventListener('visibilitychange',()=>{resetInput();if(document.hidden)music.stop()});
window.addEventListener('pagehide',e=>{resetInput();music.stop();if(!e.persisted){host.end();host.stop()}});
try{world=new World(canvas);world.layout(chapter);world.setBeam(beam(chapter,angles));menuText();host.poll()}catch(err){$('#title').textContent='3D unavailable';$('#desc').textContent='Open this game in a browser with WebGL enabled.';$('#go').hidden=true;console.error(err)}
let last=0;
function frame(ms){const time=ms/1000,dt=Math.min(.035,time-last);last=time;sceneTime+=dt;if(ttl>0&&(ttl-=dt)<=0)announce('');
 if(phase==='intro'&&sceneTime>2.5)play();if(phase==='celebrate'&&sceneTime>3.1)finish();
 let moving=false;
 if(phase==='play'){
  let vx=dx+Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),vz=dz+Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));
  const d=Math.max(1,Math.hypot(vx,vz));vx/=d;vz/=d;moving=Math.hypot(vx,vz)>.08;
  if(moving){const a=Math.max(-10.5,Math.min(10.5,x+vx*dt*5.8)),b=Math.max(-13.3,Math.min(5.3,z+vz*dt*5.8));const obstacles=[chapter.source,...chapter.mirrors,chapter.goal];if(obstacles.every(([mx,mz])=>Math.hypot(mx-a,mz-z)>.79))x=a;if(obstacles.every(([mx,mz])=>Math.hypot(mx-x,mz-b)>.79))z=b;heading=-Math.atan2(vx,-vz)}
  const distances=chapter.mirrors.map(([a,b])=>Math.hypot(a-x,b-z));const closest=Math.min(...distances);near=closest<2.25?distances.indexOf(closest):-1;
  $('#rotate').hidden=near<0;const task=near>=0?'Turn the mirror to bend the beam':(i===0?'Drag to move · walk to the mirror':'Follow the beam · find the next mirror');if($('#task').textContent!==task)$('#task').textContent=task;
 }
 world.draw({x,z,heading,moving,angles,near,phase,chapter,sceneTime},time,dt);
 requestAnimationFrame(frame);
}
if(world)requestAnimationFrame(frame);
