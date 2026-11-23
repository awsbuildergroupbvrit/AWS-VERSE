import {readFile,readdir,writeFile,mkdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
const root=new URL('./public/',import.meta.url);
const types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',ics:'text/calendar; charset=utf-8',svg:'image/svg+xml',webp:'image/webp',jpg:'image/jpeg',mp4:'video/mp4',ttf:'font/ttf'};
const assets={};
for(const file of await readdir(root,{recursive:true,withFileTypes:true})){
  if(!file.isFile())continue;
  const local=path.join(file.parentPath,file.name);
  const route='/'+path.relative((await import('node:url')).fileURLToPath(root),local).replaceAll('\\','/');
  assets[route]=[types[file.name.split('.').pop()],(await readFile(local)).toString('base64')];
}
const api=await readFile(new URL('./worker/api.mjs',import.meta.url),'utf8');
const serve=await readFile(new URL('./worker/serve.mjs',import.meta.url),'utf8');
await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
await writeFile('dist/server/index.js',api+'\nconst ASSETS='+JSON.stringify(assets)+';\n'+serve);
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');