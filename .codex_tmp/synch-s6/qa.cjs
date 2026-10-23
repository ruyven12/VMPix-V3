const fs=require('fs'),assert=require('node:assert/strict');
const {setup,chromium,synthetic,rows,front}=require('../synch-s5/fixture.cjs');
const results=[];
async function ready(f){await f.go();await f.page.waitForFunction(()=>synchronicityMemoriesSession?.stage.getAttribute('aria-busy')==='false');}
async function choose(p,index=0){const b=await p.locator('.synchronicity-memory').nth(index).boundingBox();await p.mouse.click(b.x+b.width/2,b.y+b.height/2);}
async function leave(p){await p.getByRole('button',{name:'RETURN TO ECHOES',exact:true}).click();}
const selected=()=>({id:synchronicityMemoriesSession.selection?.id,title:document.querySelector('.synchronicity-show-title')?.textContent,motion:synchronicityMemoriesSession.stage.dataset.memoryMotion,timers:synchronicityMemoriesSession.results.filter(m=>m.timer).length,inert:synchronicityMemoriesSession.results.every(m=>m.frame.inert),hidden:synchronicityMemoriesSession.results.every(m=>getComputedStyle(m.frame).visibility==='hidden'),panels:document.querySelectorAll('.synchronicity-show').length,overflow:document.documentElement.scrollWidth-innerWidth});
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
async function run(name,fn){try{const detail=await fn();results.push({name,passed:true,...detail});console.log('PASS '+name)}catch(e){results.push({name,passed:false,error:e.stack});console.log('FAIL '+name+' '+e.message)}fs.writeFileSync(__dirname+'/qa.json',JSON.stringify(results,null,2))}
for(const[width,height,safe]of[[360,800,false],[412,915,false],[480,1040,false],[1920,1080,false],[915,412,false],[412,915,true],[915,412,true]]){
await run(width+'x'+height+(safe?' safe':''),async()=>{
 const f=await setup(browser,{viewport:{width,height},safe,rows:synthetic(5)});
 try{const p=f.page;await ready(f);const count=width>=1000?5:3;assert.equal(await p.locator('.synchronicity-memory').count(),count);
 const before=await p.evaluate(()=>synchronicityMemoriesSession.results.map(m=>({id:m.id,node:m.frame.tagName,ratio:m.frame.offsetWidth/m.frame.offsetHeight})));
 const entries=[];
 for(let i=0;i<count;i++){
  await choose(p,i);const s=await p.evaluate(selected);assert.equal(s.id,before[i].id);assert.equal(s.title,'S5 test performance '+i);assert.equal(s.motion,'paused');assert.equal(s.timers,0);assert(s.inert&&s.hidden);assert.equal(s.panels,1);assert.equal(s.overflow,0);
  await p.evaluate(()=>synchronicityMemoriesSession.results.at(-1).frame.click());assert.equal((await p.evaluate(selected)).id,s.id);
  const metrics=await p.evaluate(()=>{
    const v=document.querySelector('.synchronicity-viewport'),a=document.querySelector('.synchronicity-show-artwork'),box=n=>n.getBoundingClientRect().toJSON();
    return{view:box(v),engine:box(portfolioEngine),artwork:box(a),imageFit:getComputedStyle(a.firstChild).objectFit,scrollWidth:v.scrollWidth,clientWidth:v.clientWidth,buttons:[...document.querySelectorAll('.synchronicity-show-actions button')].map(box),nested:[...document.querySelector('.synchronicity-show').querySelectorAll('*')].filter(n=>['auto','scroll'].includes(getComputedStyle(n).overflowY)).length};
  });
  assert.equal(metrics.scrollWidth,metrics.clientWidth);assert(metrics.engine.top-metrics.view.bottom>=15);assert.equal(metrics.nested,0);assert.equal(metrics.imageFit,'contain');assert(metrics.buttons.every(b=>b.height>=44&&b.width>=44));
  await p.getByRole('button',{name:'RETURN TO ECHOES',exact:true}).scrollIntoViewIfNeeded();assert(await p.getByRole('button',{name:'RETURN TO ECHOES',exact:true}).isVisible());
  await leave(p);assert.equal(await p.locator('.synchronicity-show').count(),0);assert.equal(await p.evaluate(()=>synchronicityMemoriesSession.selection),null);assert.equal(await p.evaluate(()=>document.activeElement.dataset.memoryShowId),s.id);
  entries.push({id:s.id,metrics});
 }
 // Native keyboard activation and focus indication.
 await p.locator('.synchronicity-memory').first().focus();await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.dataset.memoryShowId),before[1].id);
 const focus=await p.evaluate(()=>({visible:document.activeElement.matches(':focus-visible'),shadow:getComputedStyle(document.activeElement).boxShadow}));assert(focus.visible&&focus.shadow!=='none');
 await p.keyboard.press('Enter');assert.equal((await p.evaluate(selected)).id,before[1].id);await leave(p);
 await p.keyboard.press('Space');assert.equal((await p.evaluate(selected)).id,before[1].id);await leave(p);
 // Search/filter rerender preserves the scene and selected stable ID.
 await choose(p,0);const id=(await p.evaluate(selected)).id;
 await p.locator('[data-music-shows-filter="search"]').fill('S5 test performance 1');await p.waitForFunction(()=>document.querySelectorAll('.music-show-card').length===1);assert.equal(await p.locator('.music-show-card').count(),1);assert.equal((await p.evaluate(selected)).id,id);
 await p.getByRole('button',{name:'Reset Filters',exact:true}).click();assert.equal(await p.locator('.music-show-card').count(),5);
 await leave(p);
 await p.emulateMedia({reducedMotion:'reduce'});await choose(p,0);await leave(p);assert.equal(await p.evaluate(()=>synchronicityMemoriesSession.stage.dataset.memoryMotion),'paused');
 const transforms=await p.locator('.synchronicity-memory').evaluateAll(ns=>ns.map(n=>getComputedStyle(n).transform));await p.waitForTimeout(150);assert.deepEqual(await p.locator('.synchronicity-memory').evaluateAll(ns=>ns.map(n=>getComputedStyle(n).transform)),transforms);
 assert.deepEqual(f.errors,[]);return{entries,focus,requests:f.calls};
 }finally{await f.close()}
});
}
await run('Actual records: poster, all memory identities, Enter Archive and Back',async()=>{
 const f=await setup(browser,{viewport:{width:412,height:915}});try{const p=f.page;await ready(f);const observed=[];
 for(let i=0;i<3;i++){await choose(p,i);await p.waitForFunction(()=>document.querySelector('.synchronicity-show-artwork')?.dataset.imageKind==='poster');const data=await p.evaluate(()=>{const m=synchronicityMemoriesSession.selection.memory;return{id:m.id,title:document.querySelector('.synchronicity-show-title').textContent,bands:[...document.querySelectorAll('.synchronicity-show-bands li')].map(n=>n.textContent),route:getMusicShowRouteUrl(m.show),poster:document.querySelector('.synchronicity-show-artwork img').src}});const row=rows.find(s=>String(s.show_id)===data.id);assert.equal(data.title,row.name);assert.deepEqual(data.bands,row.bands.map(b=>b.band));assert.equal(data.poster,row.poster);observed.push(data);await leave(p)}
 await choose(p,0);const route=observed[0].route;await p.getByRole('button',{name:'ENTER ARCHIVE',exact:true}).click();await p.waitForURL(front+route);await p.waitForFunction(()=>document.body.dataset.v3Route==='music-show-detail'||document.querySelector('[data-synchronicity-viewport]').hidden);assert.equal(await p.evaluate(()=>synchronicityMemoriesSession),null);assert((await p.locator('body').innerText()).includes(observed[0].title));
 await p.goBack();await p.waitForFunction(()=>synchronicityMemoriesSession?.stage.getAttribute('aria-busy')==='false');assert.equal(new URL(p.url()).pathname,'/music/shows');assert.equal(await p.locator('.synchronicity-show').count(),0);assert.equal(await p.locator('.synchronicity-memory').count(),3);assert.deepEqual(f.errors,[]);return{observed,requests:f.calls};
 }finally{await f.close()}
});
await run('Pause, resume, rapid selection and bounded timers',async()=>{
 const f=await setup(browser,{viewport:{width:412,height:915},rows:synthetic(3)});try{const p=f.page;await ready(f);await p.waitForFunction(()=>synchronicityMemoriesSession.results.every(m=>m.next));await p.waitForFunction(()=>synchronicityMemoriesSession.results.some(m=>m.fade),{timeout:15000});await choose(p,0);await p.waitForTimeout(60);
 const before=await p.evaluate(()=>synchronicityMemoriesSession.results.map(m=>({src:m.image.src,fade:m.fade?.currentTime,transform:getComputedStyle(m.frame).transform})));await p.waitForTimeout(12000);assert.deepEqual(await p.evaluate(()=>synchronicityMemoriesSession.results.map(m=>({src:m.image.src,fade:m.fade?.currentTime,transform:getComputedStyle(m.frame).transform}))),before);
 const requests=f.calls.length;for(let i=0;i<25;i++){await leave(p);await choose(p,i%3)}assert.equal(f.calls.length,requests);await leave(p);await p.waitForFunction(()=>synchronicityMemoriesSession.results.some(m=>!m.image.src.endsWith('/0.jpg')));const timers=await p.evaluate(()=>synchronicityMemoriesSession.results.map(m=>({timer:Boolean(m.timer),fade:!!m.fade,layers:m.frame.children.length,photos:m.sources.length})));assert(timers.every(m=>m.layers<=2&&!(m.timer&&m.fade)&&m.photos<=4));assert(f.calls.every(c=>c.limit<=3));assert.equal(f.calls.length,6);assert.deepEqual(f.errors,[]);return{timers,requests:f.calls};
 }finally{await f.close()}
});
for(const mode of ['missing','failed','slow','empty','outage','single','poster-only']){
await run('Fallback '+mode,async()=>{
 let r=synthetic(3);if(mode==='missing'){r[0]={...r[0],name:'',date:null,city:'',state:'',venue:'',venue_id:null,venue_details:null,bands:[]}}
 if(['failed','slow'].includes(mode))r[0].poster=front+'/s6-test/poster.jpg';
 if(mode==='empty')r=[];
 if(mode==='poster-only')r=r.map((s,i)=>({...s,smug_albums:[],poster:front+'/s5-test/S5QA'+i+'/0.jpg'}));
 const f=await setup(browser,{viewport:{width:360,height:800},rows:r,showError:mode==='outage',single:mode==='single'});
 try{const p=f.page;let release;const gate=new Promise(res=>release=res);
 if(['failed','slow'].includes(mode))await f.context.route(front+'/s6-test/poster.jpg',async route=>{if(mode==='slow')await gate;try{await route.abort()}catch{}});
 if(mode==='outage'){await f.go();await p.waitForTimeout(1500);assert.equal(await p.locator('.synchronicity-memory').count(),0);assert.equal(await p.locator('.synchronicity-show').count(),0);return{state:'No memories; existing archive error/retry retained'}}
 if(mode==='empty'){await f.go();await p.waitForTimeout(500);assert.equal(await p.locator('.synchronicity-memory').count(),0);return{state:'No memories or empty frames'}}
 await ready(f);await choose(p,mode==='missing'?await p.evaluate(()=>synchronicityMemoriesSession.results.findIndex(m=>m.id==='9500')):0);const state=await p.evaluate(selected);assert.equal(state.overflow,0);
 if(mode==='missing'){const text=await p.locator('.synchronicity-show').innerText();assert(text.includes('Show name unavailable')&&text.includes('Venue Pending')&&text.includes('Band information unavailable'));return{text}}
 if(mode==='failed'){await p.waitForTimeout(100);assert.equal(await p.locator('.synchronicity-show-artwork').getAttribute('data-image-kind'),'photo')}
 if(mode==='slow'){await leave(p);await choose(p,1);release();await p.waitForTimeout(200);assert.equal((await p.evaluate(selected)).id,'9501');assert.equal(await p.locator('.synchronicity-show-artwork').getAttribute('data-image-kind'),'photo');await p.evaluate(()=>navigateToRoute('/music/bands'));assert.equal(await p.locator('.synchronicity-show').count(),0)}
 if(mode==='single'||mode==='poster-only'){await leave(p);assert.equal(await p.locator('[data-memory-living="true"]').count(),0)}
 assert.deepEqual(f.errors,[]);return{state,requests:f.calls};
 }finally{await f.close()}
});
}
await run('Long values wrap without overflow',async()=>{const r=synthetic(3);r[0]={...r[0],name:'A documented performance with a very long title '.repeat(6),venue:'LongVenue'.repeat(25),city:'LongCity'.repeat(25),state:'Maine',venue_details:null,bands:Array.from({length:12},(_,i)=>({band:'Documented performing band '+i}))};const f=await setup(browser,{viewport:{width:360,height:800},rows:r});try{await ready(f);await choose(f.page,0);assert.equal((await f.page.evaluate(selected)).overflow,0);await f.page.getByRole('button',{name:'RETURN TO ECHOES',exact:true}).scrollIntoViewIfNeeded();await leave(f.page);assert.deepEqual(f.errors,[]);return{wrapped:true}}finally{await f.close()}});
}finally{await browser.close()}if(results.some(r=>!r.passed))process.exitCode=1;})().catch(e=>{console.error(e);process.exitCode=1});


