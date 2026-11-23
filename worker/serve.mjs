export default {async fetch(request,env){
  const path=new URL(request.url).pathname;
  if(path==='/api/registration'){
    try{return await registration(request,env.DB)}catch{return Response.json({error:'Registration is temporarily unavailable. Please try again.'},{status:503,headers:{'cache-control':'no-store'}})}
  }
  if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405});
  const asset=Object.hasOwn(ASSETS,path==='/'?'/index.html':path)?ASSETS[path==='/'?'/index.html':path]:null;
  if(!asset)return new Response('Page not found',{status:404});
  const bytes=Uint8Array.from(atob(asset[1]),c=>c.charCodeAt(0));
  const headers={'Content-Type':asset[0],'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache','Accept-Ranges':'bytes'};
  const range=request.headers.get('range');
  if(range){const m=/^bytes=(\d+)-(\d*)$/.exec(range);
    if(!m||Number(m[1])>=bytes.length)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+bytes.length}});
    const start=Number(m[1]),end=m[2]?Math.min(+m[2],bytes.length-1):bytes.length-1;
    if(end<start)return new Response(null,{status:416});
    headers['Content-Range']='bytes '+start+'-'+end+'/'+bytes.length;headers['Content-Length']=String(end-start+1);
    return new Response(request.method==='HEAD'?null:bytes.slice(start,end+1),{status:206,headers});
  }
  headers['Content-Length']=String(bytes.length);
  return new Response(request.method==='HEAD'?null:bytes,{headers});
}};