const T=globalThis.THREE;
T.ColorManagement.legacyMode=false;
export class World{
 constructor(canvas){
  this.renderer=new T.WebGLRenderer({canvas,antialias:true});
  this.renderer.outputEncoding=T.sRGBEncoding;this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.45));
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
  this.scene=new T.Scene();this.scene.background=new T.Color(0x52c3f3);this.scene.fog=new T.FogExp2(0xaacff4,.013);
  this.camera=new T.PerspectiveCamera(53,1,.1,155);
  this.scene.add(new T.HemisphereLight(0xe9f5ff,0x6e7452,.93));
  const sun=new T.DirectionalLight(0xffeac5,1.45);sun.position.set(-9,18,8);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:.1,far:65});sun.shadow.bias=-.0003;sun.shadow.normalBias=.025;
  this.scene.add(sun);
  this.geo=new T.BoxGeometry();this.palette=new Map();
  this.stone=this.pixel('#ada8c0',['#bdb4ca','#9895af','#b4afc3','#9292a9'],true);
  this.brick=this.pixel('#855466',['#965d71','#75465e','#a46972'],true);
  this.grass=this.pixel('#67b63a',['#80c84e','#5baa34','#91ce4c','#4c963d']);
  this.wood=this.pixel('#956047',['#aa7458','#754839','#bc8861'],true);
  this.leaf=this.pixel('#e983a8',['#e3649b','#f3a6c0','#f4b0d1','#ba5089']);
  this.dirt=this.pixel('#7d5435',['#8e5e3a','#67422a','#9f7049','#524534']);
  this.rock=this.pixel('#797e83',['#6b7076','#9b9b8d','#8a8b83','#555f69']);
  this.leaf=this.pixel('#39752a',['#275221','#4a8b31','#539d34','#376731']);
  this.grass=this.pixel('#649936',['#77a63c','#699b36','#84ad46','#54862c']);
  this.oreTexture=this.pixel('#616968',['#74766e','#454e53','#828275','#4cf7db','#42b9aa']);
  this.grassSide=this.grass.map.image.cloneNode();this.grassSide.width=32;this.grassSide.height=32;
  const edge=this.grassSide.getContext('2d');edge.drawImage(this.dirt.map.image,0,0);edge.drawImage(this.grass.map.image,0,0,32,8,0,0,32,8);
  for(let n=0;n<16;n++)edge.drawImage(this.grass.map.image,n*2,8,2,5+n%3, n*2,8,2,3+n%5);
  const sideMap=new T.CanvasTexture(this.grassSide);sideMap.encoding=T.sRGBEncoding;sideMap.magFilter=T.NearestFilter;sideMap.minFilter=T.NearestMipmapLinearFilter;
  const side=new T.MeshStandardMaterial({map:sideMap,roughness:1});
  this.sod=[side,side,this.grass,this.dirt,side,side];
  this.buildIsland();
  this.setpieces=new T.Group();this.scene.add(this.setpieces);
  this.rays=new T.Group();this.scene.add(this.rays);
  this.rayCore=new T.MeshBasicMaterial({color:0xfffac3});
  this.rayGlow=new T.MeshBasicMaterial({color:0xffb738,transparent:true,opacity:.24,depthWrite:false});
  this.hero=this.group();this.makeHero();
  this.bird=this.group();this.makeBird();
  this.bursts=Array.from({length:26},(_,i)=>this.box(.11,.11,.11,[0xffcd50,0xff85b7,0xfff1a9][i%3],0,0,0));
  this.look=new T.Vector3();
  const resize=()=>{const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix()};
  resize();new ResizeObserver(resize).observe(canvas);
 }
 material(c){
  if(typeof c==='object')return c;
  if(!this.palette.has(c))this.palette.set(c,new T.MeshStandardMaterial({color:c,roughness:.78}));
  return this.palette.get(c);
 }
 pixel(base,colors,mortar=false){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
  const ctx=canvas.getContext('2d');ctx.fillStyle=base;ctx.fillRect(0,0,32,32);
  for(let i=0;i<190;i++){
   ctx.fillStyle=colors[i%colors.length];
   ctx.fillRect((i*19+i*i*7)%32,(i*23+i*i*3)%32,1+i%4,1+i%3);
  }
  if(mortar){ctx.fillStyle='#4a405c';ctx.globalAlpha=.32;for(let y=0;y<32;y+=8){ctx.fillRect(0,y,32,1);for(let x=(y%16?8:0);x<32;x+=16)ctx.fillRect(x,y,1,8)}}
  const map=new T.CanvasTexture(canvas);map.encoding=T.sRGBEncoding;map.magFilter=T.NearestFilter;map.minFilter=T.NearestMipmapLinearFilter;
  return new T.MeshStandardMaterial({map,roughness:.89});
 }
 group(parent=this.scene,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g}
 box(w,h,d,c,x,y,z,parent=this.scene,cast=false){
  const m=new T.Mesh(this.geo,this.material(c));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=cast;m.receiveShadow=true;parent.add(m);return m;
 }
 batch(c,cells,cast=false){
  const mesh=new T.InstancedMesh(this.geo,this.material(c),cells.length),proxy=new T.Object3D();
  cells.forEach(([x,y,z,w,h,d],i)=>{proxy.position.set(x,y,z);proxy.scale.set(w,h,d);proxy.updateMatrix();mesh.setMatrixAt(i,proxy.matrix)});
  mesh.castShadow=cast;mesh.receiveShadow=true;this.scene.add(mesh);return mesh;
 }
 buildIsland(){
  const tiles=[],grass=[],strata=[],rocks=[];
  for(let x=-13;x<=13;x++)for(let z=-17;z<=8;z++){
   if(Math.abs(x)>11&&(z===8||z===-17))continue;
   const road=(x===-3&&z>-13)||(x>-10&&x<9&&(z===1||z===-7))||((x+1)**2+(z+3)**2<10&&((x+z)&3)!==0);
   (road?tiles:grass).push([x,-.5,z,1,1,1]);
   if(Math.abs(x)>=12||z<=-16||z>=7){
    strata.push([x,-1.5,z,1,1,1]);rocks.push([x,-2.5,z,1,1,1]);
    if((x*x+z*z)%5>1)rocks.push([x,-3.5,z,1,1,1]);
   }
   if((Math.abs(x)>=12||z<=-15)&&((x*13+z*7)&3)!==0)grass.push([x,.5,z,1,1,1]);
   if((Math.abs(x)>=13||z<=-16)&&((x+z)&1)===0)grass.push([x,1.5,z,1,1,1]);
  }
  this.batch(this.stone,tiles);this.batch(this.sod,grass);this.batch(this.dirt,strata);this.batch(this.rock,rocks);
  for(let i=0;i<4;i++)this.box(24-i*4,1,23-i*3.6,this.rock,0,-2.5-i,-4.5);
  this.water=[];
  for(let j=0;j<12;j++)this.water.push(this.box(.89,1.03,.85,[0x33b8f3,0x65e0ff,0x286ed7][j%3],11.6,-.1-j*.72,7.65+j*.10));
  for(const side of [-1,1]){
   for(let i=0;i<7;i++){
    const z=5-i*3.3,x=side*11.35;
    this.box(.53,.92,.53,this.stone,x,.46,z,undefined,true);
    this.box(.61,.11,.61,0xffc858,x,.98,z);
    this.box(.45,.43,.45,new T.MeshBasicMaterial({color:0xffedb0}),x,1.23,z);
    this.box(.58,.10,.58,0x9d6388,x,1.49,z);
    if(i<6)this.box(.21,.23,2.8,this.stone,x,.53,z-1.65);
   }
  }
  const crowns=[],trunks=[];
  for(const [x,z,h] of [[-12,3,4],[12,1,5],[-12,-7,5],[12,-8,4],[-12,-14,5],[12,-15,5],[-9,-15,4],[7,-16,5],[-12,7,4],[12,6,5]]){
   for(let j=0;j<h;j++)trunks.push([x,.5+j,z,.88,1,.88]);
   for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let j=0;j<3;j++){
    if(j===2&&Math.abs(a)+Math.abs(b)>1)continue;
    crowns.push([x+a,h-.5+j,z+b,1,1,1]);
   }
  }
  this.batch(this.leaf,crowns,true);this.batch(this.wood,trunks,true);
  // The watch hut occupies the back ridge, outside the playable path.
  const hut=this.group(this.scene,-6,0,-16.7);
  const plank=this.pixel('#b78953',['#c4945b','#a67846','#8c6240'],true);
  const roof=this.pixel('#984b3d',['#bb5e41','#8a3f38','#a85341'],true);
  this.box(4.7,.85,3.4,this.rock,0,.42,0,hut,true);
  this.box(4.4,2.5,3.2,plank,0,2.08,0,hut,true);
  for(const a of [-1,1]){
   this.box(.4,2.65,.47,this.wood,a*2.1,2.04,1.58,hut,true);
   this.box(.79,.79,.10,0x69472f,a*1.25,2.29,1.62,hut);
   this.box(.59,.60,.11,0xffd976,a*1.25,2.29,1.69,hut);
   this.box(.09,.62,.14,0x805338,a*1.25,2.29,1.73,hut);
  }
  this.box(.86,1.78,.13,this.wood,0,1.65,1.62,hut);
  this.box(.12,.12,.13,0xf2bd65,.23,1.60,1.72,hut);
  for(let j=0;j<4;j++)this.box(5.2-j*1.1,.46,4.0,roof,0,3.45+j*.44,0,hut,true);
  this.box(.59,1.17,.61,this.rock,1.5,4.20,-.70,hut,true);
  const pond=this.group(this.scene,5.7,0,-12);
  for(let a=-2;a<=2;a++)for(let b=-1;b<=1;b++){
   if(Math.abs(a)===2&&Math.abs(b)===1)continue;
   this.box(1,.075,1,((a+b)&1)?0x3aa6d9:0x43b9e6,a,.022,b,pond);
   if(((a*3+b)&3)===0)this.box(.46,.026,.10,0xa5e8ea,a,.066,b+.27,pond);
  }
  this.sheep=this.group(this.scene,8,0,-2);
  this.box(1.04,.87,1.33,this.pixel('#e6e4d8',['#f3f0dd','#dad9c9','#c8c8bb']),0,.82,0,this.sheep,true);
  this.box(.62,.62,.58,0xf7efdb,0,1.01,-.79,this.sheep,true);
  this.box(.47,.32,.07,0xe9b4a2,0,.94,-1.10,this.sheep);
  for(const a of [-1,1]){
   this.box(.08,.08,.07,0x322520,a*.14,1.09,-1.10,this.sheep);
   for(const b of [-1,1])this.box(.22,.46,.23,0xb99c82,a*.32,.23,b*.40,this.sheep,true);
  }
  const blooms=[];
  for(let i=0;i<66;i++){
   const x=(i%2?-1:1)*(11.5+(i%3)*.42),z=6-(i*7%23);
   blooms.push([x,.12,z,.10,.25,.10]);
   this.box(.22,.12,.22,[0xffb7d3,0xffd844,0xb492ff][i%3],x,.29,z);
  }
  this.batch(0x45964b,blooms);
  for(let i=0;i<14;i++){
   const x=Math.sin(i*2.1)*(27+i%4*8),z=-24-i%5*8,y=-8+i%5*2;
   for(let j=0;j<4;j++)this.box(7-j*1.55,1.3,6-j*1.32,j?this.brick:this.grass,x,y-j*1.2,z);
   if(i%2===0){
    this.box(.5,2,.5,this.wood,x,y+1.5,z);
    this.box(2.5,1.7,2,this.leaf,x,y+2.65,z);
    for(let j=0;j<6;j++)this.box(.44,1.9,.52,0x55d9ff,x+2.15,y-1.1-j*1.6,z+.8);
   }
  }
  for(let i=0;i<10;i++)for(let j=0;j<4;j++){
   this.box(4+j*.4,1.25,3.2,0xf0f8ff,-44+i*9+j*2.3,10+i%3+j*.25,-48-i%4*7);
  }
 }
 makeHero(){
  const p=this.hero;
  this.box(.64,.72,.44,0x258a83,0,1.13,0,p,true);
  this.box(.53,.52,.50,0xf0aa7d,0,1.78,-.03,p,true);
  this.box(.59,.18,.56,0x37283e,0,2.05,-.025,p,true);
  this.box(.61,.12,.64,0xee9b40,0,2.16,-.035,p,true);
  this.box(.48,.18,.54,0xffc55c,0,2.27,-.025,p,true);
  this.box(.49,.17,.055,0x284575,0,1.86,-.30,p);
  this.box(.36,.09,.067,0x88e5f3,0,1.88,-.32,p);
  this.box(.54,.58,.29,0xc36738,0,1.17,.34,p,true);
  this.box(.44,.17,.05,0xffd461,0,1.28,.51,p);
  this.limbs=[];
  this.tool=this.group(p,.48,1.06,-.34);this.tool.rotation.z=-.38;
  this.box(.11,.66,.11,this.wood,0,0,0,this.tool,true);
  for(let n=-2;n<=2;n++)this.box(.12,.15,.13,0x8ed8cf,n*.12,.32-Math.abs(n)*.09,0,this.tool,true);
  this.chips=[];
  for(const side of [-1,1]){
   const leg=this.group(p,side*.17,.76,0),arm=this.group(p,side*.43,1.43,0);
   this.box(.25,.55,.29,0x324477,0,-.24,0,leg,true);
   this.box(.29,.18,.45,0x49354c,0,-.65,-.065,leg,true);
   this.box(.20,.43,.23,0x299c91,0,-.18,0,arm,true);
   this.box(.20,.20,.22,0xf0aa7d,0,-.44,0,arm,true);
   this.limbs.push({leg,arm,side});
  }
 }
 makeBird(){
  this.box(.66,.48,.92,0xf6ad35,0,0,0,this.bird,true);
  this.box(.46,.43,.48,0xffd550,0,.24,-.38,this.bird,true);
  this.box(.21,.12,.22,0xff7952,0,.19,-.69,this.bird);
  for(const x of [-.18,.18])this.box(.08,.085,.045,0x4b3152,x,.30,-.63,this.bird);
  this.wings=[-1,1].map(side=>{
   const w=this.group(this.bird,side*.32,.08,0);
   this.box(.76,.12,.41,0xffd860,side*.35,0,0,w,true);
   this.box(.49,.08,.23,0xf5814a,side*.76,-.045,.08,w);
   return w;
  });
 }
 layout(chapter){
  this.setpieces.clear();
  this.finale=[];
  this.ore=chapter.ore.map(([x,z])=>this.box(.96,.96,.96,this.oreTexture,x,.48,z,this.setpieces,true));
  const decoration=this.group(this.setpieces);
  const kind=chapter.mirrors.length;
  for(const side of [-1,1]){
   const z=-15;
   for(let row=0;row<4;row++)this.box(1.25,.74,1.25,this.stone,side*3.1,.37+row*.74,z,decoration,true);
   this.box(1.5,.28,1.5,kind===3?0x8c5ae4:0xffa250,side*3.1,3.05,z,decoration,true);
   this.box(.74,.48,.74,this.material(0xffdc77),side*3.1,3.42,z,decoration);
  }
  for(let i=0;i<7;i++)this.box(.92,.60,1.4,this.brick,i-3,3.85+(3-Math.abs(i-3))*.26,-15,decoration,true);
  if(kind===2)for(let i=0;i<7;i++){
   const x=i-3,z=-15.7+Math.sin(i)*.5;
   const lamp=this.box(.33,.42,.33,this.rayCore,x,2.65,z,decoration);lamp.visible=false;this.finale.push(lamp);
  }
  if(kind===3)for(let i=0;i<9;i++){
   const slab=this.box(3,.52,.9,i%2?this.stone:0x8268da,0,-5,-18-i*.94,decoration);slab.visible=false;this.finale.push(slab);
  }this.rays.clear();this.scene.background.setHex(chapter.color);
  const pedestal=([x,z],color)=>{
   const g=this.group(this.setpieces,x,0,z);
   this.box(1.42,.24,1.42,this.stone,0,.12,0,g,true);
   this.box(.84,.72,.84,this.brick,0,.54,0,g,true);
   this.box(1.10,.14,1.10,color,0,.96,0,g,true);
   return g;
  };
  const source=pedestal(chapter.source,0xe6a956);
  this.box(.68,.68,.68,this.rayCore,0,1.46,0,source).rotation.z=Math.PI/4;
  const receiver=pedestal(chapter.goal,0xc695e4);
  this.beacon=this.box(.73,.73,.73,0x8f69be,0,1.46,0,receiver,true);
  for(const side of [-1,1]){
   this.box(.12,1.36,.12,0x9c649e,side*.53,1.03,0,receiver);
   this.box(.20,.20,.22,0xffce58,side*.53,1.71,0,receiver);
  }
  this.mirrors=chapter.mirrors.map(point=>{
   const base=pedestal(point,0xdaad73);
   const pivot=this.group(base,0,1.48,0);
   this.box(1.22,1.02,.13,0x623d71,0,0,0,pivot,true);
   this.box(1.02,.82,.16,0x8be7fa,0,0,0,pivot);
   this.box(.76,.082,.177,0xe2fcff,0,.17,0,pivot).rotation.z=.32;
   for(const x of [-.55,.55])this.box(.11,1.03,.17,0xffd36a,x,0,0,pivot);
   return pivot;
  });
 }
 setBeam(path){
  this.rays.clear();
  for(let i=1;i<path.points.length;i++){
   const [a,b]=path.points[i-1],[x,z]=path.points[i],length=Math.hypot(x-a,z-b);
   if(!length)continue;
   for(const [mat,width] of [[this.rayCore,.064],[this.rayGlow,.23]]){
    const m=this.box(length,width,width,mat,(a+x)/2,1.48,(b+z)/2,this.rays);
    m.rotation.y=-Math.atan2(z-b,x-a);
   }
  }
  this.beacon.material=path.lit?this.rayCore:this.material(0x8f69be);
 }
 mine(i){
  const o=this.ore[i];if(!o?.visible)return;
  o.visible=false;this.swing=.29;
  for(let k=0;k<12;k++){
   const m=this.box(.12,.12,.12,k%2?0x43d9c1:0x8a8a81,o.position.x,.56,o.position.z);
   this.chips.push({m,x:o.position.x,z:o.position.z,a:k*2.4,t:0});
  }
 }
 draw({x,z,heading,moving,angles,near,phase,chapter,sceneTime,mined,oreNear},time,dt){
  this.swing=Math.max(0,(this.swing||0)-dt);
  this.tool.rotation.x=-Math.sin(this.swing/.29*Math.PI)*1.7;
  this.ore.forEach((o,i)=>{o.visible=!(mined&(1<<i));const pulse=i===oreNear?1+Math.sin(time*8)*.055:1;o.scale.setScalar(.96*pulse)});
  this.chips=this.chips.filter(p=>{p.t+=dt;if(p.t>.58){p.m.removeFromParent();return false}
   p.m.position.set(p.x+Math.cos(p.a)*p.t*2,.5+3*p.t-5*p.t*p.t,p.z+Math.sin(p.a)*p.t*2);p.m.rotation.set(p.t*8,p.a+p.t*4,0);return true;});
  this.sheep.position.set(8.1+Math.sin(time*.7)*.65,0,-2+Math.cos(time*.38)*1.3);
  this.sheep.rotation.y=Math.sin(time*.53)*1.1;
  this.water.forEach((p,i)=>{p.position.x=11.6+Math.sin(time*4+i)*.10;p.scale.x=.84+.09*Math.sin(time*7-i)});

  this.hero.position.set(x,0,z);this.hero.rotation.y=heading;
  for(const {arm,leg,side} of this.limbs){
   const swing=moving?Math.sin(time*13)*.52*side:0;
   leg.rotation.x=swing;arm.rotation.x=-swing;
  }
  this.mirrors.forEach((m,i)=>{
   const target=angles[i]?Math.PI*.25:-Math.PI*.25;
   m.rotation.y+=(target-m.rotation.y)*Math.min(1,dt*14);
   m.scale.setScalar(i===near?1+Math.sin(time*7)*.045:1);
  });
  const story=phase==='intro'||phase==='celebrate';
  this.finale.forEach((part,i)=>{
   if(phase==='celebrate'||phase==='result'){
    part.visible=phase==='result'||sceneTime>i*.14;
    if(chapter.mirrors.length===3)part.position.y=-5+4.8*Math.min(1,Math.max(0,(sceneTime-i*.14)*2.4));
   }
  });
  this.bird.visible=story;
  const [gx,gz]=phase==='intro'?chapter.source:chapter.goal;
  this.bird.position.set(gx+Math.sin(sceneTime*2)*1.3,1.4+sceneTime*.76,gz+.8);
  this.bird.rotation.y=-sceneTime;
  this.wings.forEach((wing,i)=>wing.rotation.z=Math.sin(time*19)*(i?-.7:.7));
  this.bursts.forEach((m,i)=>{
   m.visible=phase==='celebrate';
   if(m.visible){const age=(sceneTime*.7+i*.061)%1;m.position.set(gx+Math.sin(i*2.4)*age*3,1.7+age*3,gz+Math.cos(i*2.4)*age*3);m.rotation.set(time+i,time*2,0)}
  });
  if(phase==='menu'){
   this.camera.position.set(6.7,8.2,14.6);this.camera.lookAt(-2.8,1.45,-4.6);
  }else if(story){
   this.camera.position.set(gx+4.7*Math.cos(sceneTime*.45),4.1+sceneTime*.18,gz+6.4);
   this.camera.lookAt(gx,2.1,gz-(phase==='celebrate'&&chapter.mirrors.length===3?Math.min(5,sceneTime*2.3):0));
  }else{
   const mix=1-Math.exp(-dt*9);
   this.camera.position.x+=(x-this.camera.position.x)*mix;
   this.camera.position.y+=(4.4-this.camera.position.y)*mix;
   this.camera.position.z+=(z+6.4-this.camera.position.z)*mix;
   this.camera.lookAt(x,1.30,z-2.4);
  }
  this.renderer.render(this.scene,this.camera);
 }
}


