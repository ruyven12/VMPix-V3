
const fs=require('fs');
const {chromium}=require('./fixture.cjs');
async function main(){
  const browser=await chromium.launch({channel:'chrome',headless:true});
  try{
    const page=await browser.newPage();
    await page.setContent('<video controls src="http://127.0.0.1:4173/.codex_tmp/synch-s5/living-memories-412x915.webm"></video>');
    await page.waitForFunction(()=>document.querySelector('video').readyState>=1);
    console.log(await page.evaluate(()=>{
      const v=document.querySelector('video');
      return {duration:v.duration,width:v.videoWidth,height:v.videoHeight,error:v.error};
    }));
    await page.evaluate(()=>{document.querySelector('video').currentTime=20});
    await page.waitForFunction(()=>document.querySelector('video').readyState>=2);
    console.log('Video seek verified');
  }finally{await browser.close()}
  const a=fs.readFileSync(__dirname+'/modules--music.js.before','utf8');
  const b=fs.readFileSync('modules/music.js','utf8');
  const startA=a.indexOf('// S4: static previews only.');
  const startB=b.indexOf('// Synchronicity memories:');
  const tailA=a.indexOf('\nfunction renderMusicShowsArchive(options',startA);
  const tailB=b.indexOf('\nfunction renderMusicShowsArchive(options',startB);
  console.log('Music outside scene unchanged: '+(a.slice(0,startA)===b.slice(0,startB)&&a.slice(tailA)===b.slice(tailB)));
}
main().catch(e=>{console.error(e);process.exitCode=1});
