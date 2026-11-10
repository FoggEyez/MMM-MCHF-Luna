/* global Module, SkyMath, MischiefMoon */
Module.register('MMM-MCHF-Luna',{
 requiresVersion:'2.38.0',
 defaults:{diameter:260,autoFit:true,brightness:100,earthshine:12,hemisphere:'north',showTitle:false,showPhase:true,showIllumination:true},
 getScripts(){return [this.file('vendor/ephemeris.js'),this.file('vendor/sky-math.js'),this.file('moon-renderer.js')];},
 getStyles(){return [this.file('mischief-surfaces.css'),this.file('MMM-MCHF-Luna.css')];},
 start(){
  this.paused=false;this.timer=null;
  this.visibility=()=>this.schedule();document.addEventListener('visibilitychange',this.visibility);window.addEventListener('resize',this.visibility);
  const image=new Image();image.onload=()=>{
   const source=document.createElement('canvas');source.width=image.naturalWidth;source.height=image.naturalHeight;
   const ctx=source.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
   this.texture=ctx.getImageData(0,0,source.width,source.height);this.schedule();
  };
  image.onerror=()=>{this.textureError=true;if(this.message)this.message.textContent='Moon texture unavailable';};
  image.src=this.file('assets/moon-color.jpg');
 },
 number(key,min,max,fallback){const value=Number(this.config[key]);return Number.isFinite(value)?Math.max(min,Math.min(max,value)):fallback;},
 getDom(){
  if(this.shell)return this.shell;
  const shell=document.createElement('div');shell.className='mischief-moon';shell.style.width=this.number('diameter',140,440,260)+'px';
  const title=document.createElement('div');title.className='mm-moon-title';title.textContent='THE MOON';title.hidden=this.config.showTitle===false;
  this.canvas=document.createElement('canvas');this.canvas.className='mm-moon-disc';this.canvas.setAttribute('role','img');this.canvas.setAttribute('aria-label','Current lunar phase');
  this.message=document.createElement('div');this.message.className='mm-moon-message';this.message.textContent=this.textureError?'Moon texture unavailable':'Preparing the Moon…';
  this.phaseLabel=document.createElement('div');this.phaseLabel.className='mm-moon-phase';this.phaseLabel.hidden=this.config.showPhase===false;
  this.details=document.createElement('div');this.details.className='mm-moon-detail';this.details.hidden=this.config.showIllumination===false;
  shell.append(title,this.canvas,this.message,this.phaseLabel,this.details);this.shell=shell;return shell;
 },
 notificationReceived(name){if(name==='DOM_OBJECTS_CREATED'){this.schedule();if(!this.resizeObserver){this.resizeObserver=new ResizeObserver(()=>this.schedule());const top=document.querySelector('.region.top.left');if(top)this.resizeObserver.observe(top);}}},
 suspend(){this.paused=true;clearTimeout(this.timer);},
 resume(){this.paused=false;this.schedule();},
 schedule(){
  clearTimeout(this.timer);if(this.paused||document.hidden||!this.canvas?.isConnected)return;
  if(this.texture){this.fit();this.draw();}this.timer=setTimeout(()=>this.schedule(),30000);
 },
 fit(){
  let diameter=this.number('diameter',140,440,260);
  this.shell.style.marginLeft='auto';this.shell.style.marginRight='auto';
  if(this.config.autoFit!==false&&this.data.position==='bottom_left'){
   const top=document.querySelector('.region.top.left'),region=this.shell.closest('.region.bottom.left');
   if(top&&region){const extra=this.shell.getBoundingClientRect().height-this.canvas.getBoundingClientRect().height,space=region.getBoundingClientRect().bottom-top.getBoundingClientRect().bottom-extra-18;diameter=Math.max(96,Math.min(diameter,Math.floor(space)));}
  }
  this.diameter=diameter;this.shell.style.width=diameter+'px';
  if(this.data.position==='bottom_left'){
   const top=document.querySelector('.region.top.left'),region=this.shell.closest('.region.bottom.left');
   if(top&&region){const upper=top.getBoundingClientRect(),lower=region.getBoundingClientRect();this.shell.style.marginLeft=Math.max(0,upper.left+upper.width/2-lower.left-diameter/2)+'px';}
  }
 },
 draw(){
  const size=Math.round((this.diameter||this.number('diameter',140,440,260))*Math.min(2,window.devicePixelRatio||1));
  if(this.canvas.width!==size||!this.surface){
   this.canvas.width=size;this.canvas.height=size;this.surface=MischiefMoon.surface(this.texture,size);
   this.frame=this.canvas.getContext('2d').createImageData(size,size);
  }
  const now=new Date(Date.now()),phase=SkyMath.moonPhase(now),label=MischiefMoon.phaseName(phase);
  MischiefMoon.shade(this.surface,phase,{earthshine:this.number('earthshine',0,25,12),brightness:this.number('brightness',20,150,100),hemisphere:this.config.hemisphere},this.frame.data);
  this.canvas.getContext('2d').putImageData(this.frame,0,0);this.canvas.setAttribute('aria-label',`${label}, ${(phase.fraction*100).toFixed(1)} percent illuminated`);
  this.phaseLabel.textContent=label;this.details.textContent=`${(phase.fraction*100).toFixed(1)}% illuminated`;
  this.message.hidden=true;this.canvas.dataset.observedAt=now.toISOString();this.canvas.dataset.illumination=phase.fraction.toFixed(6);
 }
});
