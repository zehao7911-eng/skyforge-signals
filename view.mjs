const T=globalThis.THREE;
T.ColorManagement.legacyMode=false;
export class World{
 constructor(canvas){
  this.renderer=new T.WebGLRenderer({canvas,antialias:true});
  this.renderer.outputEncoding=T.sRGBEncoding;this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.45));
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
  this.scene=new T.Scene();this.scene.background=new T.Color(0x52c3f3);this.scene.fog=new T.FogExp2(0xaacff4,.013);
  this.camera=new T.PerspectiveCamera(53,1,.1,155);
  this.scene.add(new T.HemisphereLight(0xe9f5ff,0x62519e,.92));
  const sun=new T.DirectionalLight(0xffe6a5,1.55);sun.position.set(-9,18,8);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:.1,far:65});sun.shadow.bias=-.0003;sun.shadow.normalBias=.025;
  this.scene.add(sun);
  this.geo=new T.BoxGeometry();this.palette=new Map();
  this.stone=this.pixel('#ada8c0',['#bdb4ca','#9895af','#b4afc3','#9292a9'],true);
  this.brick=this.pixel('#855466',['#965d71','#75465e','#a46972'],true);
  this.grass=this.pixel('#67b63a',['#80c84e','#5baa34','#91ce4c','#4c963d']);
  this.wood=this.pixel('#956047',['#aa7458','#754839','#bc8861'],true);
  this.leaf=this.pixel('#e983a8',['#e3649b','#f3a6c0','#f4b0d1','#ba5089']);
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
 batch(c,cells){
  const mesh=new T.InstancedMesh(this.geo,this.material(c),cells.length),proxy=new T.Object3D();
  cells.forEach(([x,y,z,w,h,d],i)=>{proxy.position.set(x,y,z);proxy.scale.set(w,h,d);proxy.updateMatrix();mesh.setMatrixAt(i,proxy.matrix)});
  mesh.receiveShadow=true;this.scene.add(mesh);return mesh;
 }
 buildIsland(){
  const tiles=[],grass=[],strata=[];
  for(let x=-13;x<=13;x++)for(let z=-17;z<=8;z++){
   const road=x>=-10&&x<=10&&z>=-13&&z<=5;
   (road?tiles:grass).push([x,-.22,z,.985,.44,.985]);
   if(Math.abs(x)===13||z===-17||z===8)strata.push([x,-1.1-(Math.abs(x+z)%3)*.2,z,1,1.5+(Math.abs(x+z)%3)*.4,1]);
  }
  this.batch(this.stone,tiles);this.batch(this.grass,grass);this.batch(this.brick,strata);
  for(let i=0;i<4;i++)this.box(26-i*4,1,25-i*3.6,this.brick,0,-.95-i,-4.5);
  for(const side of [-1,1]){
   for(let i=0;i<7;i++){
    const z=5-i*3.3,x=side*10.85;
    this.box(.53,.92,.53,this.stone,x,.46,z,undefined,true);
    this.box(.61,.11,.61,0xffc858,x,.98,z);
    this.box(.45,.43,.45,new T.MeshBasicMaterial({color:0xffedb0}),x,1.23,z);
    this.box(.58,.10,.58,0x9d6388,x,1.49,z);
    if(i<6)this.box(.21,.23,2.8,this.stone,x,.53,z-1.65);
   }
  }
  for(const [x,z] of [[-12,3],[12,1],[-12,-7],[12,-8],[-12,-14],[12,-15],[-7,-16],[7,-16]]){
   this.box(.60,3,.60,this.wood,x,1.5,z,undefined,true);
   for(let j=0;j<9;j++){
    this.box(1.12+j%2*.23,1.05,1.12,this.leaf,x+(j%3-1)*.79,3.25+Math.floor(j/3)*.46,z+Math.sin(j*4)*.55,undefined,true);
   }
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
  this.box(.64,.72,.44,0x3359a0,0,1.13,0,p,true);
  this.box(.53,.52,.50,0xf0aa7d,0,1.78,-.03,p,true);
  this.box(.59,.18,.56,0x37283e,0,2.05,-.025,p,true);
  this.box(.61,.12,.64,0xee9b40,0,2.16,-.035,p,true);
  this.box(.48,.18,.54,0xffc55c,0,2.27,-.025,p,true);
  this.box(.49,.17,.055,0x284575,0,1.86,-.30,p);
  this.box(.36,.09,.067,0x88e5f3,0,1.88,-.32,p);
  this.box(.54,.58,.29,0xc36738,0,1.17,.34,p,true);
  this.box(.44,.17,.05,0xffd461,0,1.28,.51,p);
  this.limbs=[];
  for(const side of [-1,1]){
   const leg=this.group(p,side*.17,.76,0),arm=this.group(p,side*.43,1.43,0);
   this.box(.25,.55,.29,0x264269,0,-.24,0,leg,true);
   this.box(.29,.18,.45,0x49354c,0,-.65,-.065,leg,true);
   this.box(.20,.43,.23,0x457ec9,0,-.18,0,arm,true);
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
 draw({x,z,heading,moving,angles,near,phase,chapter,sceneTime},time,dt){
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
   this.camera.position.set(13,11,16);this.camera.lookAt(-1,0,-3);
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

