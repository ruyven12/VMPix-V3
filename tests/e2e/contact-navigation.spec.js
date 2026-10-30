const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const sizes = [{width:360,height:800},{width:412,height:915},{width:1920,height:1080}];
const errors = new WeakMap();
test.beforeEach(async ({page,context,baseURL}) => {
  errors.set(page, []);
  page.on('pageerror', e => errors.get(page).push(e.message));
  // No production API, analytics or mail request leaves the browser.
  await context.route('**/*', route => {
    const request=route.request(), url=new URL(request.url());
    if (!url.pathname.startsWith('/api/') && (url.origin===new URL(baseURL).origin ||
        ['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname) ||
        url.hostname==='unpkg.com' && url.pathname.startsWith('/leaflet@1.9.4/dist/'))) return route.continue();
    if(request.resourceType()==='script') return route.fulfill({contentType:'application/javascript',body:''});
    if(request.resourceType()==='stylesheet') return route.fulfill({contentType:'text/css',body:''});
    return route.fulfill({status:503,headers:{'access-control-allow-origin':'*'},contentType:'application/json',body:'{"error":"Isolated Contact QA"}'});
  });
  await page.goto('/portfolio',{waitUntil:'domcontentloaded'});
  const reject=page.getByRole('button',{name:'Reject',exact:true});
  if(await reject.isVisible()) await reject.click();
});
test.afterEach(async ({page}) => expect(errors.get(page)).toEqual([]));

async function opened(page) {
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole('dialog',{name:'OPEN A CHANNEL'})).toBeVisible();
  await expect(page.locator('[data-contact-overlay]')).toHaveAttribute('data-state','open');
  await expect(page.locator('[data-contact-overlay]')).toHaveAttribute('aria-modal','false');
  await expect(page.locator('[data-contact-status]')).toHaveText('Terminal open');
  await expect(page.locator('[data-contact-shell], [data-contact-static-action]')).toHaveCount(0);
}
async function closed(page, route='/portfolio') {
  await expect(page).toHaveURL(new RegExp(route+'$'));
  await expect(page.locator('[data-contact-overlay]')).toBeHidden();
}
async function clickEngineBack(page) {
  // The approved Engine energy animation keeps its bounds moving slightly.
  // Use a real pointer hit instead of Playwright's stationary-element wait.
  const back=page.locator('[data-prototype-engine-return]');
  await expect(back).toBeVisible(); await expect(back).toBeEnabled();
  const point=await back.evaluate(el=>{const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};});
  expect(await back.evaluate((el,p)=>el.contains(document.elementFromPoint(p.x,p.y)),point)).toBe(true);
  await page.mouse.click(point.x,point.y);
}
async function menuOpen(page) {
  await expect(page.locator('[data-shell-menu-toggle]')).toBeEnabled({timeout:15000});
  await page.locator('[data-shell-menu-toggle]').click();
  await page.locator('[data-shell-menu-route="contact"]').click();
  await opened(page);
}
async function remember(page) {
  await page.evaluate(()=>{
    window.__contactSource={route:shellRenderedRoute,context:v3RouteContext,engine:portfolioEngine,title:document.title,
      scroll:[...getV3ResumeScrollers(shellRenderedRoute).values()].filter(Boolean).map(node=>({node,top:node.scrollTop,left:node.scrollLeft}))};
  });
}
async function preserved(page) {
  expect(await page.evaluate(()=>{
    const s=window.__contactSource;
    return s.route===shellRenderedRoute && s.context===v3RouteContext && s.engine===portfolioEngine &&
      s.scroll.every(({node,top,left})=>Math.abs(node.scrollTop-top)<2 && Math.abs(node.scrollLeft-left)<2);
  })).toBe(true);
}

for(const viewport of sizes) for(const reducedMotion of ['reduce','no-preference']) {
  test.describe(`Contact ${viewport.width}x${viewport.height} ${reducedMotion}`,()=>{
    test.use({viewport,contextOptions:{reducedMotion},serviceWorkers:'block'});
    test('direct entry, refresh and all return controls',async({page})=>{
      await page.goto('/contact',{waitUntil:'domcontentloaded'}); await opened(page);
      await expect(page.locator('[data-contact-close]')).toBeFocused();
      await page.reload({waitUntil:'domcontentloaded'}); await opened(page);
      const length=await page.evaluate(()=>history.length);
      await clickEngineBack(page); await closed(page);
      expect(await page.evaluate(()=>history.length)).toBe(length);
      await expect(page.locator('[data-shell-menu-toggle]')).toBeFocused();
      await remember(page); await menuOpen(page); await preserved(page);
      await page.locator('[data-contact-close]').click(); await closed(page); await preserved(page);
      await page.goForward(); await opened(page);
      await page.goBack(); await closed(page); await preserved(page);
      await page.goForward(); await opened(page);
      await page.keyboard.press('Escape'); await closed(page); await preserved(page);
      await page.goForward(); await opened(page);
      await clickEngineBack(page); await closed(page); await preserved(page);
      await expect(page.locator('[data-shell-menu-toggle]')).toBeFocused();
    });
    test('focus boundary, inactive world, layout and single scrolling viewport',async({page})=>{
      await page.goto('/contact',{waitUntil:'domcontentloaded'}); await opened(page);
      await page.evaluate(()=>document.fonts.ready);
      const close=page.locator('[data-contact-close]'), scroll=page.locator('[data-contact-scroll]'), back=page.locator('[data-prototype-engine-return]');
      await page.keyboard.press('Tab'); await expect(scroll).toBeFocused();
      for (const selector of ['#contact-name','#contact-email','#contact-subject','#contact-message','[data-contact-submit]',
        '[data-contact-channel="email"]','[data-contact-channel="instagram"]','[data-contact-channel="facebook"]','[data-contact-channel="x"]']) {
        await page.keyboard.press('Tab'); await expect(page.locator(selector)).toBeFocused();
        expect(await page.locator(selector).evaluate(el=>{const a=el.getBoundingClientRect(),b=document.querySelector('[data-contact-scroll]').getBoundingClientRect();return a.bottom>b.top && a.top<b.bottom;})).toBe(true);
      }
      await page.keyboard.press('Tab'); await expect(back).toBeFocused();
      await page.keyboard.press('Tab'); await expect(close).toBeFocused();
      await page.keyboard.press('Shift+Tab'); await expect(back).toBeFocused();
      await page.locator('[data-shell-menu-toggle]').evaluate(el=>el.focus()); await expect(back).toBeFocused();
      const layout=await page.evaluate(()=>{
        const overlay=contactOverlay, frame=contactFrame, close=contactClose, back=prototypeEngineReturnControl;
        return {frame:frame.getBoundingClientRect().toJSON(),close:close.getBoundingClientRect().toJSON(),engine:portfolioEngine.getBoundingClientRect().toJSON(),
          overflow:[document.documentElement,overlay,frame,overlay.querySelector('[data-contact-scroll]')].some(el=>el.scrollWidth>el.clientWidth+1),
          inert:contactSession.surfaces.every(({node})=>node.inert),backInert:!!back.closest('[inert]'),
          nativeModal:overlay.matches(':modal'),frameHeight:frame.offsetHeight};
      });
      expect(layout.inert).toBe(true); expect(layout.backInert).toBe(false); expect(layout.nativeModal).toBe(false); expect(layout.overflow).toBe(false);
      expect(layout.frame.x).toBeGreaterThanOrEqual(12); expect(layout.frame.right).toBeLessThanOrEqual(viewport.width-12);
      expect(layout.frame.y).toBeCloseTo(20, 0);
      expect(layout.engine.top-layout.frame.bottom).toBeCloseTo(20, 0);
      expect(layout.frame.height).toBeCloseTo(layout.engine.top-40, 0);
      expect(layout.close.width).toBeGreaterThanOrEqual(44); expect(layout.close.height).toBeGreaterThanOrEqual(44);
      if(process.env.CONTACT_EVIDENCE_DIR && reducedMotion==='no-preference'){
        fs.mkdirSync(process.env.CONTACT_EVIDENCE_DIR,{recursive:true});
        await close.focus();
        await scroll.evaluate(el=>el.scrollTop=0);
        await page.screenshot({path:path.join(process.env.CONTACT_EVIDENCE_DIR,`contact--${viewport.width}x${viewport.height}.png`)});
      }
      // Exercise overflow even on desktop without adding fixture content to the application.
      await scroll.evaluate(el=>{const p=document.createElement('p');p.dataset.qaOverflow='';p.textContent='Terminal reading area. '.repeat(180);el.append(p);});
      await scroll.focus(); await page.keyboard.press('PageDown');
      await expect.poll(()=>scroll.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
      // Chrome animates keyboard scrolling even under reduced-motion emulation.
      // Let that gesture settle before sending a separate wheel gesture.
      await scroll.evaluate(el=>new Promise(resolve=>{
        let previous=-1, stable=0;
        const sample=()=>{stable=el.scrollTop===previous?stable+1:0;previous=el.scrollTop;
          if(stable>=5)resolve();else requestAnimationFrame(sample);};
        sample();
      }));
      const bounds=await scroll.boundingBox();await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.wheel(0,await scroll.evaluate(el=>el.scrollHeight*2));
      await expect.poll(()=>scroll.evaluate(el=>Math.abs(el.scrollHeight-el.clientHeight-el.scrollTop))).toBeLessThan(2);
      // Only content moves: the full-height frame stays anchored above the Engine.
      const afterScroll=await page.locator('[data-contact-frame]').boundingBox();
      expect(afterScroll.y).toBeCloseTo(layout.frame.y, 0);
      expect(afterScroll.height).toBeCloseTo(layout.frame.height, 0);
      await scroll.locator('[data-qa-overflow]').evaluate(el=>el.remove());
      await page.setViewportSize({width:viewport.width,height:480});
      await expect.poll(()=>page.evaluate(()=>Math.abs(portfolioEngine.getBoundingClientRect().top-contactFrame.getBoundingClientRect().bottom-20))).toBeLessThan(1);
      await expect.poll(()=>scroll.evaluate(el=>el.clientHeight)).toBeGreaterThan(44);
      await page.setViewportSize(viewport);
      // Simulate an offset/shrunken visual viewport independently of layout height.
      // This covers the measurement contract; it is not physical keyboard/device QA.
      await page.evaluate(()=>{
        Object.defineProperties(visualViewport,{offsetTop:{configurable:true,value:48},height:{configurable:true,value:280}});
        visualViewport.dispatchEvent(new Event('resize'));
      });
      await expect.poll(()=>page.locator('[data-contact-frame]').evaluate(el=>el.getBoundingClientRect().top)).toBeCloseTo(68, 0);
      await expect.poll(()=>page.locator('[data-contact-frame]').evaluate(el=>el.getBoundingClientRect().bottom)).toBeCloseTo(308, 0);
      await expect.poll(()=>scroll.evaluate(el=>el.clientHeight)).toBeGreaterThan(44);
      expect(await close.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=48 && r.bottom<=328;})).toBe(true);
      expect(await scroll.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
      await page.evaluate(()=>{delete visualViewport.offsetTop;delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));});
      await expect.poll(()=>page.locator('[data-contact-frame]').evaluate(el=>el.getBoundingClientRect().top)).toBeCloseTo(20, 0);
      await back.focus();await page.keyboard.press('Enter');await closed(page);
    });
    test('source scroll, route state and focus survive opening and history interruption',async({page})=>{
      await page.goto('/privacy',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>canOpenContact());
      await page.locator('[data-privacy-shell]').evaluate(el=>el.scrollTop=180);
      await expect.poll(()=>page.locator('[data-privacy-shell]').evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
      await remember(page);await menuOpen(page);await preserved(page);
      await clickEngineBack(page);await closed(page,'/privacy');await preserved(page);
      await page.goForward();await opened(page);
      await page.reload({waitUntil:'domcontentloaded'});await opened(page);
      await page.keyboard.press('Escape');await closed(page); // refresh deliberately uses Portfolio
      await menuOpen(page);
      await page.goBack();await page.goForward();await opened(page);
      await page.keyboard.press('Escape');await closed(page);
    });
    test('approved timing and interruption settle cleanly',async({page})=>{
      expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(reducedMotion==='reduce');
      await page.waitForFunction(()=>canOpenContact());
      const opening=await page.evaluate(()=>{navigateToRoute('/contact');return contactAnimation?.effect.getComputedTiming().duration ?? 0;});
      expect(opening).toBe(reducedMotion==='reduce'?0:420);
      await opened(page);
      await page.goBack();
      if(reducedMotion==='no-preference') {
        expect(await page.evaluate(()=>contactAnimation?.effect.getComputedTiming().duration)).toBe(280);
        await page.goForward();await opened(page);
        await page.emulateMedia({reducedMotion:'reduce'});
        await page.keyboard.press('Escape');
      }
      await closed(page);
      expect(await page.evaluate(()=>contactSession===null && contactAnimation===null && !document.querySelector('main').inert)).toBe(true);
    });
  });
}

test.describe('Contact protected route continuity',()=>{
  test.use({viewport:{width:412,height:915},contextOptions:{reducedMotion:'reduce'},serviceWorkers:'block'});
  for(const route of ['/music','/wrestling','/connect','/admin']) test(`preserves ${route}`,async({page})=>{
    await page.goto(route,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>canOpenContact());
    await remember(page);await menuOpen(page);await preserved(page);
    await clickEngineBack(page);await closed(page,route);await preserved(page);
    await expect(page.locator('[data-shell-menu-toggle]')).toBeEnabled();
  });
  test('Trajectory and Calendar retain their native modal boundary',async({page})=>{
    for(const [route,selector]of[['/upcoming','[data-trajectory-overlay]'],['/calendar','[data-calendar-overlay]']]){
      await page.goto(route,{waitUntil:'domcontentloaded'});
      await expect(page.locator(selector)).toHaveAttribute('data-state','open');
      expect(await page.locator(selector).evaluate(el=>el.matches(':modal'))).toBe(true);
      expect(await page.locator('[data-prototype-engine-return]').evaluate(el=>!!el.closest('[inert]'))).toBe(true);
      await page.keyboard.press('Escape');await expect(page.locator(selector)).toBeHidden();
    }
  });
  test('fresh direct entry defers outside-Shell privacy UI without changing consent',async({page})=>{
    await page.evaluate(()=>localStorage.clear());
    await page.goto('/contact',{waitUntil:'domcontentloaded'});await opened(page);
    const privacy=page.locator('[data-v3-privacy]');await expect(privacy).toBeAttached();
    await expect(privacy).toBeHidden();
    expect(await privacy.evaluate(el=>el.inert)).toBe(true);
    const before=await page.evaluate(()=>JSON.stringify(localStorage));
    // A late outside-Shell control must also be inactive until Contact closes.
    await page.evaluate(()=>{const b=document.createElement('button');b.id='qa-late-control';b.textContent='Late UI';document.body.append(b);});
    await expect.poll(()=>page.locator('#qa-late-control').evaluate(el=>el.inert)).toBe(true);
    await clickEngineBack(page);await closed(page);
    await expect(privacy).toBeVisible();expect(await privacy.evaluate(el=>el.inert)).toBe(false);
    expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);
    expect(await page.locator('#qa-late-control').evaluate(el=>el.inert)).toBe(false);
    await page.locator('#qa-late-control').evaluate(el=>el.remove());
  });
});
