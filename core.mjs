export const chapters=[
 {name:'Sunrise terrace',ore:[[-1,2],[6,-2]],source:[-9,-2],goal:[-3,-10],mirrors:[[-3,-2]],initial:[1],color:0x33cbf0,story:'THE SUNBIRD WAKES!'},
 {name:'Copper orchard',ore:[[0,2],[6,-5]],source:[-9,1],goal:[7,-7],mirrors:[[-5,1],[-5,-7]],initial:[1,1],color:0x5acff2,story:'THE ORCHARD LIGHTS UP!'},
 {name:'Starfall forge',ore:[[-1,3],[8,-4]],source:[-9,2],goal:[4,-12],mirrors:[[-6,2],[-6,-5],[4,-5]],initial:[1,1,1],color:0x5f77db,story:'THE SKY BRIDGE RETURNS!'}
];
const vectors=[[1,0],[0,1],[-1,0],[0,-1]];
export function beam(chapter,angles){
 let [x,z]=chapter.source,dir=0;
 const points=[[x,z]],seen=new Set();
 for(let i=0;i<80;i++){
  const key=x+','+z+','+dir;
  if(seen.has(key))break;
  seen.add(key);
  x+=vectors[dir][0];z+=vectors[dir][1];
  if(x===chapter.goal[0]&&z===chapter.goal[1])return {points:[...points,[x,z]],lit:true};
  const m=chapter.mirrors.findIndex(([a,b])=>a===x&&b===z);
  if(m>=0){points.push([x,z]);dir=(angles[m]?[1,0,3,2]:[3,2,1,0])[dir]}
  if(x<-11||x>11||z<-14||z>5)break;
 }
 return {points:[...points,[x,z]],lit:false};
}
