const {test}=require('node:test'),assert=require('node:assert/strict');
const moon=require('../moon-renderer.js'),sky=require('../vendor/sky-math.js');
test('astronomy follows real new/full/quarter phases, independent of local timezone',()=>{
 const eclipse=sky.moonPhase(new Date('2024-04-08T18:21:00Z')),full=sky.moonPhase(new Date('2024-03-25T07:00:00Z'));
 assert.ok(eclipse.fraction<0.001);assert.ok(full.fraction>0.999);
 const waxing=sky.moonPhase(new Date('2024-04-15T19:13:00Z')),waning=sky.moonPhase(new Date('2024-04-02T03:15:00Z'));
 assert.ok(Math.abs(waxing.fraction-.5)<.01&&waxing.waxing);assert.ok(Math.abs(waning.fraction-.5)<.01&&!waning.waxing);
 assert.equal(moon.phaseName(eclipse),'New Moon');assert.equal(moon.phaseName(full),'Full Moon');
});
test('lit disc area matches illumination; waxing and waning light opposite limbs',()=>{
 for(const fraction of [.03,.25,.5,.8,.99])for(const waxing of [true,false]){
  const light=moon.lighting({phaseAngle:Math.acos(2*fraction-1)*180/Math.PI,waxing});let lit=0,total=0;
  for(let y=-.995;y<1;y+=.01)for(let x=-.995;x<1;x+=.01){if(x*x+y*y>=1)continue;total++;if(x*light.x+Math.sqrt(1-x*x-y*y)*light.z>0)lit++;}
  assert.ok(Math.abs(lit/total-fraction)<.006);
  assert.equal(Math.sign(light.x),waxing?1:-1);
 }
});
test('new moon stays dark, optional earthshine shows texture, southern view rotates all pixels',()=>{
 const texture={width:2,height:2,data:new Uint8ClampedArray(16).fill(200)},surface=moon.surface(texture,40);
 const phase={phaseAngle:180,waxing:false},dark=moon.shade(surface,phase),earth=moon.shade(surface,phase,{earthshine:12});
 assert.equal(Math.max(...dark.filter((_,i)=>i%4!==3)),0);assert.ok(earth.some((v,i)=>i%4!==3&&v>0));
 const quarter={phaseAngle:90,waxing:true},north=moon.shade(surface,quarter),south=moon.shade(surface,quarter,{hemisphere:'south'});
 for(let i=0;i<north.length;i+=4)assert.deepEqual(south.slice(i,i+4),north.slice(north.length-4-i,north.length-i));
 assert.equal(north[3],0);assert.ok(north.every(Number.isFinite));
});
