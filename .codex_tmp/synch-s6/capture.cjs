const fs=require('fs'),assert=require('node:assert/strict'),{setup,chromium}=require('../synch-s5/fixture.cjs');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 const f=await setup(browser,{viewport:{width:412,height:915}}),p=f.page,cdp=await f.context.newCDPSession(p),frames=[];
 await f.go();await p.waitForFunction(()=>synchronicityMemoriesSession?.results.length===3&&synchronicityMemoriesSession.results.every(m=>m.next));
 const touch=async locator=>{const b=await locator.boundingBox();await p.touchscreen.tap(b.x+b.width/2,b.y+b.height/2)};
 await p.screenshot({path:__dirname+'/echoes-412x915.png'});
 cdp.on('Page.screencastFrame',e=>{frames.push({data:e.data,time:e.metadata.timestamp});cdp.send('Page.screencastFrameAck',{sessionId:e.sessionId}).catch(()=>{})});
 await cdp.send('Page.startScreencast',{format:'jpeg',quality:85,maxWidth:412,maxHeight:915,everyNthFrame:2});
 const timeline=[],mark=async label=>timeline.push({label,at:Date.now(),state:await p.evaluate(()=>({selected:synchronicityMemoriesSession.selection?.id||null,motion:synchronicityMemoriesSession.stage.dataset.memoryMotion,scroll:document.querySelector('.synchronicity-viewport').scrollTop}))});
 await mark('Floating echoes');await p.waitForTimeout(2500);
 await touch(p.locator('.synchronicity-memory').first());await mark('Select Anberlin');
 await p.waitForFunction(()=>document.querySelector('.synchronicity-show-artwork')?.dataset.imageKind==='poster');
 await p.screenshot({path:__dirname+'/selected-412x915.png'});await p.waitForTimeout(3500);
 await touch(p.getByRole('button',{name:'RETURN TO ECHOES',exact:true}));await mark('Return and resume');await p.waitForTimeout(4500);
 await touch(p.locator('.synchronicity-memory').nth(1));await mark('Select Burning Time');
 await p.waitForFunction(()=>document.querySelector('.synchronicity-show-artwork')?.dataset.imageKind==='poster');await p.waitForTimeout(3500);
 await touch(p.getByRole('button',{name:'RETURN TO ECHOES',exact:true}));await mark('Return again');await p.waitForTimeout(4500);
 await cdp.send('Page.stopScreencast');
 const metrics=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,shifts:__qa.shifts.filter(s=>!s.recent&&s.at>2000),timers:synchronicityMemoriesSession.results.filter(m=>m.timer).length,layers:synchronicityMemoriesSession.results.map(m=>m.frame.children.length),ids:synchronicityMemoriesSession.results.map(m=>m.id)}));
 assert.equal(metrics.overflow,0);assert.deepEqual(f.errors,[]);const requests=f.calls;await f.close();console.log('Captured mobile selection/return '+frames.length+' frames');
 const context=await browser.newContext(),output=await context.newPage();await output.setContent('<canvas width="412" height="915"></canvas>');
 const video=await output.evaluate(async frames=>{const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),stream=canvas.captureStream(0),track=stream.getVideoTracks()[0],mimeType=['video/webm;codecs=vp9','video/webm;codecs=vp8'].find(t=>MediaRecorder.isTypeSupported(t)),recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:3000000}),chunks=[],stopped=new Promise(r=>recorder.onstop=r);recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};const image=new Image();image.src='data:image/jpeg;base64,'+frames[0].data;await image.decode();ctx.drawImage(image,0,0,412,915);recorder.start();track.requestFrame();const began=performance.now(),first=frames[0].time;for(let i=1;i<frames.length;i++){image.src='data:image/jpeg;base64,'+frames[i].data;await image.decode();const wait=(frames[i].time-first)*1000-(performance.now()-began);if(wait>0)await new Promise(r=>setTimeout(r,wait));ctx.drawImage(image,0,0,412,915);track.requestFrame()}await new Promise(r=>setTimeout(r,100));recorder.stop();await stopped;stream.getTracks().forEach(t=>t.stop());return new Promise(r=>{const reader=new FileReader();reader.onload=()=>r(reader.result);reader.readAsDataURL(new Blob(chunks,{type:mimeType}))});},frames);
 fs.writeFileSync(__dirname+'/selection-return-412x915.webm',Buffer.from(video.split(',')[1],'base64'));
 fs.writeFileSync(__dirname+'/capture.json',JSON.stringify({seconds:frames.at(-1).time-frames[0].time,frames:frames.length,timeline,metrics,requests,evidence:'Local app with captured public Shows records and real SmugMug imagery; Chrome touch emulation, not a physical S25 device. No live Analytics.'},null,2));await context.close();console.log('Saved mobile recording');
 for(const[width,height]of[[360,800],[480,1040],[1920,1080],[915,412]]){
  const f=await setup(browser,{viewport:{width,height}}),p=f.page;await f.go();await p.waitForFunction(()=>synchronicityMemoriesSession?.stage.getAttribute('aria-busy')==='false');
  await p.screenshot({path:__dirname+'/echoes-'+width+'x'+height+'.png'});const b=await p.locator('.synchronicity-memory').first().boundingBox();await p.mouse.click(b.x+b.width/2,b.y+b.height/2);await p.waitForFunction(()=>document.querySelector('.synchronicity-show-artwork')?.dataset.imageKind==='poster');await p.screenshot({path:__dirname+'/selected-'+width+'x'+height+'.png'});if(height<500){await p.getByRole('button',{name:'RETURN TO ECHOES',exact:true}).scrollIntoViewIfNeeded();await p.screenshot({path:__dirname+'/selected-'+width+'x'+height+'-controls.png'})}await f.close();console.log('Screenshots '+width);
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
