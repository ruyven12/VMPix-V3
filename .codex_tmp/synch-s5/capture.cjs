
const fs=require('fs'),assert=require('node:assert/strict'),{setup,chromium}=require('./fixture.cjs');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
for(const[width,height,seconds]of[[412,915,35],[1920,1080,30]]){
const f=await setup(browser,{viewport:{width,height}}),p=f.page,cdp=await f.context.newCDPSession(p),frames=[];
await f.go();await p.waitForFunction(()=>synchronicityMemoriesSession?.stage.getAttribute('aria-busy')==='false');await p.waitForFunction(()=>synchronicityMemoriesSession?.results.filter(m=>m.next).length>=3);
console.log('Ready '+width+' '+JSON.stringify(await p.evaluate(()=>synchronicityMemoriesSession.results.map(m=>({id:m.id,kind:m.kind,photos:m.sources.length})))));
await p.evaluate(()=>{window.__s5Capture={swaps:[],gaps:[],longTasks:[],shifts:[],last:0,stop:false};const s=__s5Capture;
new MutationObserver(()=>{for(const m of synchronicityMemoriesSession?.results||[])if(m.fade)s.swaps.push({id:m.id,src:m.incoming.src,at:performance.now()});}).observe(document.querySelector('.synchronicity-memories'),{subtree:true,childList:true});
new PerformanceObserver(l=>s.longTasks.push(...l.getEntries().map(x=>x.duration))).observe({type:'longtask'});
new PerformanceObserver(l=>s.shifts.push(...l.getEntries().filter(x=>!x.hadRecentInput).map(x=>({value:x.value,at:x.startTime})))).observe({type:'layout-shift'});
const frame=t=>{if(s.stop)return;if(s.last)s.gaps.push(t-s.last);s.last=t;requestAnimationFrame(frame)};requestAnimationFrame(frame);});
await p.screenshot({path:__dirname+'/shows-'+width+'x'+height+'.png'});
cdp.on('Page.screencastFrame',e=>{frames.push({data:e.data,time:e.metadata.timestamp});cdp.send('Page.screencastFrameAck',{sessionId:e.sessionId}).catch(()=>{})});
await cdp.send('Page.startScreencast',{format:'jpeg',quality:80,maxWidth:width>=1000?1280:width,maxHeight:width>=1000?720:height,everyNthFrame:3});
await p.waitForTimeout(seconds*1000);await cdp.send('Page.stopScreencast');
const metrics=await p.evaluate(()=>{__s5Capture.stop=true;const s=__s5Capture,g=s.gaps.slice().sort((a,b)=>a-b);return {swaps:s.swaps,frameP50:g[Math.floor(g.length*.5)],frameP95:g[Math.floor(g.length*.95)],gapsOver50:g.filter(x=>x>50).length,longTasks:s.longTasks,shifts:s.shifts,overflow:document.documentElement.scrollWidth-innerWidth,images:synchronicityMemoriesSession.results.map(m=>({id:m.id,src:m.image.src,kind:m.kind,cached:m.images.size,layers:m.frame.children.length}))}});
assert(metrics.swaps.length>=6);assert.equal(metrics.overflow,0);await p.screenshot({path:__dirname+'/shows-'+width+'x'+height+'-later.png'});
console.log('Captured '+width+' '+frames.length+' frames; swaps '+metrics.swaps.length);await f.close();
const context=await browser.newContext(),output=await context.newPage();const vw=width>=1000?1280:width,vh=width>=1000?720:height;await output.setContent('<canvas width="'+vw+'" height="'+vh+'"></canvas>');
const video=await output.evaluate(async frames=>{const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),stream=canvas.captureStream(0),track=stream.getVideoTracks()[0],mimeType=['video/webm;codecs=vp9','video/webm;codecs=vp8'].find(t=>MediaRecorder.isTypeSupported(t)),recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:3000000}),chunks=[],stopped=new Promise(r=>recorder.onstop=r);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};const image=new Image();image.src='data:image/jpeg;base64,'+frames[0].data;await image.decode();ctx.drawImage(image,0,0,canvas.width,canvas.height);recorder.start();track.requestFrame();const began=performance.now(),first=frames[0].time;for(let i=1;i<frames.length;i++){image.src='data:image/jpeg;base64,'+frames[i].data;await image.decode();const wait=(frames[i].time-first)*1000-(performance.now()-began);if(wait>0)await new Promise(r=>setTimeout(r,wait));ctx.drawImage(image,0,0,canvas.width,canvas.height);track.requestFrame()}await new Promise(r=>setTimeout(r,100));recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());return new Promise(r=>{const reader=new FileReader();reader.onload=()=>r(reader.result);reader.readAsDataURL(new Blob(chunks,{type:mimeType}))});},frames);
fs.writeFileSync(__dirname+'/living-memories-'+width+'x'+height+'.webm',Buffer.from(video.split(',')[1],'base64'));
fs.writeFileSync(__dirname+'/capture-'+width+'.json',JSON.stringify({viewport:{width,height},video:{width:vw,height:vh},seconds:frames.at(-1).time-frames[0].time,frames:frames.length,browser:await browser.version(),data:'Current public API responses captured 2026-10-23, real SmugMug images; local implementation, Analytics blocked; not physical-device evidence.',requests:f.calls,errors:f.errors,metrics},null,2));await context.close();console.log('Saved '+width);
}
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
