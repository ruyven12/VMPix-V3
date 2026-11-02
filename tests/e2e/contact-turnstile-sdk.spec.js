const { test, expect } = require('@playwright/test');

// Opt-in integration check against Cloudflare's real SDK using its documented
// always-pass TEST site key. Never submits a message or calls Siteverify.
// Run with CONTACT_REAL_TURNSTILE_TEST=1; ordinary regressions remain offline/mocked.
test.use({viewport:{width:412,height:915},contextOptions:{reducedMotion:'reduce'},serviceWorkers:'block',trace:'off'});
test.describe('Contact real Turnstile SDK (test key only)',()=>{
  test.skip(process.env.CONTACT_REAL_TURNSTILE_TEST!=='1','Explicit opt-in required for Cloudflare SDK network access.');

  test('renders and receives a Cloudflare-issued test token without submitting',async({page,context,baseURL})=>{
    const blocked=[];
    let sdkRequests=0;
    await context.route('**/*',async route=>{
      const request=route.request(),url=new URL(request.url());
      if(url.pathname==='/api/contact'||url.hostname==='formspree.io'||url.pathname.includes('/siteverify')){
        blocked.push('forbidden-submission');return route.abort();
      }
      if(url.origin===new URL(baseURL).origin&&request.resourceType()==='document'){
        const response=await route.fetch();
        const html=(await response.text()).replace(/data-contact-sitekey="[^"]*"/,'data-contact-sitekey="1x00000000000000000000AA"');
        return route.fulfill({response,body:html});
      }
      if(url.hostname==='challenges.cloudflare.com'){
        if(url.pathname==='/turnstile/v0/api.js')sdkRequests++;
        return route.continue();
      }
      if(url.origin===new URL(baseURL).origin&&!url.pathname.startsWith('/api/')||['fonts.googleapis.com','fonts.gstatic.com'].includes(url.hostname)||url.hostname==='unpkg.com'&&url.pathname.startsWith('/leaflet@1.9.4/dist/'))return route.continue();
      if(request.resourceType()==='script')return route.fulfill({contentType:'application/javascript',body:''});
      if(request.resourceType()==='stylesheet')return route.fulfill({contentType:'text/css',body:''});
      return route.fulfill({status:503,headers:{'access-control-allow-origin':'*'},contentType:'application/json',body:'{}'});
    });
    await page.goto('/contact',{waitUntil:'domcontentloaded'});
    await expect(page.locator('[data-contact-overlay]')).toHaveAttribute('data-state','open');
    await expect(page.locator('[data-contact-challenge-status]')).toHaveText('Security check complete.',{timeout:25000});
    // Return booleans only: never print, persist or transmit the token.
    const result=await page.evaluate(()=>{
      const token=window.turnstile.getResponse();
      return {validTestToken:typeof token==='string'&&token.length>0&&token.length<=2048&&!/[^\x21-\x7e]/.test(token)&&!window.turnstile.isExpired(),
        callbackCleaned:Object.keys(window).every(key=>!key.startsWith('__v3ContactTurnstileLoaded'))};
    });
    expect(result).toEqual({validTestToken:true,callbackCleaned:true});
    await expect(page.locator('[data-contact-form]')).toHaveAttribute('data-contact-state','ready');
    expect(sdkRequests).toBe(1);expect(blocked).toEqual([]);
    await page.locator('[data-contact-close]').click();await expect(page).toHaveURL(/\/portfolio$/);
    await expect(page.locator('[data-contact-widget]')).toBeEmpty();
  });
});
