/* Detailed lunar disc, orthographic projection of NASA's LROC albedo map.
 * Static geometry is cached; only sunlight changes on each real-time update. */
(function(root){
 'use strict';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function lighting(phase,hemisphere='north'){
  const angle=clamp(phase.phaseAngle,0,180)*Math.PI/180;
  return {x:Math.sin(angle)*(phase.waxing?1:-1),y:0,z:Math.cos(angle),flip:hemisphere==='south'?-1:1};
 }
 function phaseName(phase){
  if(phase.fraction<0.005)return 'New Moon';
  if(phase.fraction>0.995)return 'Full Moon';
  if(Math.abs(phase.fraction-0.5)<0.015)return phase.waxing?'First Quarter':'Last Quarter';
  return (phase.waxing?'Waxing ':'Waning ')+(phase.fraction<0.5?'Crescent':'Gibbous');
 }
 function sample(texture,u,v,channel){
  const x=clamp(u*(texture.width-1),0,texture.width-1),y=clamp(v*(texture.height-1),0,texture.height-1),x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(x0+1,texture.width-1),y1=Math.min(y0+1,texture.height-1),fx=x-x0,fy=y-y0;
  const at=(a,b)=>texture.data[(b*texture.width+a)*4+channel];
  return (at(x0,y0)*(1-fx)+at(x1,y0)*fx)*(1-fy)+(at(x0,y1)*(1-fx)+at(x1,y1)*fx)*fy;
 }
 function surface(texture,size){
  const normal=new Float32Array(size*size*3),color=new Uint8Array(size*size*3),edge=new Uint8ClampedArray(size*size);
  const radius=size/2-1;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const i=y*size+x,nx=(x+0.5-size/2)/radius,ny=-(y+0.5-size/2)/radius,r2=nx*nx+ny*ny;
   if(r2>=1)continue;
   const nz=Math.sqrt(1-r2),u=0.5+Math.atan2(nx,nz)/(2*Math.PI),v=0.5-Math.asin(ny)/Math.PI;
   normal.set([nx,ny,nz],i*3);edge[i]=clamp((1-Math.sqrt(r2))*radius,0,1)*255;
   for(let c=0;c<3;c++)color[i*3+c]=sample(texture,u,v,c);
  }
  return {size,normal,color,edge};
 }
 function shade(surface,phase,options={},out=new Uint8ClampedArray(surface.size**2*4)){
  const light=lighting(phase,options.hemisphere),earthshine=clamp(Number(options.earthshine)||0,0,25)/100,brightness=clamp(Number(options.brightness)||100,20,150)/100;
  for(let i=0;i<surface.edge.length;i++){
   const j=i*3,k=i*4,nz=surface.normal[j+2];
   const incidence=surface.normal[j]*light.x+nz*light.z;
   // A lunar diffuse/Lommel-Seeliger blend avoids a plastic-looking shiny sphere.
   const diffuse=incidence>0?0.35*incidence+0.65*2*incidence/(incidence+nz+0.0001):0;
   const strength=(earthshine*(0.6+0.4*nz)+(1-earthshine)*diffuse)*brightness;
   const target=light.flip===1?k:out.length-4-k;
   for(let c=0;c<3;c++)out[target+c]=surface.color[j+c]*strength;
   out[target+3]=surface.edge[i];
  }
  return out;
 }
 const api={lighting,phaseName,surface,shade};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MischiefMoon=api;
})(typeof window!=='undefined'?window:globalThis);
