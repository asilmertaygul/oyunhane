/* Bozkır Seferi — bağımsız sunucu için oda bağlantısı (claude room API uyumlu) */
(function(){
  const PID_KEY='bozkir-peer';
  let me=null;try{me=sessionStorage.getItem(PID_KEY);}catch(_){}
  if(!me){me='p'+Math.random().toString(36).slice(2,10);try{sessionStorage.setItem(PID_KEY,me);}catch(_){}}
  let ws=null,open=false,queue=[],rooms=new Map(),connL=new Set(),retry=0;
  function send(m){const s=JSON.stringify(m);if(open&&ws.readyState===1)ws.send(s);else queue.push(s);}
  function connect(){
    const proto=location.protocol==='https:'?'wss:':'ws:';
    ws=new WebSocket(proto+'//'+location.host+'/ws?peer='+encodeURIComponent(me));
    ws.onopen=()=>{open=true;retry=0;
      for(const R of rooms.values())send({t:'join',r:R.name,pr:R.myPres});
      const q=queue;queue=[];for(const s of q)ws.send(s);
      for(const f of connL)try{f(true);}catch(_){}};
    ws.onclose=()=>{open=false;for(const f of connL)try{f(false);}catch(_){}setTimeout(connect,Math.min(8000,800*(++retry)));};
    ws.onerror=()=>{};
    ws.onmessage=ev=>{let m;try{m=JSON.parse(ev.data);}catch(_){return;}const R=rooms.get(m.r);if(!R)return;R.handle(m);};
  }
  function peerObj(R,p){return {peer:p,by:null,isMe:p===me,sameTab:p===me,kind:'viewer',guest:false,presence:R.peers.get(p)||{},updatedAt:Date.now()};}
  function makeRoom(name){
    if(rooms.has(name))return rooms.get(name).api;
    const R={name,peers:new Map([[me,{}]]),myPres:{},topicL:{},peerL:[]};
    const snap=()=>[...R.peers.keys()].map(p=>peerObj(R,p));
    const notify=(j,l,u)=>{const ps=snap();const mk=a=>a.map(p=>ps.find(x=>x.peer===p)).filter(Boolean);for(const f of R.peerL)try{f({peers:ps,joined:mk(j),left:l.map(p=>({peer:p,presence:{},isMe:false,sameTab:false,kind:'viewer'})),updated:mk(u)});}catch(e){console.error(e);}};
    R.handle=m=>{
      if(m.t==='joined'){const j=[],live=new Set(m.peers.map(p=>p.peer));const l=[...R.peers.keys()].filter(p=>p!==me&&!live.has(p));for(const p of l)R.peers.delete(p);for(const p of m.peers){if(p.peer===me)continue;if(!R.peers.has(p.peer))j.push(p.peer);R.peers.set(p.peer,p.pr||{});}if(j.length||l.length)notify(j,l,[]);}
      else if(m.t==='peer+'){if(m.peer===me)return;const isNew=!R.peers.has(m.peer);R.peers.set(m.peer,m.pr||{});notify(isNew?[m.peer]:[],[],isNew?[]:[m.peer]);}
      else if(m.t==='pres'){if(m.peer===me)return;const isNew=!R.peers.has(m.peer);R.peers.set(m.peer,m.pr||{});notify(isNew?[m.peer]:[],[],isNew?[]:[m.peer]);}
      else if(m.t==='peer-'){if(!R.peers.has(m.peer)||m.peer===me)return;R.peers.delete(m.peer);notify([],[m.peer],[]);}
      else if(m.t==='emit'){(R.topicL[m.topic]||[]).forEach(f=>{try{f({topic:m.topic,data:m.data,peer:m.peer,by:null,isMe:false,sameTab:false,kind:'viewer',guest:false});}catch(e){console.error(e);}});}
    };
    const api={
      emit:async(topic,data)=>{send({t:'emit',r:name,topic,data});},
      on:(t,f)=>{(R.topicL[t]=R.topicL[t]||[]).push(f);return()=>{R.topicL[t]=(R.topicL[t]||[]).filter(x=>x!==f);};},
      presence:async(patch)=>{const next={...R.myPres};for(const k in patch){if(patch[k]===null)delete next[k];else next[k]=patch[k];}R.myPres=next;R.peers.set(me,{...next});send({t:'pres',r:name,pr:next});notify([],[],[me]);},
      peers:()=>snap(),
      onPeers:(f)=>{R.peerL.push(f);setTimeout(()=>f({peers:snap(),joined:snap(),left:[],updated:[]}),0);return()=>{R.peerL=R.peerL.filter(x=>x!==f);};},
      connected:()=>open,
      onConnection:f=>{connL.add(f);return()=>connL.delete(f);},
      leave:async()=>{send({t:'leave',r:name});rooms.delete(name);},
      join:async(n)=>makeRoom(n)
    };
    R.api=api;rooms.set(name,R);send({t:'join',r:name,pr:{}});
    return api;
  }
  connect();
  window.claude={__standalone:true,use:async(name)=>name==='room'?makeRoom(('lobby'+location.pathname).slice(0,40)):null};
})();
