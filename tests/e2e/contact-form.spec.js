const {test,expect}=require('@playwright/test');
const fs=require('node:fs');
const path=require('node:path');
const sizes=[{width:360,height:800},{width:412,height:915},{width:1920,height:1080}];
const destinations={email:'mailto:ruyven12@gmail.com',instagram:'https://www.instagram.com/vmpix1',facebook:'https://www.facebook.com/VMPix',x:'https://x.com/vmpix1'};
const errors=new WeakMap();
test.beforeEach(async({page,context,baseURL})=>{
  errors.set(page,[]);page.on('pageerror',e=>errors.get(page).push(e.message));
  await context.route('**/*',route=>{
    const req=route.request(),url=new URL(req.url());
    if(!url.pathname.startsWith('/api/')&&(url.origin===new URL(baseURL).origin||['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname)||url.hostname==='unpkg.com'&&url.pathname.startsWith('/leaflet@1.9.4/dist/')))return route.continue();
    if(Object.values(destinations).includes(req.url()))return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Isolated channel check</title><p>Mock destination</p>'});
    if(req.resourceType()==='script')return route.fulfill({contentType:'application/javascript',body:''});
    if(req.resourceType()==='stylesheet')return route.fulfill({contentType:'text/css',body:''});
    return route.fulfill({status:503,headers:{'access-control-allow-origin':'*'},contentType:'application/json',body:'{}'});
  });
  await page.goto('/portfolio',{waitUntil:'domcontentloaded'});
  const reject=page.getByRole('button',{name:'Reject',exact:true});if(await reject.isVisible())await reject.click();
});
test.afterEach(async({page})=>expect(errors.get(page)).toEqual([]));
async function open(page){
  await page.waitForFunction(()=>canOpenContact());
  await page.evaluate(()=>navigateToRoute('/contact'));
  await expect(page.locator('[data-contact-overlay]')).toHaveAttribute('data-state','open');
  await expect(page.getByRole('button',{name:'Transmit Message',exact:true})).toBeEnabled();
  await page.evaluate(()=>document.fonts.ready);
}
async function valid(page){
  await page.getByLabel('Name',{exact:true}).fill('Local Test');
  await page.getByLabel('Email',{exact:true}).fill('test@example.com');
  await page.getByLabel('Subject',{exact:true}).fill('CON03-DRAFT');
  await page.getByLabel('Message',{exact:true}).fill('A local draft for verification.');
}
async function noNavigationTick(page){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}

for(const viewport of sizes)for(const reducedMotion of ['reduce','no-preference'])test.describe(`Contact form ${viewport.width}x${viewport.height} ${reducedMotion}`,()=>{
  test.use({viewport,contextOptions:{reducedMotion},serviceWorkers:'block'});
  test('required fields, email, limits and unavailable submission never transmit',async({page})=>{
    await open(page);
    const outbound=[];
    page.on('request',r=>{if(['fetch','xhr','document','ping'].includes(r.resourceType()))outbound.push({method:r.method(),type:r.resourceType()});});
    const submit=page.getByRole('button',{name:'Transmit Message',exact:true});
    await expect(page.locator('[data-contact-form]')).toHaveAttribute('method','dialog');
    await submit.click();
    await expect(page.getByLabel('Name',{exact:true})).toBeFocused();
    await expect(page.locator('[data-contact-input][aria-invalid="true"]')).toHaveCount(4);
    await expect(page.locator('[data-contact-feedback]')).toHaveText('Check the highlighted fields. Nothing has been sent.');
    for(const [name,limit]of Object.entries({name:100,email:254,subject:150,message:5000})){
      const field=page.locator('#contact-'+name);
      await expect(field).toHaveAttribute('required','');await expect(field).toHaveAttribute('maxlength',String(limit));
      await field.fill('   ');await submit.click();await expect(field).toHaveAttribute('aria-invalid','true');
      await field.fill('');await field.focus();await page.keyboard.insertText('a'.repeat(limit+1));
      expect((await field.inputValue()).length).toBe(limit);
      // Script-set over-limit values must also be rejected by local validation.
      await field.evaluate((el,n)=>{el.value='a'.repeat(n+1);el.dispatchEvent(new Event('input',{bubbles:true}));},limit);
      await submit.click();await expect(page.locator('#contact-'+name+'-error')).toContainText('characters or fewer');
      await field.fill('');
    }
    await valid(page);await page.getByLabel('Email',{exact:true}).fill('not-an-email');await submit.click();
    await expect(page.getByLabel('Email',{exact:true})).toBeFocused();
    await expect(page.locator('#contact-email-error')).toContainText('name@example.com');
    await page.getByLabel('Email',{exact:true}).fill('test@example.com');
    await expect(page.getByLabel('Email',{exact:true})).not.toHaveAttribute('aria-invalid','true');
    await page.getByLabel('Name',{exact:true}).focus();await page.keyboard.press('Enter');
    await expect(page.locator('[data-contact-feedback]')).toHaveText('Delivery is unavailable. Nothing was sent. Use a direct channel to get in touch.');
    await expect(page.locator('[data-contact-input][aria-invalid="true"]')).toHaveCount(0);
    await expect(page.getByLabel('Message',{exact:true})).toHaveValue('A local draft for verification.');
    await page.locator('[data-contact-form]').evaluate(el=>HTMLFormElement.prototype.submit.call(el));
    await noNavigationTick(page);await expect(page).toHaveURL(/\/contact$/);expect(outbound).toEqual([]);
    const storage=await page.evaluate(()=>JSON.stringify([localStorage,sessionStorage]));expect(storage).not.toContain('CON03-DRAFT');
  });
  test('form-first layout, growing message, keyboard viewport and in-memory return',async({page})=>{
    await open(page);await valid(page);
    const form=await page.locator('[data-contact-form]').boundingBox(),channels=await page.locator('.contact-channels').boundingBox();
    if(viewport.width<900)expect(channels.y).toBeGreaterThanOrEqual(form.y+form.height);
    else {
      expect(channels.x).toBeGreaterThan(form.x+form.width);expect(Math.abs(channels.y-form.y)).toBeLessThan(2);
      await page.locator('[data-contact-scroll]').evaluate(el=>el.scrollTop=0);
      expect(await page.locator('[data-contact-submit]').evaluate(el=>el.getBoundingClientRect().bottom<=document.querySelector('[data-contact-scroll]').getBoundingClientRect().bottom)).toBe(true);
    }
    const frame=await page.locator('[data-contact-frame]').boundingBox();
    const message=page.getByLabel('Message',{exact:true});
    await message.fill('A longer message line for the terminal.\n'.repeat(90));
    expect(await message.evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBe(true);
    expect(await message.evaluate(el=>el.clientHeight)).toBeGreaterThan(1000);
    await message.press('Control+End');
    expect(await message.evaluate(el=>el.scrollTop)).toBe(0);
    const after=await page.locator('[data-contact-frame]').boundingBox();expect(after.y).toBeCloseTo(frame.y);expect(after.height).toBeCloseTo(frame.height);
    await message.fill('A local draft for verification.');expect(await message.evaluate(el=>el.clientHeight)).toBeLessThan(200);
    await page.evaluate(()=>{Object.defineProperties(visualViewport,{offsetTop:{configurable:true,value:48},height:{configurable:true,value:280}});visualViewport.dispatchEvent(new Event('resize'));});
    await expect.poll(()=>page.locator('[data-contact-frame]').evaluate(el=>el.getBoundingClientRect().top)).toBeCloseTo(68,0);
    await page.getByLabel('Email',{exact:true}).focus();
    await expect.poll(()=>page.getByLabel('Email',{exact:true}).evaluate(el=>{const r=el.getBoundingClientRect(),v=document.querySelector('[data-contact-scroll]').getBoundingClientRect();return r.top>=v.top-1&&r.bottom<=v.bottom+1;})).toBe(true);
    await page.evaluate(()=>{delete visualViewport.offsetTop;delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));});
    await expect.poll(()=>page.locator('[data-contact-frame]').evaluate(el=>el.getBoundingClientRect().top)).toBeCloseTo(20,0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.keyboard.press('Escape');await expect(page).toHaveURL(/\/portfolio$/);await expect(page.locator('[data-contact-overlay]')).toBeHidden();
    await page.goForward();await expect(page.locator('[data-contact-overlay]')).toHaveAttribute('data-state','open');
    await expect(page.getByLabel('Subject',{exact:true})).toHaveValue('CON03-DRAFT');await expect(message).toHaveValue('A local draft for verification.');
    if(process.env.CONTACT_EVIDENCE_DIR&&reducedMotion==='no-preference'&&viewport.width<900){
      fs.mkdirSync(process.env.CONTACT_EVIDENCE_DIR,{recursive:true});
      await page.locator('[data-contact-channel="email"]').focus();
      await page.locator('[data-contact-scroll]').evaluate(el=>el.scrollTop=el.scrollHeight);
      await page.screenshot({path:path.join(process.env.CONTACT_EVIDENCE_DIR,`contact-channels--${viewport.width}x${viewport.height}.png`)});
    }
  });
  test('direct channels reuse Connect links and activate safely against mocks',async({page,context})=>{
    await open(page);
    for(const [channel,url]of Object.entries(destinations)){
      const link=page.locator(`[data-contact-channel="${channel}"]`);await expect(link).toHaveAttribute('href',url);
      expect(await page.locator('.connect-shell a').evaluateAll((links,url)=>links.some(a=>a.getAttribute('href')===url),url)).toBe(true);
      if(channel==='email'){
        // Exercise activation without launching a mail application or sending mail.
        await link.evaluate(el=>el.addEventListener('click',e=>{e.preventDefault();el.dataset.qaActivated='true';},{once:true}));
        await link.focus();await page.keyboard.press('Enter');await expect(link).toHaveAttribute('data-qa-activated','true');
      }else{
        await expect(link).toHaveAttribute('rel','noopener noreferrer');await expect(link).toHaveAttribute('target','_blank');
        const popupPromise=context.waitForEvent('page');await link.click();const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');
        await expect(popup).toHaveURL(url);expect(await popup.evaluate(()=>window.opener)).toBe(null);await popup.close();
      }
      await expect(page).toHaveURL(/\/contact$/);
    }
  });
});

test('missing Contact module fails closed without an HTTP form submission',async({page})=>{
  await page.route('**/modules/contact.js',r=>r.abort());
  await page.goto('/contact',{waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-contact-overlay]')).toHaveAttribute('data-state','open');
  await expect(page.getByLabel('Name',{exact:true})).toBeDisabled();await expect(page.locator('[data-contact-submit]')).toBeDisabled();
  await expect(page.locator('#contact-relay-description')).toContainText('Nothing will be sent');
  const outbound=[];page.on('request',r=>{if(['document','fetch','xhr','ping'].includes(r.resourceType()))outbound.push(r.method());});
  await page.locator('[data-contact-form]').evaluate(el=>HTMLFormElement.prototype.submit.call(el));
  await noNavigationTick(page);await expect(page).toHaveURL(/\/contact$/);expect(outbound).toEqual([]);
});

test.describe('Contact Android-style safe-area clearance',()=>{
  test.use({viewport:{width:412,height:915},isMobile:true,hasTouch:true,contextOptions:{reducedMotion:'reduce'},serviceWorkers:'block'});
  for(const bottom of [32,48])test(`touch Engine Back clears a ${bottom}px navigation inset`,async({page,context})=>{
    const cdp=await context.newCDPSession(page);
    await cdp.send('Emulation.setSafeAreaInsetsOverride',{insets:{top:24,bottom,left:0,right:0}});
    await open(page);
    const layout=await page.evaluate(()=>({
      frame:contactFrame.getBoundingClientRect().toJSON(),engine:portfolioEngine.getBoundingClientRect().toJSON(),
      back:prototypeEngineReturnControl.getBoundingClientRect().toJSON(),
      overflow:document.documentElement.scrollWidth>innerWidth,
    }));
    expect(layout.frame.y).toBeCloseTo(24,0);
    expect(layout.engine.top-layout.frame.bottom).toBeGreaterThanOrEqual(bottom-1);
    expect(layout.back.bottom).toBeLessThanOrEqual(915-bottom+1);
    expect(layout.overflow).toBe(false);
    await page.getByLabel('Name',{exact:true}).tap();await expect(page.getByLabel('Name',{exact:true})).toBeFocused();
    await page.touchscreen.tap(layout.back.x+layout.back.width/2,layout.back.y+layout.back.height/2);
    await expect(page).toHaveURL(/\/portfolio$/);await expect(page.locator('[data-contact-overlay]')).toBeHidden();
  });
});
