const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const API = 'https://vmpix-data.onrender.com/api/contact';
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const APPROVED_SITE_KEY = '0x4AAAAAAFwodzyao1rfi5mE';
const ACCEPTED = { ok: true, code: 'provider_accepted', delivery: 'accepted', retryable: false };
const DRAFT = { name: 'Synthetic Visitor', email: 'visitor@example.com', subject: 'CON05 PRIVATE DRAFT', message: 'Private synthetic message. <b>Plain text only.</b>' };
const TOKEN = 'synthetic-unverified-token';
const mockScript = `(() => {
  const qa = window.__turnstileTest = { renders: [], removals: [], callbacks: [], sequence: 0 };
  window.turnstile = {
    ready(fn) { queueMicrotask(fn); },
    render(host, options) {
      const id = 'mock-' + ++qa.sequence;
      qa.renders.push({ id, sitekey: options.sitekey, size: options.size, tabindex: options.tabindex,
        responseField: options['response-field'], retry: options.retry, refresh: options['refresh-expired'] });
      qa.callbacks.push(options); qa.current = options;
      const frame = document.createElement('iframe'); frame.id = id; frame.title = 'Security check';
      frame.tabIndex = options.tabindex; frame.width = '150'; frame.height = '140'; frame.style.border = '0';
      frame.src = 'https://challenges.cloudflare.com/con05-mock-frame';
      if (window.__mockClosedShadow) {
        const wrapper = document.createElement('div'); qa.shadowHost = wrapper;
        wrapper.attachShadow({mode:'closed'}).append(frame); host.append(wrapper);
      } else host.append(frame);
      return id;
    },
    remove(id) { qa.removals.push(id); document.getElementById(id)?.remove(); }
  };
})();`;
const mockFrame = '<!doctype html><html><body style="margin:0;background:#111;color:white;font:14px Arial"><button style="margin:12px;max-width:126px" type="button">Mock security control</button></body></html>';
const status = page => page.locator('[data-contact-feedback]');
const form = page => page.locator('[data-contact-form]');
const submit = page => page.locator('[data-contact-submit]');
async function draft(page) { for (const [name,value] of Object.entries(DRAFT)) await page.locator('#contact-'+name).fill(value); }
async function solve(page, value = TOKEN) {
  await expect(page.locator('[data-contact-widget] iframe')).toBeAttached();
  await page.evaluate(value => window.__turnstileTest.current.callback(value), value);
}
async function open(page) {
  await page.waitForFunction(() => canOpenContact()); await page.evaluate(() => navigateToRoute('/contact'));
  await expect(page.locator('[data-contact-overlay]')).toHaveAttribute('data-state','open');
}
async function setup(page, context, baseURL, options = {}) {
  const requests = [], forbidden = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.text().includes(TOKEN) || message.text().includes(DRAFT.subject)) errors.push('Sensitive console output'); });
  const cors = { 'access-control-allow-origin': new URL(baseURL).origin, 'access-control-allow-headers': 'Content-Type, Idempotency-Key', 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-expose-headers': 'Retry-After' };
  const reply = (route, body = ACCEPTED, code = 202, extra = {}) => route.fulfill({ status: code, headers: { ...cors, ...extra }, contentType: 'application/json', body: JSON.stringify(body) });
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (request.url() === API) {
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      requests.push({ method: request.method(), headers: request.headers(), body: request.postDataJSON() });
      return options.respond ? options.respond(route, reply) : reply(route);
    }
    if (request.url() === SCRIPT) {
      if (options.scriptFailure) return route.abort();
      return route.fulfill({ contentType: 'application/javascript', body: mockScript });
    }
    if (url.hostname === 'challenges.cloudflare.com' && url.pathname === '/con05-mock-frame') return route.fulfill({ contentType:'text/html',body:mockFrame });
    if (url.hostname === 'formspree.io' || url.hostname === 'challenges.cloudflare.com') forbidden.push(request.url());
    if (url.origin === new URL(baseURL).origin && request.resourceType() === 'document') {
      const response = await route.fetch();
      let html = await response.text();
      // Exercise the checked-in enabled configuration by default. Only negative
      // fixtures override it; all challenge and transmission traffic stays mocked.
      if (options.enabled === false) html = html.replace('data-contact-enabled="1"', 'data-contact-enabled="0"');
      if (Object.hasOwn(options, 'sitekey')) html = html.replace(/data-contact-sitekey="[^"]*"/, `data-contact-sitekey="${options.sitekey}"`);
      return route.fulfill({ response, body: html });
    }
    if (url.origin === new URL(baseURL).origin && !url.pathname.startsWith('/api/') || ['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname) || url.hostname === 'unpkg.com' && url.pathname.startsWith('/leaflet@1.9.4/dist/')) return route.continue();
    if (request.resourceType() === 'script') return route.fulfill({ contentType:'application/javascript',body:'' });
    if (request.resourceType() === 'stylesheet') return route.fulfill({ contentType:'text/css',body:'' });
    return reply(route, {}, 503);
  });
  await page.goto('/portfolio', { waitUntil:'domcontentloaded' });
  const reject = page.getByRole('button',{name:'Reject',exact:true}); if (await reject.isVisible()) await reject.click();
  return { requests, forbidden, errors };
}
async function assertDraft(page) { for (const [name,value] of Object.entries(DRAFT)) await expect(page.locator('#contact-'+name)).toHaveValue(value); }
async function assertSafe(qa) { expect(qa.forbidden).toEqual([]); expect(qa.errors).toEqual([]); }

for (const viewport of [{width:360,height:800},{width:412,height:915},{width:1920,height:1080}]) for (const reducedMotion of ['reduce','no-preference']) {
  test.describe(`Contact transmission ${viewport.width}x${viewport.height} ${reducedMotion}`, () => {
    test.use({ viewport, contextOptions:{reducedMotion}, serviceWorkers:'block' });
    test('validates, forwards once, accepts only confirmation, and preserves layout/navigation', async ({page,context,baseURL}) => {
      let release; const waiting = new Promise(resolve => { release = resolve; });
      const qa = await setup(page,context,baseURL,{respond:async(route,reply)=>{await waiting;return reply(route);}});
      await open(page);
      await expect(form(page)).toHaveAttribute('data-contact-enabled','1');
      await expect(form(page)).toHaveAttribute('data-contact-sitekey',APPROVED_SITE_KEY);
      await submit(page).click(); await expect(page.locator('#contact-name')).toBeFocused();
      await expect(page.locator('[data-contact-input][aria-invalid="true"]')).toHaveCount(4); expect(qa.requests).toHaveLength(0);
      await draft(page); await page.locator('#contact-email').fill('not-an-email'); await submit(page).click();
      await expect(page.locator('#contact-email')).toBeFocused(); expect(qa.requests).toHaveLength(0);
      await page.locator('#contact-email').fill(DRAFT.email);
      await submit(page).click(); await expect(status(page)).toContainText('Security check required'); expect(qa.requests).toHaveLength(0);
      await page.locator('[data-contact-challenge-retry]').click(); await solve(page);
      expect(await page.evaluate(()=>window.__turnstileTest.renders.at(-1))).toMatchObject({sitekey:APPROVED_SITE_KEY,size:'compact',tabindex:0,responseField:false,retry:'never',refresh:'never'});
      await page.locator('#contact-message').focus(); await page.keyboard.press('Tab');
      expect(await page.evaluate(()=>document.activeElement.tagName)).toBe('IFRAME');
      // A cross-origin frame retains native keyboard traversal back to Contact.
      await page.frameLocator('[data-contact-widget] iframe').getByRole('button').focus();
      await page.keyboard.press('Tab'); await expect(submit(page)).toBeFocused();
      const layout = await page.evaluate(()=>({ frame:contactFrame.getBoundingClientRect().toJSON(),engine:portfolioEngine.getBoundingClientRect().toJSON(),overflow:[document.documentElement,contactFrame,document.querySelector('[data-contact-scroll]')].some(el=>el.scrollWidth>el.clientWidth+1) }));
      expect(layout.overflow).toBe(false); expect(layout.engine.top-layout.frame.bottom).toBeCloseTo(20,0); expect(layout.frame.top).toBeCloseTo(20,0);
      const scroller = page.locator('[data-contact-scroll]');
      await scroller.evaluate(el=>el.scrollTop=el.scrollHeight);
      expect(await scroller.evaluate(el=>Math.abs(el.scrollHeight-el.clientHeight-el.scrollTop))).toBeLessThan(2);
      const afterScroll = await page.locator('[data-contact-frame]').boundingBox();
      expect(afterScroll.y).toBeCloseTo(layout.frame.top,0); expect(afterScroll.height).toBeCloseTo(layout.frame.height,0);
      await submit(page).focus();
      if (process.env.CONTACT_EVIDENCE_DIR && reducedMotion==='no-preference') {
        fs.mkdirSync(process.env.CONTACT_EVIDENCE_DIR,{recursive:true});
        await page.evaluate(()=>document.fonts.ready);
        await page.screenshot({path:path.join(process.env.CONTACT_EVIDENCE_DIR,`contact-transmission-ready--${viewport.width}x${viewport.height}.png`)});
      }
      await page.keyboard.press('Enter'); await expect(form(page)).toHaveAttribute('data-contact-state','transmitting');
      await form(page).evaluate(el=>{el.requestSubmit();el.requestSubmit();});
      await expect.poll(()=>qa.requests.length).toBe(1); await expect(submit(page)).toBeDisabled(); await expect(page.locator('#contact-message')).toHaveAttribute('readonly','');
      expect(qa.requests[0].body).toEqual({...DRAFT,turnstileToken:TOKEN});
      expect(qa.requests[0].headers['idempotency-key']).toMatch(/^\d{13}\.[0-9a-f-]{36}$/);
      expect(qa.requests[0].headers.authorization).toBeUndefined(); expect(qa.requests[0].headers.cookie).toBeUndefined(); expect(qa.requests[0].headers.referer).toBeUndefined();
      release(); await expect(form(page)).toHaveAttribute('data-contact-state','accepted'); await expect(status(page)).toContainText('inbox delivery is not yet confirmed');
      await assertDraft(page); await expect(submit(page)).toBeDisabled();
      const storage = await page.evaluate(()=>JSON.stringify([localStorage,sessionStorage])); expect(storage).not.toContain(TOKEN); expect(storage).not.toContain(DRAFT.subject); expect(storage).not.toContain(DRAFT.email);
      await page.locator('[data-contact-close]').focus(); await page.keyboard.press('Escape'); await expect(page).toHaveURL(/\/portfolio$/);
      await page.goForward(); await expect(page.locator('[data-contact-overlay]')).toHaveAttribute('data-state','open'); await expect(form(page)).toHaveAttribute('data-contact-state','accepted'); await assertDraft(page); expect(qa.requests).toHaveLength(1);
      if (process.env.CONTACT_EVIDENCE_DIR && reducedMotion==='no-preference') {
        fs.mkdirSync(process.env.CONTACT_EVIDENCE_DIR,{recursive:true});
        await page.locator('[data-contact-scroll]').evaluate(el=>el.scrollTop=el.scrollHeight);
        await page.screenshot({path:path.join(process.env.CONTACT_EVIDENCE_DIR,`contact-transmission-accepted--${viewport.width}x${viewport.height}.png`)});
      }
      await assertSafe(qa);
    });
    test('request timeout preserves draft, blocks replay, and keeps Engine Back available', async ({page,context,baseURL}) => {
      let release; const waiting = new Promise(resolve=>{release=resolve;});
      const qa = await setup(page,context,baseURL,{respond:async(route,reply)=>{await waiting;await reply(route).catch(()=>{});}});
      await open(page); await draft(page); await solve(page); await page.clock.install();
      await submit(page).click(); await expect.poll(()=>qa.requests.length).toBe(1);
      await page.clock.runFor(25001); await expect(form(page)).toHaveAttribute('data-contact-state','uncertain');
      await assertDraft(page); await form(page).evaluate(el=>el.requestSubmit()); expect(qa.requests).toHaveLength(1);
      release(); await page.clock.resume();
      await page.locator('[data-prototype-engine-return]').focus(); await page.keyboard.press('Enter'); await expect(page).toHaveURL(/\/portfolio$/);
      await page.goForward(); await expect(form(page)).toHaveAttribute('data-contact-state','uncertain'); await assertDraft(page);
      await page.reload({waitUntil:'domcontentloaded'}); await expect(form(page)).toHaveAttribute('data-contact-state','uncertain'); await expect(submit(page)).toBeDisabled();
      expect(qa.requests).toHaveLength(1); await assertSafe(qa);
    });
  });
}

test.describe('Contact failure safety',()=>{
  test.use({viewport:{width:412,height:915},contextOptions:{reducedMotion:'reduce'},serviceWorkers:'block'});
  for (const [label, options] of Object.entries({disabled:{enabled:false},missingSiteKey:{sitekey:''}})) test(`${label}: no Turnstile or Contact request`,async({page,context,baseURL})=>{
    const qa=await setup(page,context,baseURL,options);await open(page);await draft(page);await submit(page).click();
    await expect(status(page)).toContainText('Delivery is unavailable');expect(qa.requests).toHaveLength(0);
    if (label === 'disabled') {
      await expect(form(page)).toHaveAttribute('data-contact-enabled','0');
      await expect(form(page)).toHaveAttribute('data-contact-sitekey',APPROVED_SITE_KEY);
    }
    expect(await page.evaluate(()=>window.__turnstileTest)).toBeUndefined();await assertDraft(page);await assertSafe(qa);
  });
  for (const callback of ['expired-callback','error-callback','timeout-callback','unsupported-callback']) test(`${callback}: no transmission until a fresh explicit check`,async({page,context,baseURL})=>{
    const qa=await setup(page,context,baseURL);await open(page);await draft(page);await solve(page);
    await page.evaluate(name=>window.__turnstileTest.current[name]('private-provider-error'),callback);
    await submit(page).click();expect(qa.requests).toHaveLength(0);await assertDraft(page);await expect(status(page)).not.toContainText('private-provider-error');
    await page.locator('[data-contact-challenge-retry]').click();await solve(page,'fresh-unverified-token');
    await page.evaluate(()=>window.__turnstileTest.callbacks[0].callback('late-old-token'));
    await submit(page).click();await expect(form(page)).toHaveAttribute('data-contact-state','accepted');
    expect(qa.requests[0].body.turnstileToken).toBe('fresh-unverified-token');await assertSafe(qa);
  });
  for (const value of ['',null,{},'has space','bad\ntoken','x'.repeat(2049)]) test(`malformed token ${typeof value}:${String(value).slice(0,12)}`,async({page,context,baseURL})=>{
    const qa=await setup(page,context,baseURL);await open(page);await draft(page);await solve(page,value);await submit(page).click();
    await expect(form(page)).toHaveAttribute('data-contact-state','failed');expect(qa.requests).toHaveLength(0);await assertDraft(page);await assertSafe(qa);
  });
  test('script failure is recoverable without sending or clearing draft',async({page,context,baseURL})=>{
    const options={scriptFailure:true};const qa=await setup(page,context,baseURL,options);await open(page);await draft(page);
    await expect(page.locator('[data-contact-challenge-status]')).toContainText('could not load');await submit(page).click();expect(qa.requests).toHaveLength(0);
    options.scriptFailure=false;await page.locator('[data-contact-challenge-retry]').click();await solve(page);await submit(page).click();
    await expect(form(page)).toHaveAttribute('data-contact-state','accepted');await assertDraft(page);await assertSafe(qa);
  });
  const uncertainCases={network:'network',malformed:'malformed',falseAcceptance:[200,ACCEPTED],contradiction:[202,{...ACCEPTED,errors:['private']}],
    unexpected:[202,{ok:true}],unavailableWithoutContract:[503,{}],upstreamTimeout:[504,{}],
    uncertain:[503,{ok:false,code:'delivery_uncertain',delivery:'unknown',retryable:false}],
    restart:[409,{ok:false,code:'submission_history_unavailable',delivery:'unknown',retryable:false}],oversized:'oversized'};
  for(const [label,definition]of Object.entries(uncertainCases))test(`${label}: uncertainty cannot become success or a retry`,async({page,context,baseURL})=>{
    const qa=await setup(page,context,baseURL,{respond:(route,reply)=>{
      if(definition==='network')return route.abort();
      if(definition==='malformed'||definition==='oversized')return route.fulfill({status:200,headers:{'access-control-allow-origin':new URL(baseURL).origin},contentType:'application/json',body:definition==='malformed'?'private invalid json':'x'.repeat(16385)});
      return reply(route,definition[1],definition[0]);
    }});
    await open(page);await draft(page);await solve(page);await submit(page).click();await expect(form(page)).toHaveAttribute('data-contact-state','uncertain');
    await assertDraft(page);await page.locator('#contact-subject').fill('Edited draft');await form(page).evaluate(el=>el.requestSubmit());
    await expect(submit(page)).toBeDisabled();expect(qa.requests).toHaveLength(1);await expect(status(page)).not.toContainText('private');await assertSafe(qa);
  });
  for(const [code,httpStatus]of [['provider_validation_failed',422],['provider_rate_limited',429],['delivery_unavailable',502]])test(`${code}: rejected submission is not replayed`,async({page,context,baseURL})=>{
    const qa=await setup(page,context,baseURL,{respond:(route,reply)=>reply(route,{ok:false,code,delivery:'rejected',retryable:false},httpStatus)});
    await open(page);await draft(page);await solve(page);await submit(page).click();await expect(form(page)).toHaveAttribute('data-contact-state','failed');
    await expect(submit(page)).toBeDisabled();await assertDraft(page);await form(page).evaluate(el=>el.requestSubmit());expect(qa.requests).toHaveLength(1);await assertSafe(qa);
  });
  test('confirmed not-attempted rate limit permits only a deliberate retry after Retry-After',async({page,context,baseURL})=>{
    let count=0;const qa=await setup(page,context,baseURL,{respond:(route,reply)=>++count===1?reply(route,{ok:false,code:'rate_limited',delivery:'not_attempted',retryable:true},429,{'retry-after':'60'}):reply(route)});
    await open(page);await draft(page);await solve(page);await submit(page).click();await expect(form(page)).toHaveAttribute('data-contact-state','failed');await assertDraft(page);
    await page.locator('[data-contact-challenge-retry]').click();await solve(page,'fresh-token');await submit(page).click();await expect(status(page)).toContainText('Please wait');expect(qa.requests).toHaveLength(1);
    await page.clock.install();await page.clock.runFor(60001);await submit(page).click();await expect(form(page)).toHaveAttribute('data-contact-state','accepted');expect(qa.requests).toHaveLength(2);await assertSafe(qa);
  });
  for(const [code,httpStatus]of [['contact_unavailable',503],['invalid_fields',400],['request_timeout',408]])test(`${code}: known unsent failure preserves draft and never auto-retries`,async({page,context,baseURL})=>{
    const qa=await setup(page,context,baseURL,{respond:(route,reply)=>reply(route,{ok:false,code,delivery:'not_attempted',retryable:false,fields:['message'],message:'PRIVATE PROVIDER TEXT'},httpStatus)});
    await open(page);await draft(page);await solve(page);await submit(page).click();await expect(form(page)).toHaveAttribute('data-contact-state','failed');await assertDraft(page);
    await expect(submit(page)).toBeEnabled();await expect(status(page)).not.toContainText('PRIVATE PROVIDER TEXT');expect(qa.requests).toHaveLength(1);await assertSafe(qa);
  });
  test('close while transmitting aborts locally, stays uncertain, and retains the underlying world',async({page,context,baseURL})=>{
    let release;const waiting=new Promise(resolve=>{release=resolve;});
    const qa=await setup(page,context,baseURL,{respond:async(route,reply)=>{await waiting;await reply(route).catch(()=>{});}});
    await page.evaluate(()=>window.__engineBeforeContact=portfolioEngine);await open(page);await draft(page);await solve(page);await submit(page).click();await expect.poll(()=>qa.requests.length).toBe(1);
    await page.locator('[data-contact-close]').click();await expect(page).toHaveURL(/\/portfolio$/);release();
    expect(await page.evaluate(()=>window.__engineBeforeContact===portfolioEngine)).toBe(true);
    await page.goForward();await expect(form(page)).toHaveAttribute('data-contact-state','uncertain');await assertDraft(page);await expect(submit(page)).toBeDisabled();expect(qa.requests).toHaveLength(1);await assertSafe(qa);
  });
  test('accepted receipt survives reload; another message requires an explicit action',async({page,context,baseURL})=>{
    const qa=await setup(page,context,baseURL);await open(page);await draft(page);await solve(page);await submit(page).click();await expect(form(page)).toHaveAttribute('data-contact-state','accepted');
    await page.reload({waitUntil:'domcontentloaded'});await expect(form(page)).toHaveAttribute('data-contact-state','accepted');expect(qa.requests).toHaveLength(1);
    await page.locator('[data-contact-new-message]').click();await expect(page.locator('#contact-name')).toBeFocused();await expect(page.locator('#contact-message')).toHaveValue('');
    await draft(page);await solve(page,'second-token');await submit(page).click();await expect(form(page)).toHaveAttribute('data-contact-state','accepted');expect(qa.requests).toHaveLength(2);
    expect(qa.requests[0].headers['idempotency-key']).not.toBe(qa.requests[1].headers['idempotency-key']);await assertSafe(qa);
  });
  test('blocked receipt storage prevents transmission',async({page,context,baseURL})=>{
    await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError');};});
    const qa=await setup(page,context,baseURL);await open(page);await draft(page);await solve(page);await submit(page).click();
    await expect(status(page)).toContainText('Safe transmission is unavailable');expect(qa.requests).toHaveLength(0);await assertDraft(page);await assertSafe(qa);
  });
  test('closed shadow challenge remains reachable with keyboard in both directions',async({page,context,baseURL})=>{
    await page.addInitScript(()=>{window.__mockClosedShadow=true;});
    const qa=await setup(page,context,baseURL);await open(page);await draft(page);
    await expect.poll(()=>page.evaluate(()=>window.__turnstileTest?.renders.length||0)).toBe(1);
    await page.locator('#contact-message').focus();await page.keyboard.press('Tab');
    expect(await page.evaluate(()=>document.activeElement===window.__turnstileTest.shadowHost)).toBe(true);
    const frame=page.frames().find(frame=>frame.url().includes('/con05-mock-frame'));
    await frame.getByRole('button').focus();await page.keyboard.press('Tab');await expect(submit(page)).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    expect(await page.evaluate(()=>document.activeElement===window.__turnstileTest.shadowHost)).toBe(true);
    await frame.getByRole('button').focus();await page.keyboard.press('Shift+Tab');await expect(page.locator('#contact-message')).toBeFocused();
    await page.keyboard.press('Escape');await expect(page).toHaveURL(/\/portfolio$/);await assertSafe(qa);
  });
  test('five-minute token expiry requires a fresh challenge without a send',async({page,context,baseURL})=>{
    const qa=await setup(page,context,baseURL);await open(page);await draft(page);await page.clock.install();await solve(page);
    await page.clock.runFor(300001);await expect(page.locator('[data-contact-challenge-status]')).toContainText('expired');
    await submit(page).click();expect(qa.requests).toHaveLength(0);await assertDraft(page);await assertSafe(qa);
  });
  test('closing and reopening replaces the widget and ignores stale callbacks',async({page,context,baseURL})=>{
    const qa=await setup(page,context,baseURL);await open(page);await draft(page);await solve(page);
    await page.locator('[data-contact-close]').click();await expect(page).toHaveURL(/\/portfolio$/);await page.goForward();await expect(page.locator('[data-contact-widget] iframe')).toBeAttached();
    await page.evaluate(()=>window.__turnstileTest.callbacks[0].callback('stale-token'));await submit(page).click();expect(qa.requests).toHaveLength(0);
    await solve(page,'current-token');await submit(page).click();await expect(form(page)).toHaveAttribute('data-contact-state','accepted');expect(qa.requests[0].body.turnstileToken).toBe('current-token');await assertSafe(qa);
  });
});
