const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const {endpoint,readyPayload,payload,fulfillCalendar}=require('./fixtures/calendar.cjs');
const sizes=[{width:360,height:800},{width:412,height:915},{width:915,height:412},{width:1920,height:1080}];
const qa=new WeakMap();
test.beforeEach(async({page,context,baseURL})=>{
  const state={errors:[],submissions:[],respond:route=>fulfillCalendar(route)};qa.set(page,state);
  page.on('pageerror',error=>state.errors.push(error.message));
  await context.route('**/*',route=>{
    const req=route.request(),url=new URL(req.url());
    if(req.method()!=='GET'&&req.method()!=='HEAD'){state.submissions.push(url.pathname);return route.abort();}
    if(req.url()===endpoint)return state.respond(route);
    if(url.origin===new URL(baseURL).origin&&!url.pathname.startsWith('/api/')||['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname)||url.hostname==='unpkg.com'&&url.pathname.startsWith('/leaflet@1.9.4/dist/'))return route.continue();
    if(req.resourceType()==='script')return route.fulfill({contentType:'application/javascript',body:''});
    if(req.resourceType()==='stylesheet')return route.fulfill({contentType:'text/css',body:''});
    return route.fulfill({status:503,headers:{'access-control-allow-origin':'*'},contentType:'application/json',body:'{}'});
  });
  await page.goto('/portfolio',{waitUntil:'domcontentloaded'});
  const reject=page.getByRole('button',{name:'Reject',exact:true});if(await reject.isVisible())await reject.click();
});
test.afterEach(async({page})=>{expect(qa.get(page).errors).toEqual([]);expect(qa.get(page).submissions).toEqual([]);});
async function evidence(page,name){
  if(!process.env.OVERLAY_EVIDENCE_DIR)return;
  await page.evaluate(()=>document.fonts.ready);fs.mkdirSync(process.env.OVERLAY_EVIDENCE_DIR,{recursive:true});
  await page.screenshot({path:path.join(process.env.OVERLAY_EVIDENCE_DIR,name+'.png')});
}
async function world(page){
  await page.evaluate(()=>{window.__alignmentWorld={route:shellRenderedRoute,context:v3RouteContext,engine:portfolioEngine,
    scroll:[...getV3ResumeScrollers(shellRenderedRoute).values()].filter(Boolean).map(node=>({node,top:node.scrollTop,left:node.scrollLeft}))};});
}
async function restored(page){
  expect(await page.evaluate(()=>{const s=window.__alignmentWorld;return s.route===shellRenderedRoute&&s.context===v3RouteContext&&s.engine===portfolioEngine&&s.scroll.every(({node,top,left})=>Math.abs(node.scrollTop-top)<2&&Math.abs(node.scrollLeft-left)<2);})).toBe(true);
}
async function center(page,selector,reference){
  const result=await page.locator(selector).evaluateAll((nodes,ref)=>{
    const bounds=document.querySelector(ref).getBoundingClientRect(),axis=bounds.x+bounds.width/2;
    return nodes.filter(el=>el.getClientRects().length).map(el=>{const r=el.getBoundingClientRect();return {offset:Math.abs(r.x+r.width/2-axis),align:getComputedStyle(el).textAlign};});
  },reference);
  expect(result.length,selector).toBeGreaterThan(0);
  for(const item of result)expect(item.offset,selector).toBeLessThanOrEqual(2);
}
async function noOverflow(page,overlay){
  expect(await page.locator(overlay).evaluate(el=>[document.documentElement,el,...el.querySelectorAll('*')].some(node=>node.clientWidth>0&&node.scrollWidth>node.clientWidth+1))).toBe(false);
}
for(const viewport of sizes)for(const reducedMotion of ['reduce','no-preference'])test.describe(`Overlay alignment ${viewport.width}x${viewport.height} ${reducedMotion}`,()=>{
  test.use({viewport,contextOptions:{reducedMotion},serviceWorkers:'block'});
  test('incident is centered and the enabled emitter entry restores Portfolio, Music and Wrestling',async({page})=>{
    for(const source of ['/portfolio','/music','/wrestling']){
      await page.goto(source,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>canOpenIncident());await world(page);
      await expect(page.locator('[data-shell-menu-toggle]')).toBeEnabled({timeout:15000});await page.locator('[data-shell-menu-toggle]').click();
      const link=page.getByRole('link',{name:'Report an Issue',exact:true});
      await expect(link).toBeVisible();await expect(link).toBeEnabled();await expect(link).toHaveAttribute('href','/report-issue');
      await expect(link).not.toHaveAttribute('disabled');await expect(link).not.toHaveAttribute('aria-disabled','true');
      const appearance=await link.evaluate(el=>({disabled:el.matches(':disabled'),opacity:getComputedStyle(el).opacity,pointerEvents:getComputedStyle(el).pointerEvents,color:getComputedStyle(el).color,parentColor:getComputedStyle(el.parentElement).color}));
      expect(appearance).toMatchObject({disabled:false,opacity:'1',pointerEvents:'auto'});expect(appearance.color).toBe(appearance.parentColor);
      if(source==='/portfolio'&&reducedMotion==='no-preference'){
        await page.locator('[data-shell-menu-panel]').evaluate(el=>Promise.all(el.getAnimations().map(animation=>animation.finished.catch(()=>{}))));
        await evidence(page,`menu-enabled--${viewport.width}x${viewport.height}`);
      }
      await link.click();await expect(page).toHaveURL(/\/report-issue$/);await expect(page.locator('[data-incident-overlay]')).toHaveAttribute('data-state','open');
      await center(page,'#incident-title, .incident-terminal__subtitle, .incident-terminal__viewport','[data-incident-frame]');
      await center(page,'.incident-terminal__mark, #incident-description, .incident-terminal__launch, .incident-terminal__note, .incident-terminal__return','[data-incident-scroll]');
      const status=await page.locator('.incident-terminal__channel').evaluate(el=>{const a=el.firstElementChild.getBoundingClientRect(),b=el.lastElementChild.getBoundingClientRect(),r=el.getBoundingClientRect();return Math.abs((a.left+b.right)/2-(r.left+r.width/2));});
      expect(status).toBeLessThanOrEqual(2);
      expect(await page.locator('[data-incident-scroll]').evaluate(el=>[...el.querySelectorAll('p')].every(p=>getComputedStyle(p).textAlign==='center'))).toBe(true);
      await noOverflow(page,'[data-incident-overlay]');
      if(source==='/portfolio'&&reducedMotion==='no-preference'){
        await page.locator('[data-incident-close]').focus();await page.locator('[data-incident-scroll]').evaluate(el=>el.scrollTop=0);await evidence(page,`incident--${viewport.width}x${viewport.height}`);
        await page.locator('[data-incident-launch]').focus();await evidence(page,`incident-action--${viewport.width}x${viewport.height}`);
      }
      if(source==='/portfolio')await page.locator('[data-incident-close]').click();
      else if(source==='/music')await page.keyboard.press('Escape');
      else {await page.locator('[data-prototype-engine-return]').focus();await page.keyboard.press('Enter');}
      await expect(page).toHaveURL(new RegExp(source+'$'));await expect(page.locator('[data-incident-overlay]')).toBeHidden();await restored(page);
      await page.goForward();await expect(page.locator('[data-incident-overlay]')).toHaveAttribute('data-state','open');
      await page.goBack();await expect(page.locator('[data-incident-overlay]')).toBeHidden();await restored(page);
    }
  });
  test('Calendar centers complete event cards and its loading, empty, unavailable and Retry states',async({page})=>{
    let release;const gate=new Promise(resolve=>{release=resolve;});
    qa.get(page).respond=async route=>{await gate;return fulfillCalendar(route,readyPayload());};
    await page.goto('/calendar',{waitUntil:'domcontentloaded'});await expect(page.locator('[data-calendar-overlay]')).toHaveAttribute('data-state','open');
    await expect(page.locator('[data-calendar-scroll]')).toHaveAttribute('data-calendar-state','loading');
    await center(page,'#calendar-modal-title, [data-calendar-scroll]','[data-calendar-frame]');await center(page,'[data-calendar-status]','[data-calendar-scroll]');
    release();await expect(page.locator('[data-calendar-scroll]')).toHaveAttribute('data-calendar-state','ready');
    await center(page,'[data-calendar-timezone], .calendar-gig','[data-calendar-scroll]');
    const cards=page.locator('.calendar-gig');await expect(cards).toHaveCount(6);
    const geometry=await cards.evaluateAll(nodes=>nodes.map(card=>{const r=card.getBoundingClientRect(),axis=r.x+r.width/2,date=card.querySelector('.calendar-gig__date').getBoundingClientRect(),copy=card.querySelector('.calendar-gig__copy').getBoundingClientRect();return {dateOffset:Math.abs(date.x+date.width/2-axis),copyOffset:Math.abs(copy.x+copy.width/2-axis),stacked:date.bottom<=copy.top,childOffset:Math.max(...[...card.querySelectorAll('h3,p')].map(el=>{const b=el.getBoundingClientRect();return Math.abs(b.x+b.width/2-axis);})),centered:[...card.querySelectorAll('h3,p')].every(el=>getComputedStyle(el).textAlign==='center')};}));
    for(const card of geometry){expect(card.dateOffset).toBeLessThanOrEqual(2);expect(card.copyOffset).toBeLessThanOrEqual(2);expect(card.stacked).toBe(true);expect(card.centered).toBe(true);expect(card.childOffset).toBeLessThanOrEqual(2);}
    await expect(cards.first().locator('h3')).toHaveText('All-day festival');await expect(cards.first().locator('.calendar-gig__time')).toHaveText('All day');
    await noOverflow(page,'[data-calendar-overlay]');
    const frame=await page.locator('[data-calendar-frame]').boundingBox();
    await page.locator('[data-calendar-scroll]').focus();await page.keyboard.press('Control+End');await expect(cards.last()).toBeInViewport();
    const after=await page.locator('[data-calendar-frame]').boundingBox();expect(after.y).toBeCloseTo(frame.y,0);expect(after.height).toBeCloseTo(frame.height,0);
    if(reducedMotion==='no-preference'){await page.locator('[data-calendar-close]').focus();await page.locator('[data-calendar-scroll]').evaluate(el=>el.scrollTop=0);await evidence(page,`calendar-ready--${viewport.width}x${viewport.height}`);}
    await page.keyboard.press('Escape');await expect(page.locator('[data-calendar-overlay]')).toBeHidden();
    qa.get(page).respond=route=>fulfillCalendar(route,{error:'unavailable'},503);
    await page.goto('/calendar',{waitUntil:'domcontentloaded'});await expect(page.locator('[data-calendar-scroll]')).toHaveAttribute('data-calendar-state','unavailable');
    await center(page,'[data-calendar-status], [data-calendar-retry]','[data-calendar-scroll]');await expect(page.locator('.calendar-gig')).toHaveCount(0);
    qa.get(page).respond=route=>fulfillCalendar(route,payload([]));await page.getByRole('button',{name:'Retry',exact:true}).click();
    await expect(page.locator('[data-calendar-scroll]')).toHaveAttribute('data-calendar-state','empty');await center(page,'[data-calendar-status]','[data-calendar-scroll]');
    await noOverflow(page,'[data-calendar-overlay]');
  });
});
