import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {existsSync,readFileSync,mkdirSync} from 'node:fs';
import worker from './dist/server/index.js';
mkdirSync('.local',{recursive:true});
const file=process.env.VERSE_PREVIEW_DB||'.local/preview.sqlite';
const existing=file!==':memory:'&&existsSync(file);
const sqlite=new DatabaseSync(file);
if(!existing)sqlite.exec(readFileSync('drizzle/0000_registration.sql','utf8'));
const DB={prepare(sql){const stmt=sqlite.prepare(sql);let args=[];return {bind(...values){args=values;return this},first(){return stmt.get(...args)},run(){return stmt.run(...args)}}}};
const port=Number(process.env.PORT||48731);
const server=http.createServer(async(req,res)=>{
  try{
    const parts=[];for await(const chunk of req)parts.push(chunk);
    const r=new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,body:parts.length?Buffer.concat(parts):undefined});
    const out=await worker.fetch(r,{DB});res.writeHead(out.status,Object.fromEntries(out.headers));res.end(Buffer.from(await out.arrayBuffer()));
  }catch{res.writeHead(500);res.end('Preview error')}
});
server.listen(port,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+port));