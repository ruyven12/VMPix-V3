
const fs=require('fs'),base=require('C:/Users/deysx/Documents/New project/.codex_tmp/synch-s2/fixture.cjs');
const old='C:/Users/deysx/Documents/New project/.codex_tmp/band-b2';
const read=name=>JSON.parse(fs.readFileSync(__dirname+'/'+name+'-live.json','utf8'));
const rows=read('shows').data;
const albums=Object.fromEntries(['zsRbjf','LztvDF','MfPF76','cs6ZWP'].map(id=>[id,read(id)]));
const bytes=[fs.readFileSync(old+'/zsRbjf.jpg'),fs.readFileSync(old+'/KR7MQx.jpg')];
const synthetic=(n=5)=>Array.from({length:n},(_,i)=>({...rows.find(s=>s.show_id===239),show_id:9500+i,name:'S5 test performance '+i,date:'2026-06-04',poster:'',smug_albums:[{status:'resolved',album_id:'S5QA'+i,photo_count:4}]}));
async function setup(browser,o={}){
 const f=await base.setup(browser,o),calls=[],images=[];let active=0,peak=0,imgActive=0,imgPeak=0,release;
 const gate=o.hold?new Promise(r=>release=r):null;

 if(o.accelerated)await f.context.route(base.front+'/modules/music.js',r=>{
  let s=fs.readFileSync(base.root+'/modules/music.js','utf8'),a=s.indexOf('// Synchronicity memories:'),z=s.indexOf('\nfunction renderMusicShowsArchive',a);
  let scene=s.slice(a,z).replace('[8400, 9700, 11100, 9000, 11800]','[84, 97, 111, 90, 118]').replace('[8200, 9200, 10200, 11200, 12000]','[82, 92, 102, 112, 120]').replace('900 -','9 -').replace('interval - 700','interval - 7').replace('duration: 700','duration: 7');
  return r.fulfill({contentType:'application/javascript',body:s.slice(0,a)+scene+s.slice(z)});
 });
 const selected=o.rows||rows;
 await f.context.route('https://vmpix-data.onrender.com/api/music/shows/db*',r=>r.fulfill({status:o.showError?503:200,contentType:'application/json',body:JSON.stringify(o.showError?{error:'S5 test outage'}:{ok:true,data:selected,meta:{pagination:{total:selected.length,page:1,totalPages:1}}})}));
 await f.context.route('**/api/music/smugmug/albums/*/photos*',async r=>{
  const u=new URL(r.request().url()),id=u.pathname.split('/').at(-2),limit=+u.searchParams.get('limit'),start=+u.searchParams.get('start');
  calls.push({id,limit,start,at:Date.now()});active++;peak=Math.max(peak,active);
  if(gate)await gate;if(o.photoDelay)await new Promise(r=>setTimeout(r,o.photoDelay));active--;
  let photos=id.startsWith('S5QA')?Array.from({length:o.single?1:4},(_,i)=>({image_key:id+'-'+i,medium_url:base.front+'/s5-test/'+id+'/'+(o.duplicates?0:i)+'.jpg'})):albums[id]?.photos||[];
  const total=photos.length;photos=photos.slice(start-1,start-1+limit);
  try{await r.fulfill({status:o.photoError?503:200,contentType:'application/json',body:JSON.stringify({ok:true,album_id:id,photos:o.noPhotos?[]:photos,has_more:start-1+limit<total,next_start:start+limit,total})});}catch{}
 });
 await f.context.route(base.front+'/s5-test/**',async r=>{
  images.push(r.request().url());imgActive++;imgPeak=Math.max(imgPeak,imgActive);
  if(o.imageDelay)await new Promise(r=>setTimeout(r,o.imageDelay));imgActive--;
  try{if(o.imageError&& !r.request().url().endsWith('/0.jpg'))await r.abort();else await r.fulfill({contentType:'image/jpeg',body:bytes[Number(r.request().url().match(/(\d).jpg$/)?.[1]||0)%2]});}catch{}
 });
 return {...f,calls,images,release,get peak(){return peak},get imgPeak(){return imgPeak}};
}
module.exports={...base,setup,rows,albums,synthetic};
