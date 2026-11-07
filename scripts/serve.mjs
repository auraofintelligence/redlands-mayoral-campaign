import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.ico':'image/x-icon','.xml':'application/xml','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8'};
http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=path.resolve(base,'.'+pathname);if(file!==base&&!file.startsWith(base+path.sep))throw Error('bad path');if((await stat(file)).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(await readFile(file));}catch{res.writeHead(404);res.end('Not found');}}).listen(4173,'127.0.0.1',()=>console.log('Local preview: http://127.0.0.1:4173'));
