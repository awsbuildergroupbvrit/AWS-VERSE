// The supplied clip is already screened. Preserve its dots when sampling a cell instead
// of printing a second coarse screen on top of it. Other inputs/modes use renderRaster.
async function startPortrait(){
  const canvas=document.querySelector('#portrait'),image=document.querySelector('#source');
  const video=document.querySelector('#reference'),button=document.querySelector('#motion');
  await image.decode();
  const w=image.naturalWidth,h=image.naturalHeight,p=versePreset;
  const raw=buffer(w,h),rawCtx=raw.getContext('2d',{willReadFrequently:true});
  const raster=buffer(w,h),ink=raster.getContext('2d'),output=ink.createImageData(w,h);
  canvas.width=w;canvas.height=h;const g=canvas.getContext('2d');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let playing=!motion.matches,visible=true,frame=0,last=-200,prevVideoTime=-1;
  const genericPreset = p.renderMode!=='dither'||p.bgMode!=='none'||p.invert||p.edgeEmphasis||p.blurType!=='off'||p.tintOpacity||p.lights.enabled||p.mask.enabled||p.animStyle!=='shimmer'||p.toneCurve.some(pt=>pt.x!==pt.y)||Object.values(p.pfx).some(o=>o.enabled);
  if(genericPreset){rawCtx.drawImage(image,0,0,w,h);return mountRaster(canvas,raw,p)}
  function print(media,time){
    rawCtx.drawImage(media,0,0,w,h);
    const src=rawCtx.getImageData(0,0,w,h).data,out=output.data,s=p.cellSize;
    for(let y=0;y<h;y+=s)for(let x=0;x<w;x+=s){
      const endY=Math.min(y+s,h),endX=Math.min(x+s,w),n=(endY-y)*(endX-x);
      let red=0,green=0,blue=0;
      for(let yy=y;yy<endY;yy++)for(let xx=x;xx<endX;xx++){const k=(yy*w+xx)*4;red+=src[k];green+=src[k+1];blue+=src[k+2]}
      red/=n;green/=n;blue/=n;
      const lum=luma(red,green,blue);
      const enabled=noise(x,y)*100<p.coverage;
      const speed=p.animSpeed.enabled?p.animSpeed.intensity/100:0;
      const strength=p.animIntensity.enabled?p.animIntensity.intensity/100:0;
      const shimmer=p.animated&&p.animStyle==='shimmer'?1+.14*strength*Math.sin(x*.018+y*.012-time*3*speed):1;
      const threshold=Math.max(2,lum*255*(1-p.density/100)*.49);
      for(let yy=y;yy<endY;yy++)for(let xx=x;xx<endX;xx++){
        const k=(yy*w+xx)*4;
        const local=(src[k]*.213+src[k+1]*.715+src[k+2]*.072);
        out[k+3]=enabled&&local>threshold?255:0;
        if(!out[k+3])continue;
        out[k]=(src[k]*.85+red*.15)*shimmer;out[k+1]=(src[k+1]*.85+green*.15)*shimmer;out[k+2]=(src[k+2]*.85+blue*.15)*shimmer;
      }
    }
    ink.putImageData(output,0,0);g.clearRect(0,0,w,h);
    g.save();g.filter='brightness('+(100+p.brightness)+'%) contrast('+p.contrast+'%) saturate('+p.saturation+'%) grayscale('+p.grayscale+'%)';
    g.drawImage(raster,0,0);g.restore();
    // Occasional bounded horizontal tracking tears, independent of the saved raster preset.
    const phase=time%6.7;
    if(playing&&phase>5.9&&phase<6.13){
      for(let i=0;i<3;i++){const sy=Math.floor((.2+i*.16+Math.sin(time*16+i)*.03)*h),sh=3+i*2;
        g.drawImage(canvas,0,sy,w,sh,(i%2?-1:1)*(5+i*2),sy,w,sh)}
    }
  }
  function loop(now){if(!playing||!visible||document.hidden)return;
    if(now-last>65&&video.readyState>=2&&video.currentTime!==prevVideoTime){prevVideoTime=video.currentTime;print(video,now/1000);last=now}
    frame=requestAnimationFrame(loop);
  }
  function sync(){
    cancelAnimationFrame(frame);const running=playing&&visible&&!document.hidden;
    if(running){video.play().catch(()=>{});frame=requestAnimationFrame(loop)}else video.pause();
    document.body.classList.toggle('motion-off',!playing);
    document.querySelector('#motion-label').textContent=playing?'Pause motion':'Play motion';
    button.querySelector('.play-state').textContent=playing?'Ⅱ':'▷';button.setAttribute('aria-pressed',String(playing));
  }
  print(image,0);canvas.parentElement.classList.add('ready');sync();
  button.onclick=()=>{playing=!playing;sync()};
  motion.addEventListener('change',()=>{playing=!motion.matches;sync()});
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync()}).observe(canvas);
  document.addEventListener('visibilitychange',sync);
}
const revealPortrait = () => startPortrait().catch(()=>document.querySelector('#motion').hidden=true);
const entryDialog = document.querySelector('#site-intro');
if (entryDialog.open) entryDialog.addEventListener('close', revealPortrait, {once:true});
else revealPortrait();
