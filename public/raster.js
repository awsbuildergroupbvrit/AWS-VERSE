/* Canvas2D raster recipe. The poster is the input image. All distances are in source pixels. */
const versePreset = {
  renderMode:'dither',bgMode:'none',bgBlur:12,bgOpacity:90,cellSize:9,coverage:100,invert:false,
  styleBlend:'source-over',charSet:'standard',customChars:'',brightness:0,contrast:158,edgeEmphasis:0,
  density:20,toneCurve:[{x:0,y:0},{x:1,y:1}],tint:'#3ca6ff',tintOpacity:0,overlayBlend:'multiply',
  saturation:100,grayscale:0,blurType:'off',blurAmount:35,blurAngle:0,directionalBothSides:false,
  tiltFocus:35,tiltPosition:50,tiltFeather:15,lensFocus:40,blurCenterX:50,blurCenterY:50,
  progressivePosition:55,progressiveReverse:false,
  pfx:Object.fromEntries(Object.entries({vignette:38,scanLines:40,chromatic:15,bloom:25,filmGrain:30,glitch:20,pixelate:15,halftone:20,filmDust:20}).map(([k,intensity])=>[k,{enabled:false,intensity}])),
  animated:true,animStyle:'shimmer',animSpeed:{enabled:true,intensity:100},animIntensity:{enabled:true,intensity:60},
  lights:{enabled:false,points:[]},mask:{enabled:false,tool:'freehand',brushSize:30,showOverlay:false,invert:false,dataUrl:null,shapes:[]}
};
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const buffer=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const luma=(r,g,b)=>(.2126*r+.7152*g+.0722*b)/255;
const noise=(x,y)=>{let n=Math.imul(x+1,374761393)^Math.imul(y+1,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296};
const ramps={standard:' .:-=+*#%@',blocks:' ░▒▓█',binary:'01',letters:' .ilrtfhnMW'};
function polygon(g,x,y,r,n,inner=1,rotation=-Math.PI/2){
  g.beginPath();
  for(let i=0;i<n;i++){const a=rotation+i*Math.PI*2/n,s=r*(i%2?inner:1);const px=x+Math.cos(a)*s,py=y+Math.sin(a)*s;i?g.lineTo(px,py):g.moveTo(px,py)}
  g.closePath();g.fill();
}
function primitive(g,mode,x,y,s,t,rgb,lower,p){
  const size=s*(.24+.76*t),r=size/2,cx=x+s/2,cy=y+s/2;
  g.fillStyle=g.strokeStyle=rgb;g.lineWidth=Math.max(1,s*.13);
  const line=(x1,y1,x2,y2)=>{g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()};
  const circle=(radius,fill=true)=>{g.beginPath();g.arc(cx,cy,radius,0,Math.PI*2);fill?g.fill():g.stroke()};
  const glyph=(str)=>{g.font=Math.max(2,Math.floor(s*(.72+.35*t)))+'px monospace';g.fillText(str,cx,cy)};
  if(mode==='mixed')mode=['cross','dots','diamond','lines'][Math.floor(noise(x,y)*4)];
  switch(mode){
    case 'characters':{const chars=Array.from(p.customChars||ramps[p.charSet]||ramps.standard);glyph(chars[Math.round(t*(chars.length-1))]);break}
    case 'hexdump':glyph(Math.round(t*15).toString(16).toUpperCase());break;
    case 'braille':glyph(String.fromCodePoint(0x2800+Math.round(t*255)));break;
    case 'matrix':g.fillStyle='rgb(15,'+Math.round(70+t*185)+',75)';glyph(noise(x,y)>.5?'1':'0');break;
    case 'dots':circle(r);break;
    case 'rings':circle(Math.max(.5,r-g.lineWidth/2),false);break;
    case 'bubbles':circle(r);g.fillStyle='rgba(255,255,255,.6)';g.beginPath();g.arc(cx-r*.27,cy-r*.35,r*.23,0,7);g.fill();break;
    case 'cross':line(cx-r,cy,cx+r,cy);line(cx,cy-r,cx,cy+r);break;
    case 'lines':line(cx-r,cy,cx+r,cy);break;
    case 'diagonal':line(cx-r,cy+r,cx+r,cy-r);break;
    case 'hatch':line(x,y+s,x+s,y);if(t>.45)line(x,y,x+s,y+s);if(t>.75)line(x,y+s*.5,x+s*.5,y);break;
    case 'stars':polygon(g,cx,cy,r,10,.42);break;
    case 'hexagons':polygon(g,cx+(Math.floor(y/s)%2)*s*.5,cy,r,6);break;
    case 'triangles':polygon(g,cx,cy,size*.62,3,1,((x+y)/s)%2?Math.PI/2:-Math.PI/2);break;
    case 'diamond':polygon(g,cx,cy,r,4);break;
    case 'hearts':g.beginPath();g.moveTo(cx,cy+r);g.bezierCurveTo(cx-r*2,cy-r*.6,cx-r*.6,cy-r*1.5,cx,cy-r*.4);g.bezierCurveTo(cx+r*.6,cy-r*1.5,cx+r*2,cy-r*.6,cx,cy+r);g.fill();break;
    case 'voxel':polygon(g,cx,cy,r,6);g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+r*.866,cy-r*.5);g.lineTo(cx+r*.866,cy+r*.5);g.lineTo(cx,cy+r);g.fill();break;
    case 'lego':g.fillRect(x,y,s-1,s-1);g.fillStyle='rgba(255,255,255,.28)';circle(s*.25);break;
    case 'disco':g.fillStyle='hsl('+((t*280+x*.3)%360)+' 85% '+(22+t*48)+'%)';g.fillRect(x+1,y+1,s-2,s-2);break;
    case 'halfblocks':g.fillRect(x,y,s,s/2);g.fillStyle=lower;g.fillRect(x,y+s/2,s,s/2);break;
    case 'mosaic':g.fillRect(x+.5,y+.5,s-1,s-1);break;
    default:g.fillRect(x,y,s,s);
  }
}
function renderRaster(source,p){
  const w=source.width,h=source.height,layer=buffer(w,h),g=layer.getContext('2d');
  const pixels=source.getContext('2d').getImageData(0,0,w,h).data;
  const s=Math.max(2,Math.round(p.cellSize)),cols=Math.ceil(w/s),rows=Math.ceil(h/s);
  const grid=new Array(cols*rows),rgb=a=>'rgb('+a.map(Math.round).join(',')+')';
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const sum=[0,0,0],lower=[0,0,0];let n=0,bottom=0;
    const x=i*s,y=j*s,ex=Math.min(w,x+s),ey=Math.min(h,y+s);
    for(let yy=y;yy<ey;yy++)for(let xx=x;xx<ex;xx++){
      let k=(yy*w+xx)*4;n++;
      const low=yy>=y+Math.floor((ey-y)/2);if(low)bottom++;
      for(let c=0;c<3;c++){sum[c]+=pixels[k+c];if(low)lower[c]+=pixels[k+c]}
    }
    const color=sum.map(v=>v/n),below=lower.map(v=>v/Math.max(1,bottom));
    grid[j*cols+i]={color,below,upper:sum.map((v,c)=>(v-lower[c])/Math.max(1,n-bottom)),lum:luma(...color)};
  }
  const dither=p.renderMode==='dither'?g.createImageData(w,h):null;
  g.textAlign='center';g.textBaseline='middle';
  const curve=p.toneCurve;
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    if(noise(i,j)*100>=p.coverage)continue;
    const cell=grid[j*cols+i],x=i*s,y=j*s,raw=cell.lum;
    const edge=Math.abs(raw-grid[j*cols+Math.max(0,i-1)].lum)+Math.abs(raw-grid[Math.max(0,j-1)*cols+i].lum);
    let t=clamp(raw+edge*p.edgeEmphasis/100);
    if(curve?.length>1){const k=curve.findIndex(pt=>pt.x>=t);if(k>0){const a=curve[k-1],b=curve[k];t=a.y+(t-a.x)*(b.y-a.y)/(b.x-a.x||1)}}
    t=clamp(t*(.8+p.density/100));if(p.invert)t=1-t;
    const adjust=v=>clamp((p.invert?255-v:v)+(t-(p.invert?1-raw:raw))*255,0,255);
    if(dither){
      // Each cell is a three-by-three ordered screen. Only occupied dots receive ink.
      const dot = Math.max(1, Math.round(s/3));
      const screen = [0,7,3,6,5,2,4,1,8];
      const coverage = clamp(.2 + Math.sqrt(t)*.8);
      const intensity = 1/Math.max(.42,coverage);
      const ink = cell.color.map(v=>Math.min(255,adjust(v)*intensity*1.25));
      for(let yy=y;yy<Math.min(h,y+s);yy++)for(let xx=x;xx<Math.min(w,x+s);xx++){
        const dx=xx-x,dy=yy-y,index=(Math.floor(dy/dot)%3)*3+Math.floor(dx/dot)%3;
        if((screen[index]+.5)/9>coverage)continue;
        const k=(yy*w+xx)*4;
        const edge=(dx%dot===dot-1||dy%dot===dot-1)?.78:1;
        for(let c=0;c<3;c++)dither.data[k+c]=ink[c]*edge;
        dither.data[k+3]=255;
      }
    }else if(p.renderMode==='contour'){
      const neighbors=[grid[j*cols+Math.min(cols-1,i+1)],grid[Math.min(rows-1,j+1)*cols+i]];
      g.strokeStyle=rgb(cell.color.map(adjust));g.lineWidth=Math.max(1,s/4);
      if(neighbors.some(v=>Math.floor(v.lum*(4+p.density/6))!==Math.floor(raw*(4+p.density/6)))){g.beginPath();g.moveTo(x,y+s/2);g.quadraticCurveTo(x+s/2,y+s*t,x+s,y+s/2);g.stroke()}
    }else primitive(g,p.renderMode,x,y,s,t,rgb((p.renderMode==='halfblocks'?cell.upper:cell.color).map(adjust)),rgb(cell.below.map(adjust)),p);
  }
  if(dither)g.putImageData(dither,0,0);
  const scene=buffer(w,h),ctx=scene.getContext('2d');
  ctx.globalAlpha=p.bgOpacity/100;
  if(p.bgMode==='solid'){ctx.fillStyle=p.bgColor||'#171020';ctx.fillRect(0,0,w,h)}
  else if(p.bgMode!=='none'){if(p.bgMode==='blurred'||p.bgMode==='blur')ctx.filter='blur('+p.bgBlur+'px)';ctx.drawImage(source,0,0)}
  ctx.globalAlpha=1;ctx.filter='none';ctx.globalCompositeOperation=p.styleBlend;
  ctx.filter='brightness('+(100+p.brightness)+'%) contrast('+p.contrast+'%) saturate('+p.saturation+'%) grayscale('+p.grayscale+'%)';ctx.drawImage(layer,0,0);
  ctx.filter='none';ctx.globalCompositeOperation=p.overlayBlend;
  if(p.tintOpacity){ctx.globalAlpha=p.tintOpacity/100;ctx.fillStyle=p.tint;ctx.fillRect(0,0,w,h)}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  if(p.blurType!=='off'&&p.blurAmount>0)applyBlur(scene,p);
  postEffects(scene,p);
  if(p.lights.enabled)for(const light of p.lights.points){
    const radius=light.radius<=1?light.radius*w:light.radius;
    if(radius<=0)continue;
    const x=w*light.x,y=h*light.y,glow=ctx.createRadialGradient(x,y,0,x,y,radius);
    glow.addColorStop(0,light.color||'#fff');glow.addColorStop(1,'transparent');ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=clamp(light.intensity>1?light.intensity/100:light.intensity);ctx.fillStyle=glow;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);ctx.restore();
  }
  return scene;
}
function applyBlur(scene,p){
  const {width:w,height:h}=scene,g=scene.getContext('2d'),soft=buffer(w,h),b=soft.getContext('2d');
  if(p.blurType==='directional'||p.blurType==='motion'){
    const a=p.blurAngle*Math.PI/180;
    for(let i=0;i<20;i++){const d=(i/19-(p.directionalBothSides?.5:0))*p.blurAmount;b.globalAlpha=1/(i+1);b.drawImage(scene,Math.cos(a)*d,Math.sin(a)*d)}
  }else {b.filter='blur('+p.blurAmount+'px)';b.drawImage(scene,0,0);b.filter='none'}
  let mask;
  if(p.blurType.includes('tilt')){const y=h*p.tiltPosition/100,r=Math.max(1,h*(p.tiltFocus+p.tiltFeather)/200);mask=b.createLinearGradient(0,y-r,0,y+r);mask.addColorStop(0,'white');mask.addColorStop(.5,'transparent');mask.addColorStop(1,'white')}
  if(p.blurType==='lens'){const x=w*p.blurCenterX/100,y=h*p.blurCenterY/100;mask=b.createRadialGradient(x,y,0,x,y,Math.max(1,Math.min(w,h)*p.lensFocus/100));mask.addColorStop(0,'transparent');mask.addColorStop(1,'white')}
  if(p.blurType==='progressive'){mask=b.createLinearGradient(0,0,0,h);mask.addColorStop(clamp(p.progressivePosition/100),p.progressiveReverse?'white':'transparent');mask.addColorStop(1,p.progressiveReverse?'transparent':'white')}
  if(mask){b.globalCompositeOperation='destination-in';b.fillStyle=mask;b.fillRect(0,0,w,h)}
  g.drawImage(soft,0,0);
}
function postEffects(scene,p){
  const {width:w,height:h}=scene,g=scene.getContext('2d');
  for(const [name,effect] of Object.entries(p.pfx)){
    if(!effect.enabled||!effect.intensity)continue;
    const k=effect.intensity/100;g.save();
    switch(name){
      case 'scanLines':g.fillStyle='rgba(0,0,0,'+k*.7+')';for(let y=0;y<h;y+=5)g.fillRect(0,y,w,2);break;
      case 'vignette':{const grad=g.createRadialGradient(w/2,h/2,h*.15,w/2,h/2,Math.hypot(w,h)/2);grad.addColorStop(0,'transparent');grad.addColorStop(1,'rgba(0,0,0,'+k+')');g.fillStyle=grad;g.fillRect(0,0,w,h);break}
      case 'bloom':g.globalCompositeOperation='screen';g.globalAlpha=k;g.filter='blur(12px)';g.drawImage(scene,0,0);break;
      case 'chromatic':{const a=g.getImageData(0,0,w,h),src=a.data.slice(),shift=Math.ceil(k*12);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;a.data[i]=src[(y*w+Math.min(w-1,x+shift))*4];a.data[i+2]=src[(y*w+Math.max(0,x-shift))*4+2]}g.putImageData(a,0,0);break}
      case 'filmGrain':case 'filmDust':case 'halftone':{const step=name==='filmDust'?22:4;for(let y=0;y<h;y+=step)for(let x=0;x<w;x+=step){const n=noise(x,y);if(name==='filmDust'&&n<.93)continue;g.fillStyle=n>.5&&name!=='halftone'?'white':'black';g.globalAlpha=k*(name==='halftone'?.48:n*.42);g.fillRect(x,y,name==='filmDust'?3:1.6,name==='filmDust'?7:1.6)}break}
      case 'pixelate':{const f=1+Math.round(k*18),small=buffer(Math.max(1,w/f|0),Math.max(1,h/f|0));small.getContext('2d').drawImage(scene,0,0,small.width,small.height);g.imageSmoothingEnabled=false;g.drawImage(small,0,0,w,h);break}
      case 'glitch':for(let n=0;n<8*k;n++){const y=noise(n,8)*h;g.drawImage(scene,0,y,w,5+10*k,(noise(n,2)-.5)*60*k,y,w,5+10*k)}break;
    }
    g.restore();
  }
}
async function mountRaster(canvas,source,p){
  const scene=renderRaster(source,p),w=source.width,h=source.height;
  const width=Math.min(1280,w);canvas.width=width;canvas.height=Math.round(width*h/w);
  const g=canvas.getContext('2d'),motion=document.querySelector('#motion'),label=document.querySelector('#motion-label');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let active=!reduced.matches&&(p.animated||p.renderMode==='matrix'),visible=true,frame=0,last=-999,time=0,previous=0,reveal;
  if(p.mask.enabled&&p.mask.dataUrl){
    const mask=new Image();mask.src=p.mask.dataUrl;await mask.decode();reveal=buffer(w,h);
    const m=reveal.getContext('2d');m.drawImage(source,0,0);m.globalCompositeOperation=p.mask.invert?'destination-out':'destination-in';m.drawImage(mask,0,0,w,h);
  }
  function paint(ms){
    const cw=canvas.width,ch=canvas.height;g.clearRect(0,0,cw,ch);g.drawImage(scene,0,0,cw,ch);
    const k=p.animIntensity.enabled?p.animIntensity.intensity/100:0,t=ms*.001*(p.animSpeed.enabled?p.animSpeed.intensity/100:0);
    g.save();g.globalCompositeOperation='source-atop';
    if(p.animated&&k){
      if(p.animStyle==='shimmer'||p.animStyle==='wave'){
        const start=(t*.22%1.5-.3)*cw;
        const gr=g.createLinearGradient(start,0,start+cw*.24,ch*.24);gr.addColorStop(0,'transparent');gr.addColorStop(.52,'rgba(215,180,255,'+(.17*k)+')');gr.addColorStop(1,'transparent');g.fillStyle=gr;g.fillRect(0,0,cw,ch);
        if(p.animStyle==='wave'){g.globalAlpha=.15*k;for(let y=0;y<ch;y+=6)g.drawImage(scene,0,y*h/ch,w,6*h/ch,Math.sin(y/28+t*3)*6,y,cw,6)}
      }else if(p.animStyle==='ripple'){g.strokeStyle='rgba(218,186,255,'+(.42*k)+')';g.lineWidth=4;g.beginPath();g.arc(cw/2,ch/2,t*.25%1*cw*.7,0,7);g.stroke()}
      else{g.fillStyle='rgba(230,208,255,'+(k*.12*(p.animStyle==='flicker'?noise(Math.floor(t*7),2):(.5+.5*Math.sin(t*2))))+')';g.fillRect(0,0,cw,ch)}
    }
    g.restore();
    if(p.renderMode==='matrix'){g.fillStyle='#7effa5';g.font='11px monospace';for(let x=0;x<cw;x+=15)g.fillText((Math.floor(t*3+x)%2).toString(),x,((t*70+noise(x,7)*ch)%ch))}
    if(reveal)g.drawImage(reveal,0,0,cw,ch);
  }
  function loop(now){frame=0;if(!active||!visible||document.hidden)return;if(previous)time+=Math.min(now-previous,100);previous=now;if(now-last>=55){paint(time);last=now}frame=requestAnimationFrame(loop)}
  function sync(){cancelAnimationFrame(frame);previous=0;motion.setAttribute('aria-pressed',String(active));label.textContent=active?'Pause effect':'Play effect';motion.querySelector('.play-state').textContent=active?'Ⅱ':'▷';if(active&&visible&&!document.hidden)frame=requestAnimationFrame(loop)}
  paint(0);canvas.parentElement.classList.add('ready');sync();motion.onclick=()=>{active=!active;sync()};
  reduced.addEventListener('change',()=>{active=!reduced.matches;sync()});
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync()}).observe(canvas);
  document.addEventListener('visibilitychange',sync);
}