
const fs=require('fs'),assert=require('node:assert/strict');
const {setup,chromium,synthetic}=require('../synch-s5/fixture.cjs');
const results=[];
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  for(const [width,height,safe]of[[360,800,false],[412,915,false],[480,1040,false],[1920,1080,false],[915,412,false],[812,375,false],[412,915,true],[915,412,true],[1920,800,false]]){
   const f=await setup(browser,{viewport:{width,height},safe,rows:synthetic(5)});
   try{
    const p=f.page;await f.go();
    await p.waitForFunction(()=>synchronicityMemoriesSession?.results.length>0&&synchronicityMemoriesSession.results.every(m=>m.next));
    await p.evaluate(()=>synchronicityMemoriesSession.setPaused(true));
    await p.waitForTimeout(50);
    const metrics=await p.evaluate(()=>{
     const stage=document.querySelector('.synchronicity-memories'),view=document.querySelector('.synchronicity-viewport');
     const box=n=>n.getBoundingClientRect().toJSON(),v=box(view),s=box(stage),controls=box(musicActivityPanel),engine=box(portfolioEngine);
     const frames=synchronicityMemoriesSession.results.map(m=>{
      const a=m.frame.getAnimations().find(a=>a.animationName==='synchronicity-memory-drift');
      const timing=a.effect.getTiming(),positions=[];
      for(let i=0;i<=120;i++){a.currentTime=timing.duration*i/120;positions.push(box(m.frame))}
      a.currentTime=0;
      return {duration:timing.duration,direction:timing.direction,minLeft:Math.min(...positions.map(x=>x.left)),maxRight:Math.max(...positions.map(x=>x.right)),minTop:Math.min(...positions.map(x=>x.top)),maxBottom:Math.max(...positions.map(x=>x.bottom)),horizontalRange:Math.max(...positions.map(x=>x.left))-Math.min(...positions.map(x=>x.left)),verticalRange:Math.max(...positions.map(x=>x.top))-Math.min(...positions.map(x=>x.top)),widths:[...new Set(positions.map(x=>x.width.toFixed(2)))],heights:[...new Set(positions.map(x=>x.height.toFixed(2)))]};
     });
     return {view:v,stage:s,controls,engine,frames,overflow:document.documentElement.scrollWidth-innerWidth,scrollWidth:view.scrollWidth,clientWidth:view.clientWidth,background:getComputedStyle(view).backgroundImage};
    });
    assert.equal(metrics.frames.length,width>=1000?5:3);
    assert.equal(metrics.overflow,0);assert.equal(metrics.scrollWidth,metrics.clientWidth);
    assert(metrics.engine.top-metrics.view.bottom>=15);
    assert.equal(new Set(metrics.frames.map(x=>x.duration)).size,metrics.frames.length);
    for(const m of metrics.frames){
     assert(m.duration>=12000&&m.duration<=16000);
     assert(m.minLeft>=metrics.stage.left-.1,JSON.stringify({size:[width,height],m}));
     assert(m.maxRight<=metrics.stage.right+.1);
     assert(m.minTop>=metrics.stage.top-.1);
     assert(m.maxBottom<=Math.min(metrics.controls.top,metrics.view.bottom)-1);
     assert(m.horizontalRange>=11.9&&m.horizontalRange<=16.1);
     assert(m.verticalRange>=25.9&&m.verticalRange<=40.1);
     assert(m.widths.length<=2&&m.heights.length<=2);
    }
    await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(50);
    const transforms=await p.locator('.synchronicity-memory').evaluateAll(ns=>ns.map(n=>getComputedStyle(n).transform));
    await p.waitForTimeout(250);
    assert.deepEqual(await p.locator('.synchronicity-memory').evaluateAll(ns=>ns.map(n=>getComputedStyle(n).transform)),transforms);
    await p.emulateMedia({reducedMotion:'no-preference'});await p.evaluate(()=>synchronicityMemoriesSession.setPaused(false));
    const count=f.calls.length;
    await p.locator('[data-music-shows-filter="search"]').fill('S5 test performance 1');await p.waitForTimeout(200);assert.equal(await p.locator('.music-show-card').count(),1);
    await p.getByRole('button',{name:'Reset Filters',exact:true}).click();assert.equal(f.calls.length,count);
    await p.evaluate(()=>navigateToRoute('/music/bands'));assert.equal(await p.locator('.synchronicity-memory').count(),0);
    await p.goBack();await p.waitForFunction(()=>synchronicityMemoriesSession?.results.length>0);
    assert.deepEqual(f.errors,[]);
    results.push({size:[width,height],safe,passed:true,metrics});console.log('PASS '+width+'x'+height+(safe?' safe':''));
   }catch(e){results.push({size:[width,height],safe,passed:false,error:e.stack});console.log('FAIL '+width+'x'+height+' '+e.message)}
   finally{await f.close()}
   fs.writeFileSync(__dirname+'/qa.json',JSON.stringify(results,null,2));
  }
 }finally{await browser.close()}
 if(results.some(x=>!x.passed))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
