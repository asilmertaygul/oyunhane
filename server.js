// Oyunhane — oyun sitesi sunucusu
// public/ klasöründeki oyunları sunar ve çok oyunculu oyunlar için oda mesajlarını iletir (/ws).
const http=require('http');const fs=require('fs');const path=require('path');const {WebSocketServer}=require('ws');
const PORT=process.env.PORT||3000;
const PUB=path.join(__dirname,'public');
const MAX_MSG=64*1024,GRACE_MS=10000;
const TYPES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.ico':'image/x-icon','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
  let u;try{u=decodeURIComponent((req.url||'/').split('?')[0]);}catch(_){res.writeHead(400);res.end();return;}
  if(u==='/health'){res.writeHead(200,{'content-type':'text/plain'});res.end('ok');return;}
  let f=path.normalize(path.join(PUB,u));if(!f.startsWith(PUB)){res.writeHead(403);res.end();return;}
  fs.stat(f,(e,st)=>{
    if(!e&&st.isDirectory()){if(!u.endsWith('/')){res.writeHead(301,{location:u+'/'});res.end();return;}f=path.join(f,'index.html');}
    fs.readFile(f,(err,data)=>{if(err){res.writeHead(404,{'content-type':'text/html; charset=utf-8'});res.end('<h1>Bulunamadı</h1><p><a href="/">Oyunhane ana sayfası</a></p>');return;}
      const ext=path.extname(f).toLowerCase();res.writeHead(200,{'content-type':TYPES[ext]||'application/octet-stream','cache-control':(ext==='.html'||ext==='.json')?'no-cache':'public, max-age=86400'});res.end(data);});
  });
});
const wss=new WebSocketServer({server,path:'/ws',maxPayload:MAX_MSG});
const rooms=new Map();   // name -> Map(peer -> {pres, sock})
const socks=new Map();   // peer -> {ws, rooms:Set, dropT}
function roomOf(n){let r=rooms.get(n);if(!r){r=new Map();rooms.set(n,r);}return r;}
function bcast(rn,msg,except){const r=rooms.get(rn);if(!r)return;const s=JSON.stringify(msg);for(const [p] of r){if(p===except)continue;const c=socks.get(p);if(c&&c.ws&&c.ws.readyState===1)c.ws.send(s);}}
function leaveRoom(peer,rn){const r=rooms.get(rn);if(!r||!r.has(peer))return;r.delete(peer);bcast(rn,{t:'peer-',r:rn,peer});if(!r.size)rooms.delete(rn);const c=socks.get(peer);if(c)c.rooms.delete(rn);}
function dropPeer(peer){const c=socks.get(peer);if(!c)return;for(const rn of [...c.rooms])leaveRoom(peer,rn);socks.delete(peer);}
wss.on('connection',(ws,req)=>{
  const q=new URL(req.url,'http://x').searchParams;let peer=String(q.get('peer')||'').replace(/[^a-z0-9]/gi,'').slice(0,24);
  if(!peer)peer='p'+Math.random().toString(36).slice(2,10);
  let c=socks.get(peer);
  if(c&&c.ws&&c.ws.readyState===1){peer=peer+Math.random().toString(36).slice(2,5);c=null;}
  if(c){clearTimeout(c.dropT);c.ws=ws;}else{c={ws,rooms:new Set(),dropT:null};socks.set(peer,c);}
  let tokens=60,last=Date.now();
  ws.on('message',buf=>{
    const now=Date.now();tokens=Math.min(120,tokens+(now-last)/1000*60);last=now;if(tokens<1)return;tokens--;
    let m;try{m=JSON.parse(buf.toString());}catch(_){return;}
    if(!m||typeof m.r!=='string'||m.r.length>40)return;const rn=m.r;
    if(m.t==='join'){const r=roomOf(rn);const fresh=!r.has(peer);r.set(peer,{pres:m.pr||{}});c.rooms.add(rn);
      ws.send(JSON.stringify({t:'joined',r:rn,me:peer,peers:[...r].map(([p,v])=>({peer:p,pr:v.pres}))}));
      bcast(rn,{t:fresh?'peer+':'pres',r:rn,peer,pr:m.pr||{}},peer);}
    else if(m.t==='pres'){const r=rooms.get(rn);if(!r||!r.has(peer))return;r.get(peer).pres=m.pr||{};bcast(rn,{t:'pres',r:rn,peer,pr:m.pr||{}},peer);}
    else if(m.t==='emit'){const r=rooms.get(rn);if(!r||!r.has(peer)||typeof m.topic!=='string')return;bcast(rn,{t:'emit',r:rn,peer,topic:m.topic,data:m.data},peer);}
    else if(m.t==='leave'){leaveRoom(peer,rn);}
  });
  ws.on('close',()=>{const cur=socks.get(peer);if(!cur||cur.ws!==ws)return;cur.ws=null;cur.dropT=setTimeout(()=>dropPeer(peer),GRACE_MS);});
});
server.listen(PORT,()=>console.log('Oyunhane hazır: http://localhost:'+PORT));
