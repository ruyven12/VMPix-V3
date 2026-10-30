// Run with: node --test tests/admin-calendar-authorization.test.cjs
// The Admin controller is a browser IIFE. Exercise its actual pure validator
// without adding production exports or loading authentication/network code.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../modules/admin.js'), 'utf8');
const api = source.match(/const API = "([^"]+)";/)?.[1];
assert(api, 'Existing Admin API origin must be present');
function declaration(name) {
  const start = source.indexOf(`  function ${name}(`);
  const end = source.indexOf('\n  function ', start + 1);
  assert(start >= 0 && end > start, `Missing ${name}`);
  return source.slice(start, end);
}
const serverNow = Date.parse('2030-01-01T12:00:00.000Z');
const lifetime = 600000;
function validateAt(browserNow, data) {
  class BrowserDate extends Date { static now() { return browserNow; } }
  const context = vm.createContext({ Date: BrowserDate, URL, API: api });
  const validate = vm.runInContext(`${declaration('expiry')}\n${declaration('validCalendarAuthorization')}\nvalidCalendarAuthorization`, context);
  return validate(data);
}
function response(expires = serverNow + lifetime) {
  const url = new URL('https://app.todoist.com/oauth/authorize');
  Object.entries({ client_id: 'mock-client', scope: 'data:read', state: 's'.repeat(43), response_type: 'code',
    redirect_uri: new URL('/api/calendar/oauth/callback', api).href,
    code_challenge_method: 'S256', code_challenge: 'c'.repeat(43) }).forEach(([key, value]) => url.searchParams.set(key, value));
  return { authorization_url: url.href, expires_at: new Date(expires).toISOString() };
}

test('accepts the backend ten-minute expiry with synchronized clocks', () => {
  const data = response(), actual = validateAt(serverNow, data);
  assert(actual);
  assert.equal(actual.href, data.authorization_url);
  assert.equal(actual.deadline, serverNow + lifetime);
});

for (const behind of [1, 1000, 60000, 300000, 3600000]) {
  test(`accepts a fresh HTTP 200 payload when the browser is ${behind}ms behind the server`, () => {
    const browserNow = serverNow - behind, data = response(), actual = validateAt(browserNow, data);
    assert(actual, 'Clock difference must not invalidate an otherwise safe authorization link');
    assert.equal(actual.href, data.authorization_url, 'The server URL and OAuth fields must remain unchanged');
    assert.equal(actual.deadline, browserNow + lifetime, 'Limit local presentation to ten minutes');
  });
}
for (const ahead of [1, 1000, 60000, 300000]) {
  test(`accepts a still-future expiry when the browser is ${ahead}ms ahead`, () => {
    const actual = validateAt(serverNow + ahead, response());
    assert(actual);
    assert.equal(actual.deadline, serverNow + lifetime, 'Never extend an earlier expiry');
  });
}
test('accounts conservatively for elapsed response time', () => {
  const actual = validateAt(serverNow + 15000, response());
  assert(actual);
  assert.equal(actual.deadline, serverNow + lifetime);
});
test('accepts a valid link immediately before its expiry', () => {
  assert.equal(validateAt(serverNow + lifetime - 1, response()).deadline, serverNow + lifetime);
});
for (const age of [0, 1, 60000]) {
  test(`rejects a link at or after its browser-observed expiry (${age}ms elapsed)`, () => {
    assert.equal(validateAt(serverNow + lifetime + age, response()), null);
  });
}
for (const value of [undefined, null, '', 'invalid', 1893499800000, '2030-01-01T12:10:00Z']) {
  test(`rejects missing, malformed or noncanonical expiry ${JSON.stringify(value)}`, () => {
    assert.equal(validateAt(serverNow, { ...response(), expires_at: value }), null);
  });
}
test('a far-future server timestamp cannot extend the local link display beyond ten minutes', () => {
  const actual = validateAt(serverNow, response(serverNow + 365 * 86400000));
  assert(actual);
  assert.equal(actual.deadline, serverNow + lifetime);
});

const invalidUrls = {
  'HTTP': url => { url.protocol = 'http:'; },
  'lookalike Todoist host': url => { url.hostname = 'app.todoist.com.evil.test'; },
  'unexpected port': url => { url.port = '444'; },
  'URL credentials': url => { url.username = 'unexpected'; },
  'unexpected path': url => { url.pathname = '/other'; },
  'fragment': url => { url.hash = 'unexpected'; },
  'duplicate state': url => { url.searchParams.append('state', 's'.repeat(43)); },
  'invalid state': url => { url.searchParams.set('state', 'invalid'); },
  'missing state': url => { url.searchParams.delete('state'); },
  'write scope': url => { url.searchParams.set('scope', 'data:read_write'); },
  'wrong response type': url => { url.searchParams.set('response_type', 'token'); },
  'missing client ID': url => { url.searchParams.delete('client_id'); },
  'plain PKCE': url => { url.searchParams.set('code_challenge_method', 'plain'); },
  'invalid PKCE challenge': url => { url.searchParams.set('code_challenge', 'invalid'); },
  'missing PKCE challenge': url => { url.searchParams.delete('code_challenge'); },
  'wrong callback origin': url => { url.searchParams.set('redirect_uri', 'https://evil.test/api/calendar/oauth/callback'); },
  'wrong callback path': url => { url.searchParams.set('redirect_uri', new URL('/other', api).href); },
  'callback query': url => { url.searchParams.set('redirect_uri', new URL('/api/calendar/oauth/callback?unexpected=1', api).href); },
  'unexpected OAuth field': url => { url.searchParams.set('client_secret', 'mock-forbidden-field'); }
};
for (const [name, mutate] of Object.entries(invalidUrls)) {
  test(`clock-skew acceptance preserves rejection of ${name}`, () => {
    const data = response(), url = new URL(data.authorization_url);
    mutate(url);
    assert.equal(validateAt(serverNow - 60000, { ...data, authorization_url: url.href }), null);
  });
}
