const $=id=>document.getElementById(id), KEY='rw3d_save_v1';
const DEF={coins:0,best:0,chars:[0],char:0,items:[],outfit:-1,board:-1,
 m:{coins:{p:0,t:0},dist:{p:0,t:0},jumps:{p:0,t:0},rounds:{p:0,t:0}},set:{music:1,sfx:1,q:1}};
let S=JSON.parse(JSON.stringify(DEF));
try{const o=JSON.parse(localStorage.getItem(KEY));if(o){S=Object.assign(S,o);S.set=Object.assign({},DEF.set,o.set);S.m=Object.assign({},DEF.m,o.m)}}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};

/* ---------- ANDROID/WEBVIEW HARDENING (added) ----------
   1) UI state is declared up here (it used to be declared after the 3D setup). If Three.js / WebGL failed to start,
      the script aborted before those `let`s ran, so every button handler threw "Cannot access 'mode' before initialization"
      and the menu looked alive but did nothing.
   2) On-screen error banner so problems are visible on a phone without a debugger.
   3) Touch fallback for .btn so taps always fire exactly once in Android WebView. */
let mode='menu',T=0,G={},act={},P={x:0,h:0,vy:0,row:1,ry:0,sl:0,vx:0,air:0,on:null},V=430,camX=0,prevIdx=S.char,SUPT=null,pv=0;
window.__rwReady=false;
function rwErr(msg){try{let b=document.getElementById('rwerr');if(!b){b=document.createElement('div');b.id='rwerr';b.style.cssText='position:fixed;left:8px;right:8px;bottom:8px;z-index:99;background:rgba(160,20,20,.92);color:#fff;font:13px/1.3 sans-serif;padding:8px 10px;border-radius:10px;pointer-events:none;white-space:pre-wrap;max-height:30vh;overflow:hidden';document.body.appendChild(b)}b.textContent=msg}catch(e){}}
addEventListener('error',e=>{if(!window.__rwReady)rwErr('Startup error: '+(e.message||e))});
(function(){let sx=0,sy=0,mv=false,fired=0;
 const btn=e=>e.target&&e.target.closest?e.target.closest('.btn'):null;
 document.addEventListener('touchstart',e=>{if(btn(e)&&e.touches[0]){sx=e.touches[0].clientX;sy=e.touches[0].clientY;mv=false}},{passive:true,capture:true});
 document.addEventListener('touchmove',e=>{const t=e.touches[0];if(t&&(Math.abs(t.clientX-sx)>12||Math.abs(t.clientY-sy)>12))mv=true},{passive:true,capture:true});
 document.addEventListener('touchend',e=>{const b=btn(e);if(!b||mv||e.touches.length)return;if(e.cancelable)e.preventDefault();fired=Date.now();b.click()},{passive:false,capture:true});
 // if a browser still sends its own click right after our touch handling, swallow it (prevents double toggles)
 document.addEventListener('click',e=>{if(e.isTrusted&&Date.now()-fired<450&&btn(e)){e.stopPropagation();e.preventDefault()}},true);
})();

/* ---------- data ---------- */
const CH=[
 {n:'Rex',p:0,h:0xf2ede4,v:0x4a86c9,pa:0x3f78bf,cap:0xe53935,sk:0xe0a06a},
 {n:'Nova',p:300,h:0xff4fa3,v:0x2b2b6b,pa:0x333344,cap:0xffd54f,sk:0xf1c27d},
 {n:'Bolt',p:600,h:0x2ecc71,v:0xf39c12,pa:0x1b4f72,cap:0x222222,sk:0x8d5524},
 {n:'Pixel',p:900,h:0xa259ff,v:0x19b5fe,pa:0x2d2d4d,cap:0xffffff,sk:0xf5d0a9},
 {n:'Gizmo',p:1500,h:0x333344,v:0xe53935,pa:0x4a3b7a,cap:0xffc619,sk:0x7bc043}];
const OUT=[{n:'Sunset Hoodie',p:200,c:0xff9f1c},{n:'Ocean Hoodie',p:200,c:0x1fb6ff},{n:'Neon Hoodie',p:350,c:0x39ff14}];
const BRD=[{n:'Red Board',p:150,c:0xe53935},{n:'Purple Board',p:250,c:0xa259ff},{n:'Gold Board',p:500,c:0xffc619}];
const MIS=[['coins','Collect coins',100],['dist','Run meters',1000],['jumps','Jump over barriers',20],['rounds','Play rounds',3]];
const PUN=['Magnet','Jetpack','2X Score','Super Jump'];

/* ---------- audio ---------- */
let AC=null;
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC}
function tone(f,d,t,v,f2,dl,mus){if(mus?!S.set.music:!S.set.sfx)return;const c=ac();if(!c)return;const o=c.createOscillator(),g=c.createGain(),t0=c.currentTime+(dl||0);
 o.type=t||'square';o.frequency.setValueAtTime(f,t0);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t0+d);g.gain.setValueAtTime(v||.07,t0);g.gain.exponentialRampToValueAtTime(.001,t0+d);o.connect(g);g.connect(c.destination);o.start(t0);o.stop(t0+d+.05)}
const sfx={click:()=>tone(600,.08,'square',.05,900),jump:()=>tone(280,.2,'square',.06,700),coin:()=>{tone(988,.08,'square',.05);tone(1319,.12,'square',.05,0,.07)},
 pu:()=>[523,659,784,1046].forEach((f,i)=>tone(f,.12,'triangle',.08,0,i*.07)),crash:()=>tone(200,.5,'sawtooth',.12,40),step:()=>tone(90,.05,'triangle',.05)};
const NOTES=[262,330,392,330,294,349,440,349,262,330,392,523,494,392,330,294];let ms=0;
setInterval(()=>{if(AC&&S.set.music&&mode!=='pause'){tone(NOTES[ms%16]/(ms%32<16?1:1.25),.18,'triangle',.035,0,0,1);if(ms%2==0)tone(NOTES[ms%16]/4,.2,'sine',.05,0,0,1);ms++}},210);
document.addEventListener('pointerdown',()=>ac(),{once:true});
document.addEventListener('click',e=>{if(e.target.closest('.btn'))sfx.click()});

/* ---------- 3D realistic renderer with rear chase camera ---------- */
/*DEFS-START*/
const K=.02,LANE=3.2,RW=[-LANE,0,LANE],HT=120;let W=4200;   // K = world units per logic pixel; W = logic view distance
const rd=a=>a[Math.random()*a.length|0],rr=(a,b)=>a+Math.random()*(b-a),ql=l=>Math.max(3,Math.min(6,Math.round(l/160)))*160;
const DES=[{b:'#7e57c2',r:'#cfd6e6',s:'#f5a623'},{b:'#f39c34',r:'#cfd6e6',s:'#2d9cdb'},{b:'#26a69a',r:'#cfd6e6',s:'#7e57c2'},{b:'#7cc242',r:'#cfd6e6',s:'#f6c445'},{b:'#4a7bd0',r:'#cfd6e6',s:'#ff6f91'}];
/*DEFS-END*/
if(!window.THREE){rwErr('3D engine (three.min.js) did not load. Make sure js/lib/three.min.js is in the app.');throw new Error('THREE missing')}
const R=(()=>{try{return new THREE.WebGLRenderer({canvas:$('c'),antialias:true,powerPreference:'high-performance'})}catch(e){try{return new THREE.WebGLRenderer({canvas:$('c'),antialias:false})}catch(e2){rwErr('WebGL could not start on this device: '+e2.message);throw e2}}})();
R.outputEncoding=THREE.sRGBEncoding;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=.95;R.shadowMap.type=THREE.PCFSoftShadowMap;
const sc=new THREE.Scene(),cam=new THREE.PerspectiveCamera(62,1,.1,260);
const ctex=(w,h,f,rep)=>{const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;if(rep)t.wrapS=t.wrapT=THREE.RepeatWrapping;return t};
const nz=(g,w,h,n,a)=>{for(let i=0;i<n;i++){g.fillStyle=Math.random()<.5?`rgba(0,0,0,${a})`:`rgba(255,255,255,${a})`;g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*2)}};
const MAT={};const mt=(c,r,m)=>{const k=c+'_'+r+'_'+m;return MAT[k]||(MAT[k]=new THREE.MeshStandardMaterial({color:c,roughness:r===undefined?.7:r,metalness:m||0}))};
const bx=(w,h,d,c,x,y,z,p)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),c&&c.isMaterial?c:mt(c));o.position.set(x||0,y||0,z||0);o.castShadow=o.receiveShadow=true;if(p)p.add(o);return o};
const grad=(g,w,h,st)=>{const r=g.createLinearGradient(0,0,0,h);st.forEach(s=>r.addColorStop(s[0],s[1]));g.fillStyle=r;g.fillRect(0,0,w,h)};
sc.background=ctex(16,256,(g,w,h)=>grad(g,w,h,[[0,'#2f86e6'],[.55,'#7cc4fa'],[1,'#d4f0ff']]));sc.fog=new THREE.Fog(0xbfe4ff,55,190);
{const pm=new THREE.PMREMGenerator(R),e=ctex(512,256,(g,w,h)=>grad(g,w,h,[[0,'#3f8fe6'],[.5,'#dff1ff'],[.52,'#6f9a4a'],[1,'#4c6a34']]));e.mapping=THREE.EquirectangularReflectionMapping;sc.environment=pm.fromEquirectangular(e).texture;pm.dispose()}
R.toneMappingExposure=1.08;
sc.add(new THREE.HemisphereLight(0xe6f3ff,0x7da25a,.85));
const sun=new THREE.DirectionalLight(0xfff4dc,1.35);sun.position.set(-14,24,8);sun.target.position.set(0,0,-10);sc.add(sun,sun.target);
{const s=sun.shadow;s.mapSize.set(1024,1024);s.camera.left=-20;s.camera.right=20;s.camera.top=30;s.camera.bottom=-14;s.camera.near=1;s.camera.far=70;s.bias=-.0006}
function size(){const q=S.set.q;R.setPixelRatio(q?Math.min(devicePixelRatio||1,2):1);R.setSize(innerWidth,innerHeight);R.shadowMap.enabled=!!q;sun.castShadow=!!q;cam.aspect=innerWidth/innerHeight;cam.fov=cam.aspect<.8?80:62;cam.updateProjectionMatrix();sc.traverse(o=>{if(o.material){[].concat(o.material).forEach(m=>m.needsUpdate=true)}})}
addEventListener('resize',size);

/* grass, dirt track bed, sleepers, steel rails, overhead wires, clouds */
const gravT=ctex(256,256,(g,w,h)=>{g.fillStyle='#5fb23a';g.fillRect(0,0,w,h);for(let i=0;i<60;i++){g.fillStyle=Math.random()<.5?'rgba(120,200,60,.35)':'rgba(40,120,40,.3)';g.beginPath();g.arc(Math.random()*w,Math.random()*h,8+Math.random()*18,0,7);g.fill()}nz(g,w,h,3500,.12)},1);gravT.repeat.set(18,46);
const bedT=ctex(128,256,(g,w,h)=>{g.fillStyle='#a8683a';g.fillRect(0,0,w,h);nz(g,w,h,5000,.2);for(let i=0;i<30;i++){g.fillStyle='rgba(90,50,25,.25)';g.beginPath();g.arc(Math.random()*w,Math.random()*h,4+Math.random()*8,0,7);g.fill()}},1);bedT.repeat.set(3,46);
const trkT=ctex(384,128,(g,w,h)=>{g.fillStyle='#a8683a';g.fillRect(0,0,w,h);nz(g,w,h,4000,.2);for(let l=0;l<3;l++){const c=l*128+64;for(let s=0;s<6;s++){const y=s*21+5;g.fillStyle='rgba(60,30,10,.35)';g.fillRect(c-54,y+3,108,11);g.fillStyle=s%2?'#8a5a31':'#9a6738';g.fillRect(c-52,y,104,10);g.fillStyle='rgba(255,230,180,.25)';g.fillRect(c-52,y,104,2)}}},1);trkT.repeat.set(1,58);
const bedM=new THREE.Mesh(new THREE.PlaneGeometry(13,230).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:bedT,roughness:1}));bedM.position.set(0,-.01,-100);bedM.receiveShadow=true;sc.add(bedM);
const gm=new THREE.Mesh(new THREE.PlaneGeometry(90,230).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:gravT,roughness:1}));gm.position.set(0,-.03,-100);gm.receiveShadow=true;sc.add(gm);
const tm=new THREE.Mesh(new THREE.PlaneGeometry(9.6,232).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:trkT,roughness:1}));tm.position.set(0,.005,-100);tm.receiveShadow=true;sc.add(tm);
for(let l=0;l<3;l++)for(const sd of[-.72,.72]){const r=bx(.13,.18,232,mt(0xb5bbc6,.3,.8),RW[l]+sd,.09,-100,sc);r.castShadow=false}
for(const x of[-3.2,0,3.2,-5,5]){const p=new Float32Array([x,x===5||x===-5?8.6:7.7,-230,x,x===5||x===-5?8.6:7.7,20]);const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(p,3));sc.add(new THREE.Line(gg,new THREE.LineBasicMaterial({color:0x2b2d36})))}
const cloudT=ctex(256,128,(g,w,h)=>{for(const[x,y,r]of[[70,80,34],[110,62,42],[160,76,36],[196,88,26],[50,92,24],[130,92,34]]){g.fillStyle='#fff';g.beginPath();g.arc(x,y,r,0,7);g.fill()}g.fillStyle='rgba(150,190,230,.35)';g.fillRect(20,96,220,22);g.globalCompositeOperation='destination-in';grad(g,w,h,[[0,'#fff'],[.8,'#fff'],[1,'rgba(255,255,255,0)']])});
const CLD=Array.from({length:7},(_,i)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(46,23),new THREE.MeshBasicMaterial({map:cloudT,transparent:true,depthWrite:false,fog:false}));m.userData.x=-90+i*30+Math.random()*12;m.position.set(0,36+Math.random()*16,-175-Math.random()*20);sc.add(m);return m});

/* colourful buildings, trees, bushes, stations, poles, signals, bridges, tunnels */
function bTex(base,balc){return ctex(128,256,(g,w,h)=>{grad(g,w,h,[[0,base],[1,base]]);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(0,0,w,h);g.fillStyle='rgba(0,0,0,.14)';for(let y=60;y<h;y+=64)g.fillRect(0,y,w,5);nz(g,w,h,1200,.06);
 for(let y=14;y<h-12;y+=64)for(let x=14;x<w-14;x+=56){g.fillStyle='#f7f3e8';g.fillRect(x-3,y-3,36,48);const r=g.createLinearGradient(0,y,0,y+42);r.addColorStop(0,'#a8def5');r.addColorStop(1,'#4d93c8');g.fillStyle=r;g.fillRect(x,y,30,42);g.fillStyle='#f7f3e8';g.fillRect(x+13,y,4,42);g.fillRect(x,y+19,30,4);g.fillStyle='rgba(0,0,0,.18)';g.fillRect(x-4,y+46,38,5);if(balc&&Math.random()<.5){g.fillStyle='#e0527a';g.fillRect(x-2,y+40,34,8)}}},1)}
const bMats=['#e9973f','#d95b4a','#3aa6a0','#f2c14e','#e07fa3','#5b8fd9','#e8d7b0'].map((c,i)=>new THREE.MeshStandardMaterial({map:bTex(c,i%2),roughness:.9}));
const stripeT=ctex(64,32,(g,w,h)=>{for(let x=0;x<w;x+=8){g.fillStyle=(x/8)%2?'#fff':'#d9382f';g.fillRect(x,0,8,h)}},1);
const awnM=new THREE.MeshStandardMaterial({map:stripeT,roughness:.8}),roofC=mt(0x8a5a4a,.9),concM=new THREE.MeshStandardMaterial({color:0xc9c6bd,roughness:.95});
const cMats=['#d9534f','#3b82d9','#43a047'].map(c=>new THREE.MeshStandardMaterial({roughness:.6,metalness:.2,map:ctex(64,64,(g,w,h)=>{g.fillStyle=c;g.fillRect(0,0,w,h);for(let x=0;x<w;x+=6){g.fillStyle='rgba(0,0,0,.18)';g.fillRect(x,0,2,h)}})}));
const GR=[0x38a83a,0x4cc23f,0x2c8f3c,0x62cf45].map(c=>mt(c,.85));
const icoG=new THREE.IcosahedronGeometry(1,1),coneG=new THREE.ConeGeometry(1,1,8);
function bush(m,r,x,y,z,sy,p){const o=new THREE.Mesh(icoG,m);o.scale.set(r,r*(sy||.85),r);o.position.set(x,y,z);o.castShadow=true;p.add(o);return o}
const brickT=c=>{const t=ctex(128,128,(g,w,h)=>{g.fillStyle=c;g.fillRect(0,0,w,h);g.strokeStyle='rgba(0,0,0,.25)';for(let y=0;y<h;y+=16){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();for(let x=(y/16%2)*16;x<w;x+=32){g.beginPath();g.moveTo(x,y);g.lineTo(x,y+16);g.stroke()}}nz(g,w,h,1500,.1)},1);t.repeat.set(.25,.25);return t};
const NS=8,SP=20,SPAN=NS*SP,SL=[];
function uvs(geo,w,h,d){const u=geo.attributes.uv;for(let f=0;f<6;f++){const a=f<2?[d,h]:f<4?[1,1]:[w,h];for(let i=f*4;i<f*4+4;i++)u.setXY(i,u.getX(i)*a[0]/4.2,u.getY(i)*a[1]/8)}}
function mkSlot(side,idx){const g=new THREE.Group(),o={g,side,idx,d:0},w=6+Math.random()*3,h=9+Math.random()*7,dp=12,bg=new THREE.BoxGeometry(w,h,dp);uvs(bg,w,h,dp);
 o.b=new THREE.Mesh(bg,bMats[0]);o.b.position.set(side*(11+w/2),h/2,0);o.b.castShadow=o.b.receiveShadow=true;g.add(o.b);
 bx(w+.6,.5,dp+.6,roofC,side*(11+w/2),h+.25,0,g);if(Math.random()<.6)bx(1,1.6,1,mt(0x9a8a80,.9),side*(11+w/2+1),h+1.2,2,g);
 o.aw=new THREE.Mesh(new THREE.BoxGeometry(1.8,.12,5),awnM);o.aw.position.set(side*10.2,2.7,0);o.aw.rotation.z=side*-.3;o.aw.castShadow=true;g.add(o.aw);
 o.c=bx(2.5,2.6,6.4,cMats[0],side*7.4,1.3,0,g);
 o.t=new THREE.Group();bx(.4,2.6,.4,0x6a4a2c,0,1.3,0,o.t);for(const[x,y,r]of[[0,3.6,1.7],[.3,5,1.3],[-.4,4.4,1.1]])bush(GR[0],r,x,y,0,.8,o.t);g.add(o.t);
 o.pn=new THREE.Group();bx(.3,1,.3,0x6a4a2c,0,.5,0,o.pn);for(let i=0;i<3;i++){const c=new THREE.Mesh(coneG,GR[2]);c.scale.set(1.5-i*.35,1.8,1.5-i*.35);c.position.y=1.8+i*1.2;c.castShadow=true;o.pn.add(c)}g.add(o.pn);
 o.bs=new THREE.Group();bush(GR[1],.8,0,.45,0,.8,o.bs);bush(GR[3],.6,.7,.35,.3,.8,o.bs);bush(GR[2],.55,-.6,.3,-.3,.8,o.bs);g.add(o.bs);
 o.pl=new THREE.Group();for(let i=0;i<5;i++){const c=new THREE.Mesh(coneG,GR[3]);c.scale.set(.12,.7,.12);c.position.set(Math.random()-.5,.35,Math.random()-.5);c.rotation.z=Math.random()-.5;o.pl.add(c)}const fl=new THREE.Mesh(icoG,mt(0xff7a30,.6));fl.scale.setScalar(.14);fl.position.set(.2,.75,0);o.pl.add(fl);g.add(o.pl);
 o.pf=new THREE.Group();bx(4.2,1,SP-.4,concM,side*7.6,.5,0,o.pf);bx(.3,.03,SP-.4,0xf2c200,side*5.65,1.02,0,o.pf);bx(4.6,.2,SP-3,mt(0x2f7fd6,.5),side*8,4.3,0,o.pf);bx(.18,3.3,.18,0x555c68,side*6.3,2.65,-5,o.pf);bx(.18,3.3,.18,0x555c68,side*6.3,2.65,5,o.pf);bx(1.4,.45,.5,0x8a5a2c,side*8.4,1.25,2,o.pf);g.add(o.pf);
 o.pole=new THREE.Group();bx(.28,8.4,.28,mt(0x6f7480,.6,.4),side*5.2,4.2,0,o.pole);if(side<0)bx(10.8,.22,.22,mt(0x6f7480,.6,.4),0,7.9,0,o.pole);g.add(o.pole);
 o.sg=new THREE.Group();bx(.14,3.2,.14,0x444,side*5.6,1.6,6,o.sg);bx(.5,1.1,.35,0x1c1d22,side*5.6,3.3,6,o.sg);o.r=new THREE.MeshBasicMaterial({color:0xff2020});o.gn=new THREE.MeshBasicMaterial({color:0x22ee44});
 for(const[m,y]of[[o.r,3.6],[o.gn,3.05]]){const s=new THREE.Mesh(new THREE.CircleGeometry(.17,12),m);s.position.set(side*5.6,y,5.8);s.rotation.y=Math.PI;o.sg.add(s)}g.add(o.sg);
 sc.add(g);SL.push(o);rerand(o)}
function rerand(o){const s=o.side,r=Math.random,pf=r()<.28;o.b.material=rd(bMats);o.aw.visible=r()<.6;o.pf.visible=pf;o.c.visible=!pf&&r()<.2;o.c.material=rd(cMats);
 const tr=!pf&&r()<.85,rt=r()<.6;o.t.visible=tr&&rt;o.pn.visible=tr&&!rt;o.t.position.set(s*(9+r()*1.4),0,r()*8-4);o.pn.position.set(s*(9+r()*1.4),0,r()*8-4);
 o.bs.visible=!pf;o.bs.position.set(s*(6.6+r()*1.5),0,r()*10-5);o.pl.visible=!pf&&r()<.8;o.pl.position.set(s*(6.4+r()*2.5),0,r()*10-5);o.sg.visible=r()<.35;const gr=r()<.5;o.r.color.setHex(gr?0x4a1010:0xff2020);o.gn.color.setHex(gr?0x22ee44:0x0e3a18)}
for(let i=0;i<NS;i++){mkSlot(-1,i);mkSlot(1,i)}
function archWall(mat,hill){const s=new THREE.Shape();s.moveTo(-16,0);s.lineTo(16,0);s.lineTo(16,13);s.lineTo(-16,13);s.lineTo(-16,0);const h=new THREE.Path();h.moveTo(-5.9,0);h.lineTo(-5.9,3.6);h.absarc(0,3.6,5.9,Math.PI,0,true);h.lineTo(5.9,0);h.lineTo(-5.9,0);s.holes.push(h);
 const g=new THREE.Group(),m=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:5,bevelEnabled:false,curveSegments:14}).translate(0,0,-2.5),mat);m.castShadow=m.receiveShadow=true;g.add(m);
 for(const sd of[-1,1])bx(.5,.9,5.4,0xdcd6c8,sd*0+sd*0,13.4,0,g).scale.x=60;
 if(hill){const hl=new THREE.Mesh(icoG,GR[0]);hl.scale.set(17,9,9);hl.position.set(0,12,-8);g.add(hl);const t=new THREE.Mesh(new THREE.BoxGeometry(11.6,9.4,12),new THREE.MeshBasicMaterial({color:0x1a1c24,side:THREE.BackSide}));t.position.set(0,4.7,-8.4);g.add(t)}return g}
const bridge=archWall(new THREE.MeshStandardMaterial({map:brickT('#b4664e'),roughness:.95}),0),tunnel=archWall(new THREE.MeshStandardMaterial({map:brickT('#9a9ca8'),roughness:.95}),1);
{const signT=ctex(512,160,(g,w,h)=>{grad(g,w,h,[[0,'#3a3660'],[1,'#25224a']]);g.font='84px "Lilita One",Impact,sans-serif';g.textBaseline='middle';g.lineWidth=10;g.lineJoin='round';g.strokeStyle='#14125c';g.strokeText('#RUNNER',18,50);g.fillStyle='#ffb300';g.fillText('#RUNNER',18,50);g.strokeText('WORLD',200,114);g.fillStyle='#29b6ff';g.fillText('WORLD',200,114);['#ff3fa4','#3ddc5a'].forEach((c,i)=>{g.fillStyle=c;g.beginPath();g.arc(40+i*430,140,12,0,7);g.fill()})});
 const sg=new THREE.Mesh(new THREE.PlaneGeometry(14,3.4),new THREE.MeshStandardMaterial({map:signT,emissiveMap:signT,emissive:0xffffff,emissiveIntensity:.4,roughness:.6}));sg.position.set(0,11.2,2.55);bridge.add(sg)}
sc.add(bridge,tunnel);
function updateEnv(s){for(const o of SL){const d=(((o.idx*SP-s)%SPAN)+SPAN)%SPAN;if(d>o.d+SPAN/2)rerand(o);o.d=d;o.g.position.z=16-d}
 bridge.position.z=-((((300-s)%260)+260)%260)+12;tunnel.position.z=-((((560-s)%520)+520)%520)+12;
 for(const c of CLD){c.position.x=((c.userData.x+T*1.2+120)%240)-120}}

/* ---------- pools ---------- */
const mkp=n=>Array.from({length:n},()=>({on:0})),TR=mkp(12),CO=mkp(170),IT=mkp(40),PK=mkp(6),FX=mkp(40);
const gt=a=>{for(const o of a)if(!o.on){o.on=1;return o}return null};
const addT=(row,x,len,vt,ramp,des)=>{const t=gt(TR);if(t)Object.assign(t,{row,x,len:ql(len),vt,ramp,des,h:HT});return t};
const addC=(row,x,h,t,ox)=>{const c=gt(CO);if(c)Object.assign(c,{row,x,h,t:t||null,ox:ox||0,ph:Math.random()*6})};
const addI=(row,x,ty,t,off)=>{const i=gt(IT);if(i)Object.assign(i,{row,x,ty,t:t||null,off:off||0,done:0})};
const addP=(row,x,h,k)=>{const p=gt(PK);if(p)Object.assign(p,{row,x,h,k})};
const clearAll=()=>[TR,CO,IT,PK,FX].forEach(a=>a.forEach(o=>o.on=0));

/* ---------- state ---------- */
function newPlayer(){prevIdx=S.char}
function show(id,on){$(id).classList.toggle('on',on)}
function refreshMenu(){$('mc').textContent=S.coins;$('mb').textContent=S.best}
refreshMenu();
const cx=o=>o.t?o.t.x+(o.ox!==undefined&&o.ox!==null&&o.ty===undefined?o.ox:o.off):o.x;   // world x of coin/item/pickup
function support(row,x){let s=0;SUPT=null;for(const t of TR){if(!t.on||t.row!==row)continue;let v=0;
 if(x>=t.x&&x<=t.x+t.len)v=t.h;else if(t.ramp&&x<t.x&&x>=t.x-t.ramp)v=t.h*(x-(t.x-t.ramp))/t.ramp;if(v>s){s=v;SUPT=t}}return s}
function blocked(row,x,h){for(const t of TR)if(t.on&&t.row===row&&x+16>t.x&&x-16<t.x+t.len&&h<t.h-18)return t;return null}

/* ---------- level generation: coins are always attached to reachable paths ---------- */
const freeRows=(x0)=>[0,1,2].filter(r=>!TR.some(t=>t.on&&t.row===r&&t.x<x0+2200&&t.x+t.len>x0-900));
function roofLine(t,a,b,sk,bar){for(let ox=a;ox<b;ox+=60){const d=sk==null?999:Math.abs(ox-sk);addC(t.row,0,HT+(bar&&d<100?26:34)+(!bar&&d<90?90*Math.cos(d/90*Math.PI/2):0),t,ox)}}
function rampCoins(t){for(let ox=-t.ramp+30;ox<0;ox+=44)addC(t.row,0,HT*(t.ramp+ox)/t.ramp+34,t,ox)}
function climb(r,x0,vt,len,bar){len=ql(len);const L=260,t=addT(r,x0+L,len,vt,L,rd(DES));if(!t)return 0;rampCoins(t);const m=len*.5;
 if(bar){addI(r,0,'bar',t,m);roofLine(t,60,len-60,m,1)}else if(Math.random()<.6){addI(r,0,rd(['vent','equip']),t,m);roofLine(t,60,len-60,m)}else roofLine(t,60,len-60);return L+len}
function onc(r,x0){const len=ql(rd([420,600,800])),t=addT(r,x0+500,len,-rr(260,360),0,rd(DES));if(!t)return 0;const v=Math.random()<.4;if(v)addI(r,0,'vent',t,len*.5);roofLine(t,50,len-40,v?len*.5:null);return 800+len}
function chain(r,x0){let x=x0+300;const des=rd(DES),vt=rd([0,0,110]);for(let i=0;i<3;i++){const len=ql(rr(420,560)),t=addT(r,x,len,vt,i?0:260,des);if(!t)break;if(!i)rampCoins(t);
  if(i===1)addI(r,0,'vent',t,len/2);roofLine(t,50,len-50,i===1?len/2:null);if(i<2)for(let k=0;k<4;k++)addC(r,0,HT+34+80*Math.sin(Math.PI*k/3),t,len-15+k*45);x+=len+110}return x-x0}
function gnd(r,x0){const k=Math.random();
 if(k<.25)for(let i=0;i<10;i++)addC(r,x0+i*55,34);
 else if(k<.5)for(let i=0;i<12;i++)addC(r,x0+i*50,60+45*Math.sin(i*.55));
 else if(k<.75){addI(r,x0+330,'low');for(let i=0;i<7;i++)addC(r,x0+150+i*60,34+Math.sin(Math.PI*i/6)*110)}
 else{addI(r,x0+300,'bar');for(let i=0;i<8;i++)addC(r,x0+120+i*50,28)}if(Math.random()<.1)addP(r,x0+80,60,Math.random()*4|0);return 700}
function spawn(){const x0=G.nx,fr=freeRows(x0);if(!fr.length){G.nx+=400;return}const r=rd(fr),k=Math.random();let w;
 if(k<.2)w=gnd(r,x0);else if(k<.36)w=climb(r,x0,0,rd([520,760,980]));else if(k<.48)w=climb(r,x0,rr(110,190),rd([700,900]));
 else if(k<.58)w=climb(r,x0,0,820,1);else if(k<.7)w=onc(r,x0);
 else if(k<.82&&fr.length>1){const o=rd(fr.filter(q=>q!==r));w=Math.max(climb(r,x0,rr(100,160),760),onc(o,x0));const th=[0,1,2].find(q=>q!==r&&q!==o);if(th!=null)gnd(th,x0+100)}
 else w=chain(r,x0);
 if(fr.length>1&&Math.random()<.4)gnd(rd(fr.filter(q=>q!==r)),x0+rr(0,300));
 G.nx=x0+(w||600)+rr(450,800)}

/* ---------- game flow ---------- */
function resetG(){clearAll();G={t:0,score:0,coins:0,nx:1100,inv:0,step:0,x0:0};act={mag:0,jet:0,x2:0,shoe:0};P={x:0,h:0,vy:0,row:1,ry:RW[1],sl:0,vx:430,air:0,on:null};FX.forEach(f=>f.on=0);
 for(let i=0;i<10;i++)addC(1,420+i*55,34)}
function startGame(){if(!window.__rwReady){rwErr('Game engine is not ready (3D failed to start).');return}closeP();resetG();S.m.rounds.p++;save();mode='play';['menu','over','pauseS'].forEach(i=>show(i,false));show('hud',true);$('best').textContent='Best '+S.best;ac()}
function toMenu(){mode='menu';['hud','over','pauseS'].forEach(i=>show(i,false));show('menu',true);clearAll();refreshMenu();newPlayer()}
function pauseG(){if(mode==='play'){mode='pause';show('pauseS',true)}else if(mode==='pause'){mode='play';show('pauseS',false)}}
function gameOver(){mode='over';sfx.crash();S.coins+=G.coins;const s=Math.floor(G.score);S.best=Math.max(S.best,s);S.m.dist.p+=Math.floor(G.dist||0);save();
 $('os').textContent=s;$('oc').textContent=G.coins;$('ob').textContent=S.best;show('hud',false);setTimeout(()=>{if(mode==='over')show('over',true)},500)}
function hit(){if(act.jet>0||G.inv>0||mode!=='play')return;gameOver()}

function step(h){for(const t of TR)if(t.on)t.x+=t.vt*h;
 P.sl-=h;const ph=P.h;
 if(!P.air){const tg=(P.on?P.on.vt:0)+V*(P.sl>0?.92:1);P.vx+=(tg-P.vx)*Math.min(1,h*8)}   // on a train the player is carried by it
 P.x+=P.vx*h;
 if(act.jet>0){P.h+=(260-P.h)*Math.min(1,h*4);P.vy=0}else{P.vy=Math.max(-1300,P.vy-2300*h);P.h+=P.vy*h}
 const sup=support(P.row,P.x);
 if(act.jet<=0&&P.h<sup&&sup-P.h<=26&&P.vy<=0){P.h=sup;P.vy=0}   // land / walk up ramp / step onto roof
 P.air=P.h>sup+.8;P.on=(!P.air&&sup>0)?SUPT:null;
 if(act.jet<=0&&G.inv<=0&&blocked(P.row,P.x,P.h))hit()}
function upd(dt){G.t+=dt;V=Math.min(760,430+G.t*6);for(const k in act)if(act[k]>0){act[k]-=dt;if(act[k]<=0&&k==='jet')G.inv=1.5}G.inv=Math.max(0,G.inv-dt);
 const x0=P.x,n=Math.ceil(dt/.008);for(let i=0;i<n&&mode==='play';i++)step(dt/n);if(mode!=='play')return;
 G.dist=(P.x)/50;const mult=Math.min(5,1+Math.floor(G.dist/200))*(act.x2>0?2:1);G.score+=(P.x-x0)*mult*.04;
 P.ry+=(RW[P.row]-P.ry)*Math.min(1,dt*12);camX=P.x-250;
 while(G.nx<P.x+W+500)spawn();
 const ctr=P.h+(P.sl>0&&!P.air?22:43);
 for(const t of TR)if(t.on&&(t.x+t.len<camX-400||t.x>P.x+6000)){t.on=0;for(const c of CO)if(c.t===t)c.on=0;for(const i of IT)if(i.t===t)i.on=0}
 for(const c of CO){if(!c.on)continue;let x=c.t?c.t.x+c.ox:c.x;if(x<camX-120&&!c.t){c.on=0;continue}
  if(act.mag>0&&Math.abs(c.row-P.row)<=1&&Math.abs(x-P.x)<300){const hh=c.t?c.h:c.h;c.x=x;c.t=null;c.row=P.row;c.x+=(P.x-c.x)*Math.min(1,dt*9);c.h+=(ctr-c.h)*Math.min(1,dt*9);x=c.x}
  if(c.row===P.row&&Math.abs(x-P.x)<30&&(act.jet>0?true:Math.abs(c.h-ctr)<52)){c.on=0;G.coins++;S.m.coins.p++;G.score+=10*mult;sfx.coin();const f=gt(FX);if(f)Object.assign(f,{x,h:c.h,row:c.row,t:0})}}
 for(const p of PK)if(p.on){if(p.x<camX-100)p.on=0;else if(p.row===P.row&&Math.abs(p.x-P.x)<34&&(act.jet>0||Math.abs(p.h-ctr)<60)){p.on=0;act[['mag','jet','x2','shoe'][p.k]]=p.k===1?6:9;sfx.pu();if(p.k===1)P.vy=0}}
 for(const i of IT){if(!i.on)continue;const x=i.t?i.t.x+i.off:i.x;if(x<camX-120&&!i.t){i.on=0;continue}
  if(i.row!==P.row)continue;const sf=i.t?i.t.h:0,hw=(i.ty==='bar'?70:i.ty==='low'?62:56)/2+13;
  if(!i.done&&x<P.x-50){i.done=1;if(i.ty!=='bar')S.m.jumps.p++}
  if(Math.abs(P.x-x)<hw&&act.jet<=0&&G.inv<=0){if(i.ty==='bar'){const top=P.h+(P.sl>0&&!P.air?44:86);if(top>sf+52&&P.h<sf+78)hit()}else if(P.h<sf+(i.ty==='low'?46:44))hit()}}
 for(const f of FX)if(f.on){f.t+=dt;if(f.t>.45)f.on=0}
 G.step-=dt;if(G.step<=0&&!P.air){G.step=.28;sfx.step()}
 $('sc').textContent=Math.floor(G.score);$('mult').textContent='x'+mult;$('hc').textContent=S.coins+G.coins;
 const nm={mag:'Magnet',jet:'Jetpack',x2:'2X',shoe:'Jump'};$('pus').innerHTML=Object.keys(act).map(k=>act[k]>0?`<span class="pu">${nm[k]} ${Math.ceil(act[k])}s</span>`:'').join('')}

/* ---------- input (same keys and swipes; left/right now switch tracks) ---------- */
function mv(d){if(mode!=='play')return;const n=P.row+d;if(n<0||n>2)return;const s=support(n,P.x);if(s-P.h>26||blocked(n,P.x,P.h)){tone(120,.1,'square',.06);return}P.row=n;P.air=P.h>s+.8;sfx.click()}
function jump(){if(mode!=='play'||P.air||act.jet>0)return;P.vy=act.shoe>0?1120:880;P.air=1;sfx.jump();P.sl=0}
function slid(){if(mode!=='play')return;if(P.air)P.vy=-1300;else P.sl=.6}
addEventListener('keydown',e=>{const k=e.key;if(k==='ArrowLeft'||k==='a'||k==='A')mv(-1);else if(k==='ArrowRight'||k==='d'||k==='D')mv(1);else if(k==='ArrowUp'||k==='w'||k==='W'||k===' ')jump();else if(k==='ArrowDown'||k==='s'||k==='S')slid();else if(k==='Escape')pauseG();if(k===' '||k.startsWith('Arrow'))e.preventDefault()});
let tx=0,ty=0,tg=false;
addEventListener('touchstart',e=>{if(e.target.closest('.btn,#panel'))return;tx=e.touches[0].clientX;ty=e.touches[0].clientY;tg=true},{passive:true});
addEventListener('touchmove',e=>{if(!tg)return;const dx=e.touches[0].clientX-tx,dy=e.touches[0].clientY-ty;if(Math.abs(dx)>28||Math.abs(dy)>28){if(Math.abs(dx)>Math.abs(dy))mv(dx>0?1:-1);else dy<0?jump():slid();tg=false}},{passive:true});
addEventListener('touchend',()=>tg=false);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='play')pauseG()});


/* ---------- realistic trains, ramps, obstacles, coins ---------- */
function sideTex(d){return ctex(256,182,(g,w,h)=>{g.fillStyle=d.b;g.fillRect(0,0,w,h);grad(g,w,h,[[0,'rgba(255,255,255,.22)'],[.45,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.22)']]);
 g.fillStyle='#cdd3e2';g.fillRect(0,0,w,16);g.fillStyle='rgba(0,0,0,.18)';g.fillRect(0,16,w,3);
 g.fillStyle=d.s;g.fillRect(0,112,w,16);g.fillStyle='#fff';g.fillRect(0,128,w,4);
 for(let i=0;i<3;i++){g.fillStyle=['rgba(40,220,220,.5)','rgba(255,70,160,.45)','rgba(255,220,40,.5)'][i];g.beginPath();g.arc(Math.random()*w,120+Math.random()*30,9+Math.random()*12,0,7);g.fill()}
 for(const x of[14,146]){g.fillStyle='#f4f1ea';g.fillRect(x-4,28,104,66);const r=g.createLinearGradient(0,32,0,90);r.addColorStop(0,'#a9e0f7');r.addColorStop(1,'#3f86bd');g.fillStyle=r;g.fillRect(x,32,46,58);g.fillRect(x+50,32,46,58);g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.moveTo(x+6,32);g.lineTo(x+22,32);g.lineTo(x+4,90);g.lineTo(x-4,90);g.fill()}
 g.fillStyle='rgba(0,0,0,.28)';g.fillRect(121,22,2,92);g.fillRect(137,22,2,92);g.fillStyle='#2e3340';g.fillRect(0,150,w,32);g.fillStyle='#14161b';for(const x of[56,200]){g.beginPath();g.arc(x,166,12,0,7);g.fill()}nz(g,w,h,900,.07)},1)}
const roofTex=ctex(256,256,(g,w,h)=>{g.fillStyle='#c4ccd8';g.fillRect(0,0,w,h);g.fillStyle='#e3e8f0';g.fillRect(0,0,12,h);g.fillRect(w-12,0,12,h);g.fillStyle='#8993a3';g.fillRect(40,28,176,200);g.strokeStyle='#5b6474';g.lineWidth=2;for(let y=36;y<224;y+=9){g.beginPath();g.moveTo(46,y);g.lineTo(210,y);g.stroke()}g.strokeStyle='#e3e8f0';g.lineWidth=4;g.strokeRect(40,28,176,200);g.fillStyle='#aab3c2';g.fillRect(100,0,56,14);nz(g,w,h,1800,.07)},1);
function endTex(d,front){return ctex(208,182,(g,w,h)=>{g.fillStyle=d.b;g.fillRect(0,0,w,h);grad(g,w,h,[[0,'rgba(255,255,255,.15)'],[1,'rgba(0,0,0,.35)']]);
 if(front){g.fillStyle='#0d0f12';g.fillRect(22,22,164,70);const r=g.createLinearGradient(0,26,0,88);r.addColorStop(0,'#6d8aa6');r.addColorStop(1,'#1a2531');g.fillStyle=r;g.fillRect(26,26,156,62);g.fillStyle='#ffb000';g.fillRect(70,8,68,10);
  for(const x of[36,172]){g.fillStyle='#fff7d0';g.beginPath();g.arc(x,128,11,0,7);g.fill();g.fillStyle='rgba(255,247,200,.3)';g.beginPath();g.arc(x,128,19,0,7);g.fill()}g.fillStyle=d.s;g.fillRect(0,106,w,8)}
 else{g.fillStyle='#14161a';g.fillRect(60,18,88,120);g.fillStyle='#41576c';g.fillRect(66,24,76,48);g.fillStyle='#f2b705';for(let x=0;x<w;x+=26){g.fillRect(x,150,13,14)}g.fillStyle='#2a2c33';g.fillRect(90,164,28,14)}
 g.fillStyle='#17181c';g.fillRect(0,150+(front?0:0),w,h);if(!front){g.fillStyle='#f2b705';for(let x=0;x<w;x+=26)g.fillRect(x,150,13,14)}nz(g,w,h,1500,.12)})}
const GEO={};for(let n=3;n<=6;n++){const g=new THREE.BoxGeometry(2.6,2.28,3.2*n),u=g.attributes.uv;for(let i=0;i<8;i++)u.setX(i,u.getX(i)*n);for(let i=8;i<12;i++)u.setY(i,u.getY(i)*n);GEO[n]=g}
const stdM=(map,r,m)=>new THREE.MeshStandardMaterial({map,roughness:r,metalness:m});
const roofM=stdM(roofTex,.5,.1),undM=mt(0x16171a,.9);
const MATS=DES.map(d=>{const s=stdM(sideTex(d),.5,.05);return[s,s,roofM,undM,stdM(endTex(d,0),.5,.3),stdM(endTex(d,1),.5,.3)]});
const plateT=ctex(128,256,(g,w,h)=>{g.fillStyle='#7b8088';g.fillRect(0,0,w,h);g.strokeStyle='rgba(30,30,30,.45)';for(let y=6;y<h;y+=16)for(let x=(y/16%2)*8+4;x<w-14;x+=16){g.beginPath();g.moveTo(x,y);g.lineTo(x+7,y+7);g.stroke()}g.fillStyle='#e6b800';g.fillRect(0,0,10,h);g.fillRect(w-10,0,10,h);g.fillStyle='#111';for(let y=0;y<h;y+=24){g.beginPath();g.moveTo(0,y);g.lineTo(10,y+12);g.lineTo(10,y+24);g.lineTo(0,y+12);g.fill();g.beginPath();g.moveTo(w-10,y);g.lineTo(w,y+12);g.lineTo(w,y+24);g.lineTo(w-10,y+12);g.fill()}nz(g,w,h,3000,.2)},1);
function makeRamp(){const g=new THREE.Group(),L=5.2,H=2.4,s=Math.hypot(L,H),a=Math.atan2(H,L),slabG=new THREE.BoxGeometry(2.3,.12,s),u=slabG.attributes.uv;for(let i=8;i<12;i++)u.setY(i,u.getY(i)*3);
 const slab=new THREE.Mesh(slabG,stdM(plateT,.5,.6));slab.rotation.x=a;slab.position.set(0,H/2-.06,L/2);slab.castShadow=slab.receiveShadow=true;g.add(slab);
 for(const sd of[-1.1,1.1]){const r=bx(.08,.08,s,mt(0xf2b705,.5,.4),sd,H/2+.5,L/2,g);r.rotation.x=a;for(let i=0;i<=4;i++){const f=i/4;bx(.07,.5+.0,.07,mt(0xf2b705,.5,.4),sd,H*(1-f)+.28,f*L,g)}}
 for(let i=1;i<=4;i++){const f=i/5,h=H*(1-f);for(const sd of[-1,1])bx(.14,h,.14,mt(0x2b2e36,.7,.5),sd,h/2,f*L,g)}return g}
const TRM=TR.map(()=>{const g=new THREE.Group(),b=new THREE.Mesh(GEO[3],MATS[0]);b.position.y=1.26;b.castShadow=b.receiveShadow=true;g.add(b);const r=makeRamp();g.add(r);g.userData={b,r,k:''};g.visible=false;sc.add(g);return g});
const ITM=IT.map(()=>{const g=new THREE.Group(),m=mt(0x8c94a3,.5,.6);
 const v=new THREE.Group();v.name='vent';bx(1.1,.7,1,m,0,.35,0,v);bx(.8,.05,.8,0x15161a,0,.72,0,v);for(let i=0;i<4;i++)bx(.9,.04,.04,0x555b66,0,.2+i*.1,.52,v);g.add(v);
 const e=new THREE.Group();e.name='equip';bx(1.1,.88,1,mt(0xe0a800,.5,.3),0,.44,0,e);bx(.8,.4,.04,0x14125c,0,.55,.52,e);bx(.12,.2,.08,0xc62828,0,.18,.52,e);g.add(e);
 const l=new THREE.Group();l.name='low';bx(2.2,.5,.3,0xf2f2f2,0,.6,0,l);for(const x of[-.8,0,.8])bx(.4,.5,.32,0xc62828,x,.6,0,l);bx(.12,.5,.12,0x333,-1,.25,0,l);bx(.12,.5,.12,0x333,1,.25,0,l);g.add(l);
 const b=new THREE.Group();b.name='bar';bx(.12,1.56,.12,0x333,-1.15,.78,0,b);bx(.12,1.56,.12,0x333,1.15,.78,0,b);bx(2.4,.52,.3,0xe0b400,0,1.3,0,b);for(const x of[-.9,-.3,.3,.9])bx(.3,.54,.32,0x111,x,1.3,0,b);g.add(b);
 g.visible=false;sc.add(g);return g});
const PUC=['#d81b60','#1976d2','#f9a825','#388e3c'],PUL=['MAG','JET','2X','JUMP'];
const PKM=PK.map(()=>{const g=new THREE.Group(),tx=PUC.map((c,i)=>ctex(128,128,gg=>{gg.fillStyle=c;gg.fillRect(0,0,128,128);gg.fillStyle='#fff';gg.font='bold 40px sans-serif';gg.textAlign='center';gg.textBaseline='middle';gg.fillText(PUL[i],64,64)}));g.userData.tx=tx;
 const d=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.14,24).rotateX(Math.PI/2),[mt(0x1fa2ff,.3,.6),new THREE.MeshStandardMaterial({map:tx[0],roughness:.4}),new THREE.MeshStandardMaterial({map:tx[0],roughness:.4})]);g.add(d);g.userData.d=d;
 g.add(new THREE.Mesh(new THREE.TorusGeometry(.7,.05,8,24),new THREE.MeshBasicMaterial({color:0x7af0ff,fog:false})));g.visible=false;sc.add(g);return g});
const starT=ctex(64,64,(g,w,h)=>{const r=g.createRadialGradient(24,24,2,32,32,32);r.addColorStop(0,'#ffe680');r.addColorStop(1,'#d79a00');g.fillStyle=r;g.fillRect(0,0,w,h);g.fillStyle='#b97f00';g.beginPath();for(let i=0;i<10;i++){const q=i%2?7:16,a=i*Math.PI/5-Math.PI/2;g.lineTo(32+Math.cos(a)*q,32+Math.sin(a)*q)}g.fill()});
const CM=new THREE.InstancedMesh(new THREE.CylinderGeometry(.36,.36,.08,20).rotateX(Math.PI/2),[new THREE.MeshStandardMaterial({color:0xe9a900,metalness:.9,roughness:.25}),new THREE.MeshStandardMaterial({map:starT,metalness:.85,roughness:.25,emissive:0x6b4a00,emissiveIntensity:.5}),new THREE.MeshStandardMaterial({map:starT,metalness:.85,roughness:.25,emissive:0x6b4a00,emissiveIntensity:.5})],CO.length);CM.frustumCulled=false;sc.add(CM);
const glT=ctex(64,64,(g)=>{const r=g.createRadialGradient(32,32,2,32,32,32);r.addColorStop(0,'rgba(255,225,90,.9)');r.addColorStop(1,'rgba(255,200,0,0)');g.fillStyle=r;g.fillRect(0,0,64,64)});
const GM=new THREE.InstancedMesh(new THREE.PlaneGeometry(1.4,1.4),new THREE.MeshBasicMaterial({map:glT,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.5,fog:false}),CO.length);GM.frustumCulled=false;sc.add(GM);
const RM=FX.map(()=>{const m=new THREE.Mesh(new THREE.RingGeometry(.35,.45,20),new THREE.MeshBasicMaterial({color:0xffe45a,transparent:true,depthWrite:false,fog:false}));m.visible=false;sc.add(m);return m});

/* ---------- hero character (new model from the character sheet) ---------- */
let PM=null,pj={},landT=0,wasAir=0;const HAIR=[0x5a3520,0x2a1a10,0x111111,0xd0a84a,0x222222];
const logoC=document.createElement('canvas');logoC.width=128;logoC.height=64;
function drawLogo(){const g=logoC.getContext('2d');g.clearRect(0,0,128,64);g.fillStyle='#3b4de8';for(let i=0;i<14;i++){g.beginPath();g.arc(Math.random()*128,Math.random()*64,2+Math.random()*3,0,7);g.fill()}
 g.font='38px "Lilita One",Impact,sans-serif';g.textAlign='center';g.lineJoin='round';g.lineWidth=7;g.strokeStyle='#14125c';g.strokeText('RUNNER',64,28);g.fillStyle='#ffb300';g.fillText('RUNNER',64,28);g.strokeText('WORLD',64,58);g.fillStyle='#29b6ff';g.fillText('WORLD',64,58);logoT.needsUpdate=true}
const logoT=new THREE.CanvasTexture(logoC);logoT.encoding=THREE.sRGBEncoding;drawLogo();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(drawLogo);
const sm=(c,r)=>new THREE.MeshStandardMaterial({color:c,roughness:r||.6});
function cyl(rt,rb,h,c,x,y,z,p,seg){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||12),c.isMaterial?c:mt(c,.6));m.position.set(x,y,z);m.castShadow=true;if(p)p.add(m);return m}
function sph(r,c,x,y,z,sx,sy,sz,p){const m=new THREE.Mesh(icoG,c.isMaterial?c:mt(c,.6));m.geometry=sphG;m.scale.set(r*sx,r*sy,r*sz);m.position.set(x,y,z);m.castShadow=true;if(p)p.add(m);return m}
const sphG=new THREE.SphereGeometry(1,16,12);
function buildChar(i,outfit,board){if(PM)sc.remove(PM);const c=CH[i],hd=outfit>=0?OUT[outfit].c:c.h,sk=c.sk;PM=new THREE.Group();pj={};
 const root=new THREE.Group();PM.add(root);pj.root=root;const body=new THREE.Group();body.position.y=.8;root.add(body);pj.body=body;
 const tor=cyl(.34,.31,.6,hd,0,.3,0,body,16);tor.scale.z=.72;const hem=cyl(.35,.345,.12,hd,0,.04,0,body,16);hem.scale.z=.74;
 const vest=new THREE.Mesh(new THREE.CylinderGeometry(.375,.345,.48,18,1,true,Math.PI+.5,Math.PI*2-1),new THREE.MeshStandardMaterial({color:c.v,roughness:.7,side:THREE.DoubleSide}));vest.scale.z=.76;vest.position.y=.36;vest.castShadow=true;body.add(vest);
 bx(.3,.03,.02,0x9cc4ee,0,.5,.285,body);bx(.03,.4,.02,0x9cc4ee,0,.32,.285,body);bx(.26,.44,.03,0xd9312b,0,.36,-.25,body);
 for(const sd of[-1,1]){sph(.03,0xf0a030,sd*.2,.3,-.27,1,1,1,body);bx(.12,.12,.03,c.v,sd*.2,.25,-.26,body)}
 sph(.26,hd,0,.64,.2,1.55,.55,.9,body);sph(.2,hd,0,.5,.3,1.3,.7,.7,body);
 cyl(.065,.065,.26,0xffe21f,-.37,.08,.14,body,10);cyl(.045,.055,.07,0x1f6fd1,-.37,.24,.14,body,10);
 const head=new THREE.Group();head.position.y=.62;body.add(head);pj.head=head;
 sph(.35,sk,0,.32,0,1,1.02,.98,head);for(const sd of[-1,1]){sph(.07,sk,sd*.34,.32,0,.6,1,.8,head);
  sph(.075,0xffffff,sd*.14,.34,-.3,1,1.15,.5,head);sph(.045,0x5a3016,sd*.14,.34,-.33,1,1.1,.5,head);sph(.022,0x111111,sd*.14,.34,-.345,1,1,.5,head);bx(.13,.03,.03,0x3a2012,sd*.14,.46,-.32,head).rotation.z=sd*-.15}
 sph(.045,0xd98e5a,0,.26,-.35,1,1,1,head);bx(.1,.02,.02,0x9a3a30,0,.15,-.33,head);
 const hr=new THREE.Mesh(new THREE.SphereGeometry(.37,16,10,0,Math.PI),mt(HAIR[i],.8));hr.position.set(0,.34,.02);hr.castShadow=true;head.add(hr);sph(.3,HAIR[i],0,.5,-.08,1,.4,.7,head);
 const cb=new THREE.Mesh(new THREE.SphereGeometry(.4,18,8,0,Math.PI,0,Math.PI/2),mt(0x1d1d22,.6)),cf=new THREE.Mesh(new THREE.SphereGeometry(.4,18,8,Math.PI,Math.PI,0,Math.PI/2),mt(0xf3f0ea,.6));cb.position.set(0,.46,0);cf.position.set(0,.46,0);cb.castShadow=cf.castShadow=true;head.add(cb,cf);
 bx(.5,.04,.36,c.cap,0,.47,-.44,head).rotation.x=.1;bx(.16,.05,.03,0x777b84,0,.4,.4,head);
 const lg=new THREE.Group();lg.rotation.y=Math.PI;lg.position.set(0,.6,-.355);const lp=new THREE.Mesh(new THREE.PlaneGeometry(.38,.19),new THREE.MeshBasicMaterial({map:logoT,transparent:true}));lp.rotation.x=-.32;lg.add(lp);head.add(lg);
 const pa=mt(c.pa,.7),cuffM=mt(c.pa,.8);
 for(const sd of[-1,1]){const arm=new THREE.Group();arm.position.set(sd*.43,.5,0);body.add(arm);pj['a'+sd]=arm;
  cyl(.115,.13,.46,hd,0,-.23,0,arm);cyl(.14,.14,.07,0xe9e4d8,0,-.47,0,arm);sph(.1,sk,0,-.57,0,1,1,1,arm);
  if(sd>0){const cn=cyl(.065,.065,.25,0xffe21f,0,-.58,-.12,arm,10);cn.rotation.x=Math.PI/2;const cp=cyl(.045,.055,.07,0x1f6fd1,0,-.58,-.27,arm,10);cp.rotation.x=Math.PI/2}
  const hip=new THREE.Group();hip.position.set(sd*.19,.8,0);root.add(hip);pj['l'+sd]=hip;cyl(.15,.17,.42,pa,0,-.2,0,hip);
  const kn=new THREE.Group();kn.position.y=-.4;hip.add(kn);pj['k'+sd]=kn;cyl(.17,.2,.34,pa,0,-.16,0,kn);cyl(.215,.24,.14,cuffM,0,-.3,0,kn);
  sph(.2,0xf4efe4,0,-.3,-.06,1,.55,1.5,kn);bx(.34,.05,.5,0xe0d8c6,0,-.37,-.06,kn);bx(.3,.045,.1,0x55c02e,0,-.2,-.1,kn).rotation.x=.3;bx(.3,.045,.1,0x55c02e,0,-.17,-.2,kn).rotation.x=.3;bx(.14,.1,.07,0xd9312b,0,-.16,.12,kn);bx(.2,.1,.06,0xf4efe4,0,-.13,-.02,kn)}
 if(board>=0){bx(.8,.1,1.6,BRD[board].c,0,.02,0,root)}
 PM.scale.setScalar(.78);sc.add(PM)}
function pose(t,m,sl,ex){ex=ex||{};const q=pj,B=q.body,Rt=q.root,hd=q.head,w=t*(m==='climb'?11:13),s=Math.sin(w),k0=(1+Math.sin(w+1.3))*.5,k1=(1+Math.sin(w+1.3+Math.PI))*.5,L=q.l1,Lm=q['l-1'],K1=q.k1,Km=q['k-1'],A=q.a1,Am=q['a-1'];
 Rt.rotation.set(0,0,0);Rt.position.y=0;Rt.scale.set(1,1,1);B.rotation.set(0,0,0);hd.rotation.set(0,0,0);let by=0;
 if(m==='run'||m==='climb'){const cl=m==='climb',sw=cl?1.1:.95,kb=cl?1.6:1.2;L.rotation.x=s*sw;Lm.rotation.x=-s*sw;K1.rotation.x=-k0*kb;Km.rotation.x=-k1*kb;A.rotation.x=-s*.9+.45;Am.rotation.x=s*.9+.45;by=Math.abs(Math.cos(w))*.06;B.rotation.x=cl?-.3:-.14;B.rotation.y=s*.12;hd.rotation.y=-s*.08;hd.rotation.x=cl?.2:.08}
 else if(m==='air'){const up=(ex.vy||0)>0;L.rotation.x=up?.9:.45;K1.rotation.x=up?-1.2:-.3;Lm.rotation.x=up?-.35:-.15;Km.rotation.x=up?-.5:-.1;A.rotation.x=1.9;Am.rotation.x=1.4;B.rotation.x=-.1}
 else if(m==='slide'){B.rotation.x=1.15;L.rotation.x=Lm.rotation.x=1.35;K1.rotation.x=Km.rotation.x=-.2;A.rotation.x=.3;Am.rotation.x=-.6;hd.rotation.x=-.5;Rt.position.y=-.28}
 else if(m==='land'){const k=ex.land||0;Rt.scale.y=1-.12*k;Rt.position.y=-.15*k;L.rotation.x=Lm.rotation.x=.5*k;K1.rotation.x=Km.rotation.x=-1.1*k;A.rotation.x=-.5*k;Am.rotation.x=-.5*k;B.rotation.x=-.3*k}
 else{L.rotation.x=Lm.rotation.x=0;K1.rotation.x=Km.rotation.x=0;A.rotation.x=1.2+Math.sin(t*3)*.15;Am.rotation.x=.1;hd.rotation.y=Math.sin(t*1.2)*.2;by=Math.sin(t*3)*.02}
 Rt.position.y+=by;Rt.rotation.z=ex.roll||0;Rt.rotation.y=ex.yaw||0}
const blob=new THREE.Mesh(new THREE.CircleGeometry(.6,16).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.3,depthWrite:false}));sc.add(blob);
const flame=new THREE.Mesh(new THREE.ConeGeometry(.2,.8,8).rotateX(Math.PI),new THREE.MeshBasicMaterial({color:0xffa11a,fog:false}));flame.visible=false;sc.add(flame);

/* ---------- rear chase camera + scene sync ---------- */
let cX=0,cY=4.4,lY=1.6,charKey='';const dm=new THREE.Object3D(),zf=x=>-(x-P.x)*K;
function render3D(dt){const play=mode!=='menu',s=P.x*K,ck=(play?S.char:prevIdx)+'|'+S.outfit+'|'+S.board;
 if(ck!==charKey){buildChar(play?S.char:prevIdx,S.outfit,S.board);charKey=ck}
 trkT.offset.y=-(s/4)%1;gravT.offset.y=bedT.offset.y=-(s/5)%1;updateEnv(s);
 if(!play){PM.position.set(0,0,0);PM.rotation.y=Math.PI;PM.scale.setScalar(1.1);pose(T,'idle',0,{});blob.position.set(0,.03,0);flame.visible=false;
  cam.position.set(0,1.55,4.8);cam.lookAt(0,1.05,0);cX=0;cY=4.4;lY=1.6;P.ry=0}
 else{const sup=P.on?P.on.h:0,sl=P.sl>0&&!P.air;PM.visible=!(G.inv>0&&Math.floor(T*14)%2);PM.position.set(P.ry,P.h*K,0);PM.rotation.y=0;PM.scale.setScalar(.78);if(wasAir&&!P.air)landT=.2;wasAir=P.air;landT=Math.max(0,landT-dt);const dx=(RW[P.row]-P.ry)/LANE;pose(T,sl?'slide':P.air?'air':landT>0?'land':(P.on&&P.x<P.on.x)?'climb':'run',sl,{roll:-dx*.35,yaw:-dx*.3,vy:P.vy,land:landT/.2});
  blob.position.set(P.ry,(P.air?sup:P.h)*K+.03,0);flame.visible=act.jet>0;flame.position.set(P.ry,P.h*K+.9,.45+Math.random()*.05);
  // third-person chase camera: always behind the runner, smoothed on X and Y, never rotates sideways
  cX+=(P.ry*.7-cX)*Math.min(1,dt*5);cY+=((4.3+P.h*K*.6)-cY)*Math.min(1,dt*3.5);lY+=((1.5+P.h*K*.5)-lY)*Math.min(1,dt*3.5);
  cam.position.set(cX,cY,7.2);cam.lookAt(cX*.8,lY,-15)}
 TR.forEach((t,i)=>{const g=TRM[i];if(!t.on){g.visible=false;return}const zr=zf(t.x),zfr=zf(t.x+t.len);if(zfr>16||zr<-175){g.visible=false;return}
  const u=g.userData,k=t.len+'|'+DES.indexOf(t.des);if(u.k!==k){u.k=k;u.b.geometry=GEO[t.len/160];u.b.material=MATS[DES.indexOf(t.des)]}
  u.b.rotation.y=t.vt<0?Math.PI:0;u.r.visible=!!t.ramp;u.r.position.z=t.len*K/2;g.position.set(RW[t.row],0,(zr+zfr)/2);g.visible=true});
 IT.forEach((it,i)=>{const g=ITM[i];if(!it.on){g.visible=false;return}const z=zf(it.t?it.t.x+it.off:it.x);if(z>14||z<-170){g.visible=false;return}
  g.children.forEach(c=>c.visible=c.name===it.ty);g.position.set(RW[it.row],(it.t?HT:0)*K,z);g.visible=true});
 PK.forEach((p,i)=>{const g=PKM[i];if(!p.on){g.visible=false;return}const z=zf(p.x);if(z>14||z<-170){g.visible=false;return}
  const d=g.userData.d;if(g.userData.k!==p.k){g.userData.k=p.k;d.material[1].map=d.material[2].map=g.userData.tx[p.k];d.material[1].needsUpdate=d.material[2].needsUpdate=true}
  g.position.set(RW[p.row],p.h*K+Math.sin(T*4)*.1,z);g.rotation.y=T*2.5;g.visible=true});
 CO.forEach((c,i)=>{if(!c.on){dm.scale.set(0,0,0);dm.updateMatrix();CM.setMatrixAt(i,dm.matrix);GM.setMatrixAt(i,dm.matrix);return}
  const z=zf(c.t?c.t.x+c.ox:c.x);if(z>10||z<-150){dm.scale.set(0,0,0)}else{dm.scale.set(1,1,1)}
  dm.position.set(RW[c.row],c.h*K,z);dm.rotation.set(0,T*5+c.ph,0);dm.updateMatrix();CM.setMatrixAt(i,dm.matrix);
  dm.rotation.set(0,0,0);dm.scale.multiplyScalar(.9+Math.sin(T*6+c.ph)*.12);dm.updateMatrix();GM.setMatrixAt(i,dm.matrix)});
 CM.instanceMatrix.needsUpdate=GM.instanceMatrix.needsUpdate=true;
 FX.forEach((f,i)=>{const r=RM[i];if(!f.on){r.visible=false;return}const k=f.t/.45;r.position.set(RW[f.row],f.h*K+k*.6,zf(f.x));r.scale.setScalar(1+k*3);r.material.opacity=1-k;r.visible=true})}
size();
/* ---------- panels ---------- */
function closeP(){$('panel').style.display='none';document.querySelector('.logo').style.display='';if(mode==='menu')newPlayer()}
function openP(w){const p=$('panel');p.style.display='block';document.querySelector('.logo').style.display='none';p.dataset.w=w;rp()}
function rp(){const p=$('panel'),w=p.dataset.w;let h=`<h2>${{chars:'Characters',shop:'Shop',missions:'Missions',settings:'Settings'}[w]} <button class="btn cl" onclick="closeP()">✕</button> <span class="chip cl" style="margin-right:8px">🪙 ${S.coins}</span></h2>`;
 if(w==='chars'){const c=CH[pv],own=S.chars.includes(pv);
  h+=`<div class="row"><button class="btn b" onclick="pc(-1)">◀</button><div style="text-align:center"><div style="font-size:28px">${c.n}</div>${own?(S.char===pv?'Selected':'Unlocked'):'🪙 '+c.p}</div><button class="btn b" onclick="pc(1)">▶</button></div>
  <button class="btn g" style="width:100%" onclick="selC()">${own?'Select':'Unlock for '+c.p}</button>`;
  prevIdx=pv}
 else if(w==='shop'){const it=(a,pre,name)=>a.map((x,i)=>{const id=pre+i,own=S.items.includes(id),eq=(pre==='o'?S.outfit:S.board)===i;return `<div class="row"><span>${x.n}</span><button class="btn ${eq?'x':''}" onclick="buy('${id}')">${eq?'Equipped':own?'Equip':'🪙 '+x.p}</button></div>`}).join('');
  h+='<b>Outfits</b>'+it(OUT,'o')+'<b>Skateboards</b>'+it(BRD,'b')+`<div class="row"><span>Unlock more heroes in Characters</span></div>`}
 else if(w==='missions'){h+=MIS.map(([k,n,g])=>{const m=S.m[k],goal=g*(m.t+1),rw=100*(m.t+1),ok=m.p>=goal;return `<div class="row"><div style="flex:1">${n}: ${Math.min(m.p,goal)}/${goal}<div class="bar"><i style="width:${Math.min(100,m.p/goal*100)}%"></i></div></div><button class="btn ${ok?'g':'x'}" onclick="claim('${k}')">${ok?'Claim':''} 🪙${rw}</button></div>`}).join('')}
 else{h+=['music','sfx'].map(k=>`<div class="row"><span>${k==='music'?'Music':'Sound effects'}</span><button class="btn" onclick="tg2('${k}')">${S.set[k]?'On':'Off'}</button></div>`).join('')+`<div class="row"><span>Graphics</span><button class="btn" onclick="tg2('q')">${S.set.q?'High':'Low (faster)'}</button></div>`}
 p.innerHTML=h}
function pc(d){pv=(pv+d+CH.length)%CH.length;rp()}
function selC(){const c=CH[pv];if(!S.chars.includes(pv)){if(S.coins<c.p)return flash('Not enough coins');S.coins-=c.p;S.chars.push(pv)}S.char=pv;save();refreshMenu();rp()}
function buy(id){const a=id[0]==='o'?OUT:BRD,i=+id.slice(1),own=S.items.includes(id);if(!own){if(S.coins<a[i].p)return flash('Not enough coins');S.coins-=a[i].p;S.items.push(id)}
 const f=id[0]==='o'?'outfit':'board';S[f]=S[f]===i?-1:i;save();refreshMenu();rp()}
function claim(k){const m=S.m[k],g=MIS.find(x=>x[0]===k)[2]*(m.t+1);if(m.p<g)return;S.coins+=100*(m.t+1);m.p-=g;m.t++;save();refreshMenu();rp()}
function tg2(k){S.set[k]=S.set[k]?0:1;save();if(k==='q'&&window.__rwReady)size();rp()}
function flash(t){const p=$('panel');p.firstChild.insertAdjacentHTML('afterend',`<div class="row" style="background:var(--rd)">${t}</div>`)}

/* ---------- loop ---------- */
let last=performance.now();
function loop(n){requestAnimationFrame(loop);const dt=Math.min(.05,(n-last)/1000);last=n;T+=dt;
 if(mode==='play')upd(dt);else if(mode==='menu')P.x+=120*dt;
 render3D(dt);R.render(sc,cam)}
requestAnimationFrame(loop);
window.__rwReady=true;
