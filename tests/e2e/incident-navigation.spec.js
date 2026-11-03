const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const sizes = [{width:360,height:800},{width:412,height:915},{width:915,height:412},{width:1920,height:1080}];
const FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSe2QtiV3sQyXsBSQIFmmuP0P3TlLIpBYOcMRMuP9iFJSC8O_A/viewform?usp=publish-editor';
const errors = new WeakMap();
const submissions = new WeakMap();
const googleReads = new WeakMap();
test.beforeEach(async ({page,context,baseURL}) => {
  errors.set(page, []); submissions.set(page, []); googleReads.set(page, []);
  page.on('pageerror', e => errors.get(page).push(e.message));
  // No production API, analytics or mail request leaves the browser.
  await context.route('**/*', route => {
    const request=route.request(), url=new URL(request.url());
    if (request.method() !== 'GET' && request.method() !== 'HEAD') {
      submissions.get(page).push(url.pathname); return route.abort();
    }
    if (url.hostname === 'docs.google.com') {
      googleReads.get(page).push(request.url());
      return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Mock Google Forms responder</title><p>Isolated link test. No submission controls.</p>'});
    }

    if(url.origin==='https://challenges.cloudflare.com'&&url.pathname==='/turnstile/v0/api.js'){
      return route.fulfill({contentType:'application/javascript',body:`
        const source=document.currentScript;
        window.turnstile={
          ready(callback){if(source.async||source.defer)throw new Error("Unsupported ready() for async SDK");queueMicrotask(callback);},
          render(host,options){
            const widget=document.createElement('div');widget.id='contact-navigation-challenge';
            widget.style.cssText='width:150px;height:140px';widget.textContent='Mock security check';host.append(widget);
            queueMicrotask(()=>options.callback('synthetic-navigation-token'));
            return widget.id;
          },
          remove(id){document.getElementById(id)?.remove();}
        };
        const loaded=new URL(source.src).searchParams.get('onload');
        if(loaded)queueMicrotask(()=>window[loaded]?.());
      `});
    }
    if (!url.pathname.startsWith('/api/') && (url.origin===new URL(baseURL).origin ||
        ['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname) ||
        url.hostname==='unpkg.com' && url.pathname.startsWith('/leaflet@1.9.4/dist/'))) return route.continue();
    if(request.resourceType()==='script') return route.fulfill({contentType:'application/javascript',body:''});
    if(request.resourceType()==='stylesheet') return route.fulfill({contentType:'text/css',body:''});
    return route.fulfill({status:503,headers:{'access-control-allow-origin':'*'},contentType:'application/json',body:'{"error":"Isolated Incident QA"}'});
  });
  await page.goto('/portfolio',{waitUntil:'domcontentloaded'});
  const reject=page.getByRole('button',{name:'Reject',exact:true});
  if(await reject.isVisible()) await reject.click();
});
test.afterEach(async ({page}) => { expect(errors.get(page)).toEqual([]); expect(submissions.get(page)).toEqual([]); });

async function opened(page) {
  await expect(page).toHaveURL(/\/report-issue$/);
  await expect(page.getByRole('dialog',{name:'REPORT AN ISSUE'})).toBeVisible();
  await expect(page.locator('[data-incident-overlay]')).toHaveAttribute('data-state','open');
  await expect(page.locator('[data-incident-overlay]')).toHaveAttribute('aria-modal','false');
  await expect(page.locator('[data-incident-status]')).toHaveText('Terminal open');
}
async function closed(page, route='/portfolio') {
  await expect(page).toHaveURL(new RegExp(route+'$'));
  await expect(page.locator('[data-incident-overlay]')).toBeHidden();
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
  await expect(page.locator('[data-shell-menu-panel]')).toHaveAttribute('aria-hidden','false');
  const menu=await page.locator('[data-shell-menu-panel]').evaluate(panel=>({height:panel.querySelector('.shell-menu-preview__rows').offsetHeight,available:parseFloat(getComputedStyle(panel).maxHeight),target:panel.querySelector('[data-shell-menu-route="reportIssue"]').offsetHeight}));
  expect(menu.height).toBeLessThanOrEqual(menu.available);expect(menu.target).toBeGreaterThanOrEqual(44);
  await page.locator('[data-shell-menu-route="reportIssue"]').click();
  await opened(page);
}
async function remember(page) {
  await page.evaluate(()=>{
    window.__incidentSource={route:shellRenderedRoute,context:v3RouteContext,engine:portfolioEngine,title:document.title,
      scroll:[...getV3ResumeScrollers(shellRenderedRoute).values()].filter(Boolean).map(node=>({node,top:node.scrollTop,left:node.scrollLeft}))};
  });
}
async function preserved(page) {
  expect(await page.evaluate(()=>{
    const s=window.__incidentSource;
    return s.route===shellRenderedRoute && s.context===v3RouteContext && s.engine===portfolioEngine &&
      s.scroll.every(({node,top,left})=>Math.abs(node.scrollTop-top)<2 && Math.abs(node.scrollLeft-left)<2);
  })).toBe(true);
}

for(const viewport of sizes) for(const reducedMotion of ['reduce','no-preference']) {
  test.describe(`Incident ${viewport.width}x${viewport.height} ${reducedMotion}`,()=>{
    test.use({viewport,contextOptions:{reducedMotion},serviceWorkers:'block'});
    test('direct entry, refresh and all return controls',async({page})=>{
      await page.goto('/report-issue',{waitUntil:'domcontentloaded'}); await opened(page);
      await expect(page.locator('[data-incident-close]')).toBeFocused();
      await page.reload({waitUntil:'domcontentloaded'}); await opened(page);
      const length=await page.evaluate(()=>history.length);
      await clickEngineBack(page); await closed(page);
      expect(await page.evaluate(()=>history.length)).toBe(length);
      await expect(page.locator('[data-shell-menu-toggle]')).toBeFocused();
      await remember(page); await menuOpen(page); await preserved(page);
      await page.locator('[data-incident-close]').click(); await closed(page); await preserved(page);
      await page.goForward(); await opened(page);
      await page.goBack(); await closed(page); await preserved(page);
      await page.goForward(); await opened(page);
      await page.keyboard.press('Escape'); await closed(page); await preserved(page);
      await page.goForward(); await opened(page);
      await clickEngineBack(page); await closed(page); await preserved(page);
      await expect(page.locator('[data-shell-menu-toggle]')).toBeFocused();
    });
    test('focus boundary, inactive world, layout and single scrolling viewport',async({page})=>{
      await page.goto('/report-issue',{waitUntil:'domcontentloaded'}); await opened(page);
      await page.evaluate(()=>document.fonts.ready);
      const close=page.locator('[data-incident-close]'), scroll=page.locator('[data-incident-scroll]'), back=page.locator('[data-prototype-engine-return]');
      await page.keyboard.press('Tab'); await expect(scroll).toBeFocused();
      for (const selector of ['[data-incident-launch]']) {
        await page.keyboard.press('Tab'); await expect(page.locator(selector)).toBeFocused();
        expect(await page.locator(selector).evaluate(el=>{const a=el.getBoundingClientRect(),b=document.querySelector('[data-incident-scroll]').getBoundingClientRect();return a.bottom>b.top && a.top<b.bottom;})).toBe(true);
      }
      await page.keyboard.press('Tab'); await expect(back).toBeFocused();
      await page.keyboard.press('Tab'); await expect(close).toBeFocused();
      await page.keyboard.press('Shift+Tab'); await expect(back).toBeFocused();
      await page.locator('[data-shell-menu-toggle]').evaluate(el=>el.focus()); await expect(back).toBeFocused();
      const layout=await page.evaluate(()=>{
        const overlay=incidentOverlay, frame=incidentFrame, close=incidentClose, back=prototypeEngineReturnControl;
        return {frame:frame.getBoundingClientRect().toJSON(),close:close.getBoundingClientRect().toJSON(),engine:portfolioEngine.getBoundingClientRect().toJSON(),
          overflow:[document.documentElement,overlay,frame,overlay.querySelector('[data-incident-scroll]')].some(el=>el.scrollWidth>el.clientWidth+1),
          inert:incidentSession.surfaces.every(({node})=>node.inert),backInert:!!back.closest('[inert]'),
          nativeModal:overlay.matches(':modal'),frameHeight:frame.offsetHeight};
      });
      expect(layout.inert).toBe(true); expect(layout.backInert).toBe(false); expect(layout.nativeModal).toBe(false); expect(layout.overflow).toBe(false);
      expect(layout.frame.x).toBeGreaterThanOrEqual(12); expect(layout.frame.right).toBeLessThanOrEqual(viewport.width-12);
      expect(layout.frame.y).toBeCloseTo(20, 0);
      expect(layout.engine.top-layout.frame.bottom).toBeCloseTo(20, 0);
      expect(layout.frame.height).toBeCloseTo(layout.engine.top-40, 0);
      expect(layout.close.width).toBeGreaterThanOrEqual(44); expect(layout.close.height).toBeGreaterThanOrEqual(44);
      if(process.env.INCIDENT_EVIDENCE_DIR && reducedMotion==='no-preference'){
        fs.mkdirSync(process.env.INCIDENT_EVIDENCE_DIR,{recursive:true});
        await close.focus();
        await scroll.evaluate(el=>el.scrollTop=0);
        await page.screenshot({path:path.join(process.env.INCIDENT_EVIDENCE_DIR,`incident--${viewport.width}x${viewport.height}.png`)});
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
      const afterScroll=await page.locator('[data-incident-frame]').boundingBox();
      expect(afterScroll.y).toBeCloseTo(layout.frame.y, 0);
      expect(afterScroll.height).toBeCloseTo(layout.frame.height, 0);
      await scroll.locator('[data-qa-overflow]').evaluate(el=>el.remove());
      await page.setViewportSize({width:viewport.width,height:480});
      await expect.poll(()=>page.evaluate(()=>Math.abs(portfolioEngine.getBoundingClientRect().top-incidentFrame.getBoundingClientRect().bottom-20))).toBeLessThan(1);
      await expect.poll(()=>scroll.evaluate(el=>el.clientHeight)).toBeGreaterThan(44);
      await page.setViewportSize(viewport);
      // Simulate an offset/shrunken visual viewport independently of layout height.
      // This covers the measurement contract; it is not physical keyboard/device QA.
      await page.evaluate(()=>{
        Object.defineProperties(visualViewport,{offsetTop:{configurable:true,value:48},height:{configurable:true,value:280}});
        visualViewport.dispatchEvent(new Event('resize'));
      });
      await expect.poll(()=>page.locator('[data-incident-frame]').evaluate(el=>el.getBoundingClientRect().top)).toBeCloseTo(68, 0);
      await expect.poll(()=>page.locator('[data-incident-frame]').evaluate(el=>el.getBoundingClientRect().bottom)).toBeCloseTo(308, 0);
      await expect.poll(()=>scroll.evaluate(el=>el.clientHeight)).toBeGreaterThan(44);
      expect(await close.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=48 && r.bottom<=328;})).toBe(true);
      expect(await scroll.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
      await page.evaluate(()=>{delete visualViewport.offsetTop;delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));});
      await expect.poll(()=>page.locator('[data-incident-frame]').evaluate(el=>el.getBoundingClientRect().top)).toBeCloseTo(20, 0);
      await back.focus();await page.keyboard.press('Enter');await closed(page);
    });
    test('normal user link opens only the exact Google responder and retains the source terminal',async({page,context})=>{
      await remember(page); await menuOpen(page); await preserved(page);
      const overlay=page.locator('[data-incident-overlay]'),launch=page.getByRole('link',{name:'Open Bug Report',exact:true});
      await expect(launch).toHaveAttribute('href',FORM_URL);
      await expect(launch).toHaveAttribute('target','_blank'); await expect(launch).toHaveAttribute('rel','noopener noreferrer');
      await expect(launch).toHaveAccessibleDescription(/Opens Google Forms in a new tab/);
      await expect(overlay.locator('form, input, textarea, select, iframe')).toHaveCount(0);
      expect(googleReads.get(page)).toEqual([]);
      await launch.focus(); const popupPromise=context.waitForEvent('page'); await page.keyboard.press('Enter');
      const popup=await popupPromise; await popup.waitForLoadState('domcontentloaded');
      await expect(popup).toHaveURL(FORM_URL); expect(await popup.evaluate(()=>window.opener)).toBe(null);
      expect(googleReads.get(page)).toEqual([FORM_URL]); await popup.close();
      await opened(page);await preserved(page);await expect(page.locator('[data-incident-status]')).toHaveText('Terminal open');
      await expect(overlay).not.toContainText(/report (submitted|received)|thank you for (submitting|your report)/i);
      await clickEngineBack(page);await closed(page);await preserved(page);
    });
    test('source scroll, route state and focus survive opening and history interruption',async({page})=>{
      await page.goto('/privacy',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>canOpenIncident());
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
    test('Report an Issue stays available when a Wrestling photo cannot open',async({page})=>{
      const route='/wrestling/shows/050826/match-1/photo/001';
      await page.goto(route,{waitUntil:'domcontentloaded'});
      await expect(page.locator('[data-lightbox-screen][aria-hidden="false"]')).toHaveCount(0);
      await remember(page); await menuOpen(page); await preserved(page);
      await page.goBack(); await closed(page,route); await preserved(page);
      await expect(page.locator('[data-shell-menu-toggle]')).toBeFocused();
      await page.goForward(); await opened(page); await preserved(page);
      await page.getByRole('button',{name:'Close Report an Issue',exact:true}).click();
      await closed(page,route); await preserved(page);
    });
    test('approved timing and interruption settle cleanly',async({page})=>{
      expect(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(reducedMotion==='reduce');
      await page.waitForFunction(()=>canOpenIncident());
      const opening=await page.evaluate(()=>{navigateToRoute('/report-issue');return incidentAnimation?.effect.getComputedTiming().duration ?? 0;});
      expect(opening).toBe(reducedMotion==='reduce'?0:420);
      await opened(page);
      await page.goBack();
      if(reducedMotion==='no-preference') {
        expect(await page.evaluate(()=>incidentAnimation?.effect.getComputedTiming().duration)).toBe(280);
        await page.goForward();await opened(page);
        await page.emulateMedia({reducedMotion:'reduce'});
        await page.keyboard.press('Escape');
      }
      await closed(page);
      expect(await page.evaluate(()=>incidentSession===null && incidentAnimation===null && !document.querySelector('main').inert)).toBe(true);
    });
  });
}

test.describe('Incident protected route continuity',()=>{
  test.use({viewport:{width:412,height:915},contextOptions:{reducedMotion:'reduce'},serviceWorkers:'block'});
  for(const route of ['/music','/wrestling','/connect','/admin']) test(`preserves ${route}`,async({page})=>{
    await page.goto(route,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>canOpenIncident());
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
  test('Contact remains independent and preserves its draft',async({page})=>{
    await page.goto('/contact',{waitUntil:'domcontentloaded'});
    const contact=page.locator('[data-contact-overlay]');await expect(contact).toHaveAttribute('data-state','open');
    await expect(contact).toHaveAttribute('aria-modal','false');await page.locator('#contact-name').fill('Preserved local draft');
    await page.keyboard.press('Escape'); await expect(contact).toBeHidden();
    await menuOpen(page);await page.keyboard.press('Escape');await closed(page);
    await page.evaluate(()=>navigateToRoute('/contact'));await expect(contact).toHaveAttribute('data-state','open');
    await expect(page.locator('#contact-name')).toHaveValue('Preserved local draft');
  });
  test('fresh direct entry defers outside-Shell privacy UI without changing consent',async({page})=>{
    await page.evaluate(()=>localStorage.clear());
    await page.goto('/report-issue',{waitUntil:'domcontentloaded'});await opened(page);
    const privacy=page.locator('[data-v3-privacy]');await expect(privacy).toBeAttached();
    await expect(privacy).toBeHidden();
    expect(await privacy.evaluate(el=>el.inert)).toBe(true);
    const before=await page.evaluate(()=>JSON.stringify(localStorage));
    // A late outside-Shell control must also be inactive until Incident closes.
    await page.evaluate(()=>{const b=document.createElement('button');b.id='qa-late-control';b.textContent='Late UI';document.body.append(b);});
    await expect.poll(()=>page.locator('#qa-late-control').evaluate(el=>el.inert)).toBe(true);
    await clickEngineBack(page);await closed(page);
    await expect(privacy).toBeVisible();expect(await privacy.evaluate(el=>el.inert)).toBe(false);
    expect(await page.evaluate(()=>JSON.stringify(localStorage))).toBe(before);
    expect(await page.locator('#qa-late-control').evaluate(el=>el.inert)).toBe(false);
    await page.locator('#qa-late-control').evaluate(el=>el.remove());
  });
});

test.describe('Incident Android-style safe-area clearance',()=>{
  test.use({viewport:{width:412,height:915},isMobile:true,hasTouch:true,contextOptions:{reducedMotion:'reduce'},serviceWorkers:'block'});
  for(const bottom of [32,48])test(`touch Engine Back clears a ${bottom}px navigation inset`,async({page,context})=>{
    const cdp=await context.newCDPSession(page);
    await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{top:24,bottom,left:0,right:0}});
    await page.waitForFunction(()=>canOpenIncident());await page.evaluate(()=>navigateToRoute('/report-issue'));await opened(page);
    const layout=await page.evaluate(()=>({frame:incidentFrame.getBoundingClientRect().toJSON(),engine:portfolioEngine.getBoundingClientRect().toJSON(),back:prototypeEngineReturnControl.getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth}));
    expect(layout.frame.y).toBeCloseTo(24,0);expect(layout.engine.top-layout.frame.bottom).toBeGreaterThanOrEqual(bottom-1);
    expect(layout.back.bottom).toBeLessThanOrEqual(915-bottom+1);expect(layout.overflow).toBe(false);
    await page.touchscreen.tap(layout.back.x+layout.back.width/2,layout.back.y+layout.back.height/2);await closed(page);
  });
});
