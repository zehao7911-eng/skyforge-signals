export class Music{
 constructor(){this.enabled=true;this.step=0;this.next=0;this.mode='dive'}
 start(){
  if(!this.enabled)return;
  try{
   this.context ||= new AudioContext();
   this.context.resume().catch(()=>{});
   if(!this.gain){this.gain=this.context.createGain();this.gain.gain.value=.17;this.gain.connect(this.context.destination);}
   if(!this.timer){this.next=this.context.currentTime;this.timer=setInterval(()=>this.tick(),35)}
  }catch{}
 }
 tone(frequency,time,duration,type='triangle',volume=.16){
  if(!this.context||!this.enabled)return;
  const o=this.context.createOscillator(),g=this.context.createGain();
  o.type=type;o.frequency.setValueAtTime(frequency,time);
  g.gain.setValueAtTime(volume,time);g.gain.exponentialRampToValueAtTime(.001,time+duration);
  o.connect(g);g.connect(this.gain);o.start(time);o.stop(time+duration);
 }
 tick(){
  if(!this.context||!this.enabled||document.hidden)return;
  const now=this.context.currentTime;
  if(this.next<now-.3)this.next=now;
  while(this.next<now+.12){
   const step=this.step++%16,t=this.next,beat=this.mode==='chute'?.14:.105;
   if(step%4===0){this.tone(67,t,.13,'sine',.7);this.tone(39,t+.035,.11,'sine',.45)}
   if(step%4===2)this.tone(173,t,.055,'triangle',.16);
   this.tone(step%2?1600:2300,t,.022,'square',.018);
   const bass=[110,110,130.81,98][Math.floor(step/4)];
   if(step%2===0)this.tone(bass,t,.12,'sawtooth',.08);
   this.tone([440,659.25,523.25,783.99,659.25,523.25,880,659.25][step%8],t,.075,'triangle',.10);
   this.next+=beat;
  }
 }
 hit(combo){if(this.context){this.tone(660+combo*55,this.context.currentTime,.12,'sine',.38);this.tone(990+combo*55,this.context.currentTime+.06,.15,'triangle',.3)}}
 toggle(){this.enabled=!this.enabled;if(this.enabled)this.start();else this.context?.suspend().catch(()=>{})}
 stop(){clearInterval(this.timer);this.timer=null;this.context?.suspend().catch(()=>{})}
}
