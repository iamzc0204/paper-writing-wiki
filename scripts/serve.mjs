import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
const root=resolve('site');const port=Number(process.env.PORT||5175);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.md':'text/plain'};
createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');let file=resolve(root,'.'+decodeURIComponent(url.pathname));if(file!==root&&!file.startsWith(root+sep)){res.writeHead(404).end();return;}const info=await stat(file).catch(()=>null);if(info?.isDirectory())file=join(file,'index.html');const bytes=await readFile(file).catch(()=>null);if(!bytes){res.writeHead(404).end('Not found');return;}res.writeHead(200,{'Content-Type':`${types[extname(file)]||'application/octet-stream'}; charset=utf-8`});res.end(bytes);}catch{res.writeHead(500).end();}}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}/`));
