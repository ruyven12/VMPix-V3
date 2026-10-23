const fs=require('fs'),path=require('path');
const previous='C:/Users/deysx/Documents/New project/.codex_tmp';
const base=require(previous+'/synch-s2/fixture.cjs');
const b2=require(previous+'/band-b2/fixture.cjs');
const posterRows=require(previous+'/band-b5e/fixture.cjs').shows;
const actualRows=[...b2.shows,...posterRows];
const photo=b2.photos.zsRbjf.photos[0],photoBytes=fs.readFileSync(previous+'/band-b2/zsRbjf.jpg');
async function setup(browser,o={}){
 const f=await base.setup(browser,o),calls=[];let active=0,peak=0;let release;const gate=o.hold?new Promise(r=>release=r):null;
 const rows=o.rows||actualRows;
 await f.context.route('https://vmpix-data.onrender.com/api/music/shows/db*',r=>r.fulfill({status:o.showError?503:200,contentType:'application/json',body:JSON.stringify(o.showError?{error:'Simulated S4 failure'}:{ok:true,data:rows,meta:{pagination:{total:rows.length,totalPages:1,page:1}}})}));
 await f.context.route('**/api/music/smugmug/albums/*/photos*',async r=>{const u=new URL(r.request().url()),id=u.pathname.split('/').at(-2);calls.push({id,limit:u.searchParams.get('limit'),start:u.searchParams.get('start')});active++;peak=Math.max(peak,active);if(gate)await gate;if(o.photoDelay)await new Promise(resolve=>setTimeout(resolve,o.photoDelay));active--;const p=id.startsWith('S4QA')?{...photo,medium_url:base.front+'/s4-fixture/'+(o.duplicateImages?'same':id)+'.jpg'}:photo;return r.fulfill({status:o.photoError?503:200,contentType:'application/json',body:JSON.stringify(o.photoError?{error:'Simulated photo failure'}:{ok:true,photos:o.noPhotos?[]:[p],has_more:true,next_start:2,total:78})});});
 await f.context.route(photo.medium_url,r=>o.imageError?r.abort():r.fulfill({contentType:'image/jpeg',body:photoBytes}));
 await f.context.route(base.front+'/s4-fixture/**',r=>o.imageError?r.abort():r.fulfill({contentType:'image/jpeg',body:photoBytes}));
 if(o.posterError)for(const row of rows.filter(r=>r.poster))await f.context.route(row.poster,r=>r.abort());
 return{...f,memoryCalls:calls,release,get peakRequests(){return peak;}};
}
const synthetic=(count=8)=>Array.from({length:count},(_,i)=>({...b2.shows[0],show_id:9100+i,name:'S4 test performance '+i,date:'6/4/26',poster:'',smug_albums:[{status:'resolved',album_id:'S4QA'+i,photo_count:20}]}));
module.exports={...base,setup,actualRows,synthetic,photo};
