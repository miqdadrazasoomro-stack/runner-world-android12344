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
function rp(){const p=$('panel'),w=p.dataset.w;let h=<h2>${{chars:'Characters',shop:'Shop',missions:'Missions',settings:'Settings'}[w]} <button class="btn cl" onclick="closeP()">✕</button> <span class="chip cl" style="margin-right:8px">🪙 ${S.coins}</span></h2>;
 if(w==='chars'){const c=CH[pv],own=S.chars.includes(pv);
  h+=`<div class="row"><button class="btn b" onclick="pc(-1)">◀</button><div style="text-align:center"><div style="font-size:28px">${c.n}</div>${own?(S.char===pv?'Selected':'Unlocked'):'🪙 '+c.p}</div><button class="btn b" onclick="pc(1)">▶</button></div>
  <button class="btn g" style="width:100%" onclick="selC()">${own?'Select':'Unlock for '+c.p}</button>`;
  prevIdx=pv}
 else if(w==='shop'){const it=(a,pre,name)=>a.map((x,i)=>{const id=pre+i,own=S.items.includes(id),eq=(pre==='o'?S.outfit:S.board)===i;return <div class="row"><span>${x.n}</span><button class="btn ${eq?'x':''}" onclick="buy('${id}')">${eq?'Equipped':own?'Equip':'🪙 '+x.p}</button></div>}).join('');
  h+='<b>Outfits</b>'+it(OUT,'o')+'<b>Skateboards</b>'+it(BRD,'b')+<div class="row"><span>Unlock more heroes in Characters</span></div>}
 else if(w==='missions'){h+=MIS.map(([k,n,g])=>{const m=S.m[k],goal=g*(m.t+1),rw=100*(m.t+1),ok=m.p>=goal;return <div class="row"><div style="flex:1">${n}: ${Math.min(m.p,goal)}/${goal}<div class="bar"><i style="width:${Math.min(100,m.p/goal*100)}%"></i></div></div><button class="btn ${ok?'g':'x'}" onclick="claim('${k}')">${ok?'Claim':''} 🪙${rw}</button></div>}).join('')}
 else{h+=['music','sfx'].map(k=><div class="row"><span>${k==='music'?'Music':'Sound effects'}</span><button class="btn" onclick="tg2('${k}')">${S.set[k]?'On':'Off'}</button></div>).join('')+<div class="row"><span>Graphics</span><button class="btn" onclick="tg2('q')">${S.set.q?'High':'Low (faster)'}</button></div>}
 p.innerHTML=h}
function pc(d){pv=(pv+d+CH.length)%CH.length;rp()}
function selC(){const c=CH[pv];if(!S.chars.includes(pv)){if(S.coins<c.p)return flash('Not enough coins');S.coins-=c.p;S.chars.push(pv)}S.char=pv;save();refreshMenu();rp()}
function buy(id){const a=id[0]==='o'?OUT:BRD,i=+id.slice(1),own=S.items.includes(id);if(!own){if(S.coins<a[i].p)return flash('Not enough coins');S.coins-=a[i].p;S.items.push(id)}
 const f=id[0]==='o'?'outfit':'board';S[f]=S[f]===i?-1:i;save();refreshMenu();rp()}
function claim(k){const m=S.m[k],g=MIS.find(x=>x[0]===k)[2]*(m.t+1);if(m.p<g)return;S.coins+=100*(m.t+1);m.p-=g;m.t++;save();refreshMenu();rp()}
function tg2(k){S.set[k]=S.set[k]?0:1;save();if(k==='q'&&window.__rwReady)size();rp()}
function flash(t){const p=$('panel');p.firstChild.insertAdjacentHTML('afterend',<div class="row" style="background:var(--rd)">${t}</div>)}

/* ---------- loop ---------- */
let last=performance.now();
function loop(n){requestAnimationFrame(loop);const dt=Math.min(.05,(n-last)/1000);last=n;T+=dt;
 if(mode==='play')upd(dt);else if(mode==='menu')P.x+=120*dt;
 render3D(dt);R.render(sc,cam)}
requestAnimationFrame(loop);
window.__rwReady=true;
