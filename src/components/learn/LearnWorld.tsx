"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { CharacterDef, drawCharacter } from "@/lib/characters";
import { ARTIFACTS, Artifact, ArtifactNode, DepositedArtifact } from "@/lib/learn/artifacts";
import {
  SPACES, CORRIDORS, Space, Corridor,
  LEARN_W, LEARN_H, VIEW_W, VIEW_H,
  PLAYER_SPEED, PLAYER_SIZE, TILE,
  isWalkable, ARTIFACT_WORLD_POS, START_X, START_Y,
} from "@/lib/learn/worldConstants";
import { supabase } from "@/lib/supabase";
import ConceptMap from "./ConceptMap";
import ArtifactModal from "./ArtifactModal";

type Vec = { x: number; y: number };
type OtherPlayer = { id: string; name: string; x: number; y: number; group: number };

function drawFloor(ctx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number, floorColor: string, wallColor: string, accentColor: string, pattern: Space["pattern"]) {
  ctx.save();
  ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip();
  ctx.fillStyle = floorColor; ctx.fillRect(rx, ry, rw, rh);
  if (pattern === "tile") {
    ctx.strokeStyle = wallColor + "22"; ctx.lineWidth = 0.5;
    for (let x = rx; x <= rx+rw; x += TILE) { ctx.beginPath(); ctx.moveTo(x,ry); ctx.lineTo(x,ry+rh); ctx.stroke(); }
    for (let y = ry; y <= ry+rh; y += TILE) { ctx.beginPath(); ctx.moveTo(rx,y); ctx.lineTo(rx+rw,y); ctx.stroke(); }
  } else if (pattern === "wood") {
    ctx.strokeStyle = wallColor+"1a"; ctx.lineWidth = 1.5;
    for (let y = ry; y<=ry+rh; y+=24) { ctx.beginPath(); ctx.moveTo(rx,y); ctx.lineTo(rx+rw,y); ctx.stroke(); }
    ctx.fillStyle = wallColor+"0a";
    for (let x=rx+15; x<rx+rw; x+=55) for (let y=ry+8; y<ry+rh; y+=24) { ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fill(); }
  } else if (pattern === "stone") {
    ctx.strokeStyle = wallColor+"28"; ctx.lineWidth = 1;
    let row=0;
    for (let y=ry; y<ry+rh; y+=44,row++) { const off=(row%2)*55; for (let x=rx-off; x<rx+rw+55; x+=110) ctx.strokeRect(x+2,y+2,106,40); }
  } else if (pattern === "marble") {
    ctx.strokeStyle = accentColor+"18"; ctx.lineWidth = 1;
    for (let d=-rh; d<rw+rh; d+=30) { ctx.beginPath(); ctx.moveTo(rx+d,ry); ctx.lineTo(rx+d-rh,ry+rh); ctx.stroke(); }
    ctx.strokeStyle = accentColor+"12"; ctx.lineWidth = 0.5;
    const ds=56;
    for (let x=rx; x<rx+rw+ds; x+=ds) for (let y=ry; y<ry+rh+ds; y+=ds) { ctx.beginPath(); ctx.moveTo(x,y-ds/2); ctx.lineTo(x+ds/2,y); ctx.lineTo(x,y+ds/2); ctx.lineTo(x-ds/2,y); ctx.closePath(); ctx.stroke(); }
  } else if (pattern === "carpet") {
    ctx.fillStyle = accentColor+"10"; ctx.fillRect(rx+12,ry+12,rw-24,rh-24);
    ctx.strokeStyle = accentColor+"35"; ctx.lineWidth = 1;
    ctx.strokeRect(rx+12,ry+12,rw-24,rh-24); ctx.strokeRect(rx+18,ry+18,rw-36,rh-36);
    for (let y=ry+26; y<ry+rh-12; y+=16) { ctx.beginPath(); ctx.moveTo(rx+20,y); ctx.lineTo(rx+rw-20,y); ctx.stroke(); }
  } else if (pattern === "grass") {
    for (let x=rx+8; x<rx+rw-4; x+=10) for (let y=ry+6; y<ry+rh-4; y+=12) {
      ctx.fillStyle = ((Math.floor((x-rx)/10)+Math.floor((y-ry)/12))%2===0)?"#5a8a3c22":"#4a7a2c18";
      ctx.fillRect(x,y,8,10);
    }
  } else if (pattern === "dirt") {
    ctx.fillStyle = wallColor+"12";
    for (let x=rx+5; x<rx+rw; x+=22) for (let y=ry+5; y<ry+rh; y+=18) { ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill(); }
  } else if (pattern === "cobble") {
    ctx.fillStyle = wallColor+"20"; ctx.strokeStyle = wallColor+"15"; ctx.lineWidth = 0.5;
    let rowC=0;
    for (let y=ry; y<ry+rh; y+=20,rowC++) { const off=(rowC%2)*18; for (let x=rx-off; x<rx+rw+36; x+=36) { ctx.fillRect(x+1,y+1,33,17); ctx.strokeRect(x+1,y+1,33,17); } }
  }
  ctx.restore();
}

function drawDecos(ctx: CanvasRenderingContext2D, space: Space, camX: number, camY: number) {
  const rw = space.w*TILE, rh = space.h*TILE;
  const rx = space.col*TILE-camX, ry = space.row*TILE-camY;
  const sx = rx+rw/2, sy = ry+rh/2;
  ctx.save();
  ctx.beginPath(); ctx.rect(rx,ry,rw,rh); ctx.clip();
  const bp = ["#7F77DD","#1D9E75","#EF9F27","#D4537E","#378ADD","#E24B4A","#5DCAA5"];
  if (space.type==="hub") {
    ctx.fillStyle = space.accentColor+"25"; ctx.beginPath(); ctx.arc(sx,sy,80,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = space.accentColor; ctx.lineWidth=2; ctx.setLineDash([8,5]);
    ctx.beginPath(); ctx.arc(sx,sy,80,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
    for (let a=0; a<Math.PI*2; a+=Math.PI/3) { const px=sx+Math.cos(a)*110,py=sy+Math.sin(a)*110; ctx.fillStyle=space.wallColor+"cc"; ctx.beginPath(); ctx.arc(px,py,8,0,Math.PI*2); ctx.fill(); }
  }
  if (space.type==="artifact"||space.type==="decoy") {
    ctx.fillStyle = space.wallColor+"bb"; ctx.fillRect(rx+12,ry+4,rw-28,14);
    let bx=rx+14; while(bx<rx+rw-16){ const bw=5+Math.floor((bx*7)%5),bh=10+Math.floor((bx*3)%5); ctx.fillStyle=bp[Math.floor(bx/6)%bp.length]; ctx.fillRect(bx,ry+5,bw,bh); bx+=bw+1; }
    [[rx+14,ry+rh-14],[rx+rw-14,ry+rh-14]].forEach(([px,py])=>{ ctx.fillStyle="#993C1D"; ctx.fillRect(px-7,py-4,14,10); ctx.fillStyle="#5a8a3c"; ctx.beginPath(); ctx.ellipse(px,py-12,9,6,-0.3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(px+6,py-9,6,4,0.4,0,Math.PI*2); ctx.fill(); });
    ctx.fillStyle=space.wallColor+"44"; ctx.fillRect(sx-24,sy-16,48,32); ctx.strokeStyle=space.accentColor; ctx.lineWidth=1; ctx.strokeRect(sx-24,sy-16,48,32);
  }
  if (space.type==="decoy") { ctx.strokeStyle="#ffffff18"; ctx.lineWidth=0.5; for(let a=0;a<Math.PI/2;a+=0.3){ctx.beginPath();ctx.moveTo(rx+20,ry+20);ctx.lineTo(rx+20+Math.cos(a)*30,ry+20+Math.sin(a)*30);ctx.stroke();} ctx.fillStyle=space.wallColor+"66"; ctx.font="italic 11px sans-serif"; ctx.textAlign="center"; ctx.fillText("(vacío)",sx,sy+6); }
  if (space.pattern==="grass"&&space.type==="yard") { [[sx-rw*0.3,sy-rh*0.25],[sx+rw*0.28,sy+rh*0.22]].forEach(([tx,ty])=>{ ctx.fillStyle="#8B6914"; ctx.fillRect(tx-4,ty-4,8,20); ctx.fillStyle="#3B6D11"; ctx.beginPath(); ctx.arc(tx,ty-10,18,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#639922"; ctx.beginPath(); ctx.arc(tx-6,ty-14,12,0,Math.PI*2); ctx.fill(); }); }
  ctx.restore();
}

function drawMinimap(ctx: CanvasRenderingContext2D, px: number, py: number, dep: DepositedArtifact[]) {
  const mmW=130,mmH=130,mmX=VIEW_W-mmW-8,mmY=VIEW_H-mmH-8,sc=mmW/LEARN_W;
  ctx.fillStyle="rgba(10,10,18,0.72)"; ctx.beginPath(); ctx.roundRect?.(mmX-3,mmY-3,mmW+6,mmH+6,5); ctx.fill();
  const tc: Record<string,string>={tt:"#7F77DD66",sim:"#1D9E7566",mod:"#EF9F2766",int:"#D4537E66",neutral:"#88878066"};
  for (const s of SPACES) { ctx.fillStyle=tc[s.theme]??"#ffffff22"; ctx.fillRect(mmX+s.col*TILE*sc,mmY+s.row*TILE*sc,s.w*TILE*sc,s.h*TILE*sc); }
  for (const c of CORRIDORS) { ctx.fillStyle="#aaaaaa44"; ctx.fillRect(mmX+c.col*TILE*sc,mmY+c.row*TILE*sc,c.w*TILE*sc,c.h*TILE*sc); }
  for (const s of SPACES) { if(!s.artifactId) continue; const d=dep.find(x=>x.id===s.artifactId); const cx=mmX+(s.col+s.w/2)*TILE*sc,cy=mmY+(s.row+s.h/2)*TILE*sc; ctx.fillStyle=d?"#5DCAA5":"#FFD700"; ctx.beginPath(); ctx.arc(cx,cy,2,0,Math.PI*2); ctx.fill(); }
  ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(mmX+px*sc,mmY+py*sc,3,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#ffffff88"; ctx.font="8px sans-serif"; ctx.textAlign="left"; ctx.fillText("mapa",mmX+3,mmY+9);
}

export default function LearnWorld({ playerName, sessionId, group, character }: { playerName:string; sessionId:string; group:1|2|3; character:CharacterDef; }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ pos:{x:START_X,y:START_Y} as Vec, cam:{x:0,y:0} as Vec, keys:{} as Record<string,boolean>, carried:null as string|null, otherPlayers:[] as OtherPlayer[], frame:0 });
  const animRef = useRef(0);
  const lastSyncRef = useRef(0);
  const [nearArtifact, setNearArtifact] = useState<Artifact|null>(null);
  const [nearDeposit, setNearDeposit] = useState(false);
  const [modalArtifact, setModalArtifact] = useState<Artifact|null>(null);
  const [carriedId, setCarriedId] = useState<string|null>(null);
  const [deposited, setDeposited] = useState<DepositedArtifact[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [currentRoom, setCurrentRoom] = useState("Entrada Principal");

  useEffect(() => {
    fetchDeposited();
    const ch = supabase.channel("lw_"+sessionId.slice(0,6))
      .on("postgres_changes",{event:"*",schema:"public",table:"learn_artifacts"},fetchDeposited)
      .on("postgres_changes",{event:"*",schema:"public",table:"learn_players"},fetchOtherPlayers)
      .subscribe();
    fetchOtherPlayers();
    animRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animRef.current); supabase.removeChannel(ch); };
  }, []);

  async function fetchDeposited() { const {data}=await supabase.from("learn_artifacts").select("*"); if(data) setDeposited(data as DepositedArtifact[]); }
  async function fetchOtherPlayers() { const {data}=await supabase.from("learn_players").select("*").neq("id",sessionId); if(data) stateRef.current.otherPlayers=data as OtherPlayer[]; }

  function loop() { update(); draw(); animRef.current=requestAnimationFrame(loop); }

  function update() {
    const s=stateRef.current; s.frame++;
    let dx=0,dy=0;
    if(s.keys["ArrowLeft"]||s.keys["a"]) dx-=PLAYER_SPEED;
    if(s.keys["ArrowRight"]||s.keys["d"]) dx+=PLAYER_SPEED;
    if(s.keys["ArrowUp"]||s.keys["w"]) dy-=PLAYER_SPEED;
    if(s.keys["ArrowDown"]||s.keys["s"]) dy+=PLAYER_SPEED;
    if(dx&&dy){dx*=0.707;dy*=0.707;}
    if(isWalkable(s.pos.x+dx,s.pos.y)) s.pos.x+=dx;
    if(isWalkable(s.pos.x,s.pos.y+dy)) s.pos.y+=dy;
    s.cam.x+=(Math.max(0,Math.min(LEARN_W-VIEW_W,s.pos.x-VIEW_W/2))-s.cam.x)*0.1;
    s.cam.y+=(Math.max(0,Math.min(LEARN_H-VIEW_H,s.pos.y-VIEW_H/2))-s.cam.y)*0.1;
    const room=SPACES.find(sp=>{const px=s.pos.x/TILE,py=s.pos.y/TILE;return px>=sp.col&&px<=sp.col+sp.w&&py>=sp.row&&py<=sp.row+sp.h;});
    if(room) setCurrentRoom(room.label);
    let nearArt:Artifact|null=null;
    if(!s.carried){let minD=58;for(const art of ARTIFACTS){if(deposited.find(d=>d.id===art.id))continue;const wp=ARTIFACT_WORLD_POS[art.id];if(!wp)continue;const dist=Math.hypot(s.pos.x-wp.x,s.pos.y-wp.y);if(dist<minD){minD=dist;nearArt=art;}}}
    setNearArtifact(nearArt);
    const hub=SPACES.find(sp=>sp.id==="hub")!;
    const hc={(x:(hub.col+hub.w/2)*TILE),(y:(hub.row+hub.h/2)*TILE)};
    setNearDeposit(!!s.carried&&Math.hypot(s.pos.x-hc.x,s.pos.y-hc.y)<90);
    if(Date.now()-lastSyncRef.current>1800){lastSyncRef.current=Date.now();supabase.from("learn_players").upsert({id:sessionId,name:playerName,group,x:Math.round(s.pos.x),y:Math.round(s.pos.y),updated_at:new Date().toISOString()});}
  }

  function draw() {
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext("2d")!;
    const s=stateRef.current;
    const camX=Math.round(s.cam.x),camY=Math.round(s.cam.y);
    ctx.fillStyle="#111009"; ctx.fillRect(0,0,VIEW_W,VIEW_H);
    ctx.fillStyle="rgba(255,255,255,0.025)";
    for(let gx=(-camX%48+48)%48;gx<VIEW_W;gx+=48) for(let gy=(-camY%48+48)%48;gy<VIEW_H;gy+=48) ctx.fillRect(gx,gy,1,1);
    for(const c of CORRIDORS){
      const rx=c.col*TILE-camX,ry=c.row*TILE-camY,rw=c.w*TILE,rh=c.h*TILE;
      if(rx>VIEW_W+80||rx+rw<-80||ry>VIEW_H+80||ry+rh<-80)continue;
      drawFloor(ctx,rx,ry,rw,rh,c.floorColor,"#888","#aaa",c.pattern);
      ctx.strokeStyle="rgba(0,0,0,0.2)"; ctx.lineWidth=1.5; ctx.strokeRect(rx,ry,rw,rh);
    }
    for(const space of SPACES){
      const rx=space.col*TILE-camX,ry=space.row*TILE-camY,rw=space.w*TILE,rh=space.h*TILE;
      if(rx>VIEW_W+80||rx+rw<-80||ry>VIEW_H+80||ry+rh<-80)continue;
      drawFloor(ctx,rx,ry,rw,rh,space.floorColor,space.wallColor,space.accentColor,space.pattern);
      ctx.strokeStyle=space.wallColor; ctx.lineWidth=space.type==="hub"?5:3; ctx.strokeRect(rx+1,ry+1,rw-2,rh-2);
      ctx.strokeStyle=space.wallColor+"44"; ctx.lineWidth=1; ctx.strokeRect(rx+5,ry+5,rw-10,rh-10);
      drawDecos(ctx,space,camX,camY);
      ctx.fillStyle=space.wallColor; ctx.font="500 10px sans-serif"; ctx.textAlign="center"; ctx.fillText(space.label,rx+rw/2,ry+13);
    }
    for(const art of ARTIFACTS){
      if(deposited.find(d=>d.id===art.id))continue;
      if(stateRef.current.carried===art.id)continue;
      const wp=ARTIFACT_WORLD_POS[art.id];if(!wp)continue;
      const sx=wp.x-camX,sy=wp.y-camY;
      if(sx<-40||sx>VIEW_W+40||sy<-40||sy>VIEW_H+40)continue;
      const isNear=nearArtifact?.id===art.id,isPrimary=art.primaryGroup===group,pulse=Math.sin(s.frame*0.07)*0.5+0.5;
      if(isPrimary){ctx.fillStyle=art.color+Math.round(18+pulse*28).toString(16).padStart(2,"0");ctx.beginPath();ctx.arc(sx,sy,26+pulse*4,0,Math.PI*2);ctx.fill();}
      ctx.fillStyle="rgba(0,0,0,0.3)";ctx.beginPath();ctx.ellipse(sx+2,sy+4,14,6,0,0,Math.PI*2);ctx.fill();
      const bs=isNear?34:30;ctx.fillStyle=isNear?art.color:art.color+"dd";ctx.strokeStyle=isNear?"#ffffff":art.color+"88";ctx.lineWidth=isNear?2.5:1.5;
      ctx.beginPath();ctx.roundRect?.(sx-bs/2,sy-bs/2,bs,bs,7);ctx.fill();ctx.stroke();
      ctx.fillStyle="#fff";ctx.font=`bold ${isNear?16:14}px sans-serif`;ctx.textAlign="center";ctx.fillText(art.icon,sx,sy+5);
      if(isNear){ctx.fillStyle="#fff";ctx.font="500 10px sans-serif";ctx.fillText("E — recoger",sx,sy-22);}
      if(isPrimary){ctx.fillStyle="#FFD700";ctx.font="9px sans-serif";ctx.fillText("★",sx+16,sy-16);}
    }
    const hub=SPACES.find(sp=>sp.id==="hub")!;
    const hcx=(hub.col+hub.w/2)*TILE-camX,hcy=(hub.row+hub.h/2)*TILE-camY;
    deposited.forEach((dep,i)=>{const art=ARTIFACTS.find(a=>a.id===dep.id);if(!art)return;const angle=(i/Math.max(deposited.length,1))*Math.PI*2-Math.PI/2;const ox=hcx+Math.cos(angle)*50,oy=hcy+Math.sin(angle)*50;const p2=Math.sin(s.frame*0.05+i)*2;ctx.fillStyle=art.color+"cc";ctx.beginPath();ctx.arc(ox,oy,8+p2,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.font="bold 7px sans-serif";ctx.textAlign="center";ctx.fillText(art.icon,ox,oy+2);});
    for(const op of stateRef.current.otherPlayers){const ox=op.x-camX,oy=op.y-camY;if(ox<-30||ox>VIEW_W+30||oy<-30||oy>VIEW_H+30)continue;const opc=op.group===1?"#7F77DD":op.group===2?"#1D9E75":"#EF9F27";ctx.globalAlpha=0.7;ctx.fillStyle=opc+"33";ctx.beginPath();ctx.arc(ox,oy,PLAYER_SIZE+4,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle="#fff";ctx.font="9px sans-serif";ctx.textAlign="center";ctx.fillText(op.name.slice(0,8),ox,oy-PLAYER_SIZE-5);}
    const ps=PLAYER_SIZE*2;drawCharacter(ctx,character,s.pos.x-ps/2-camX,s.pos.y-ps-camY,ps,ps*1.4,playerName);
    if(stateRef.current.carried){const art=ARTIFACTS.find(a=>a.id===stateRef.current.carried);if(art){const px=s.pos.x-camX,py=s.pos.y-camY;ctx.fillStyle=art.color;ctx.beginPath();ctx.arc(px,py-ps-14,10,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.font="bold 8px sans-serif";ctx.textAlign="center";ctx.fillText(art.icon,px,py-ps-11);}}
    drawMinimap(ctx,s.pos.x,s.pos.y,deposited);
  }

  const pickUpArtifact = useCallback(() => { if(!nearArtifact||stateRef.current.carried)return; setModalArtifact(nearArtifact); }, [nearArtifact]);
  function onArtifactSolved(id:string){stateRef.current.carried=id;setCarriedId(id);setModalArtifact(null);}
  function depositArtifact(){const c=stateRef.current.carried;if(!c||!nearDeposit)return;const art=ARTIFACTS.find(a=>a.id===c);if(!art)return;setModalArtifact({...art,_depositMode:true} as any);}
  async function onDeposit(id:string,node:ArtifactNode,relation:string){await supabase.from("learn_artifacts").upsert({id,node,relation,deposited_by:playerName,group,deposited_at:new Date().toISOString()});stateRef.current.carried=null;setCarriedId(null);setModalArtifact(null);fetchDeposited();}

  useEffect(()=>{
    const onDown=(e:KeyboardEvent)=>{stateRef.current.keys[e.key]=true;if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key))e.preventDefault();if((e.key==="e"||e.key==="E")&&nearArtifact&&!stateRef.current.carried)pickUpArtifact();if((e.key==="e"||e.key==="E")&&nearDeposit&&stateRef.current.carried)depositArtifact();if(e.key==="m"||e.key==="M")setShowMap(v=>!v);};
    const onUp=(e:KeyboardEvent)=>{stateRef.current.keys[e.key]=false;};
    window.addEventListener("keydown",onDown);window.addEventListener("keyup",onUp);
    return()=>{window.removeEventListener("keydown",onDown);window.removeEventListener("keyup",onUp);};
  },[nearArtifact,nearDeposit,pickUpArtifact]);

  const gc=group===1?"#7F77DD":group===2?"#1D9E75":"#EF9F27";
  const gl=group===1?"TT — Wellman & Leslie":group===2?"Simulación & Interacción":"Modularidad & Integración";

  return (
    <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
      <div style={{flex:"0 0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,fontSize:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:gc}}/><span style={{color:"var(--color-text-secondary)"}}>Grupo: <strong style={{color:"var(--color-text-primary)"}}>{gl}</strong></span></div>
          <div style={{display:"flex",gap:8,fontSize:11}}><span style={{color:"var(--color-text-tertiary)"}}>{currentRoom}</span>{carriedId&&<span style={{color:gc,fontWeight:500}}>cargando</span>}<span style={{color:"var(--color-text-secondary)"}}>{deposited.length}/{ARTIFACTS.length}</span></div>
        </div>
        {modalArtifact&&<ArtifactModal artifact={modalArtifact} playerGroup={group} depositMode={(modalArtifact as any)._depositMode} depositedSoFar={deposited} onSolved={onArtifactSolved} onDeposit={onDeposit} onClose={()=>setModalArtifact(null)}/>}
        <canvas ref={canvasRef} width={VIEW_W} height={VIEW_H} style={{display:"block",borderRadius:"var(--border-radius-lg)",border:"0.5px solid var(--color-border-tertiary)"}}/>
        <div style={{fontSize:10,color:"var(--color-text-tertiary)",textAlign:"center",marginTop:4}}>WASD/flechas — mover · E — recoger/depositar · M — mapa</div>
        <div style={{display:"flex",gap:6,marginTop:6}}>
          {nearArtifact&&!carriedId&&<button onClick={pickUpArtifact} style={{flex:1,padding:"7px 0",fontSize:12,border:`0.5px solid ${nearArtifact.color}`,borderRadius:"var(--border-radius-md)",background:"var(--color-background-primary)",cursor:"pointer",color:nearArtifact.color,fontWeight:500}}>E — Recoger "{nearArtifact.title}"</button>}
          {carriedId&&nearDeposit&&<button onClick={depositArtifact} style={{flex:1,padding:"7px 0",fontSize:12,border:"0.5px solid #7F77DD",borderRadius:"var(--border-radius-md)",background:"#EEEDFE",cursor:"pointer",color:"#3C3489",fontWeight:500}}>E — Depositar en el mapa</button>}
          <button onClick={()=>setShowMap(v=>!v)} style={{padding:"7px 14px",fontSize:12,border:"0.5px solid var(--color-border-secondary)",borderRadius:"var(--border-radius-md)",background:"var(--color-background-primary)",cursor:"pointer",color:"var(--color-text-primary)"}}>M — {showMap?"Ocultar":"Ver"} mapa</button>
        </div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:12,minWidth:0}}>
        {showMap?<ConceptMap deposited={deposited}/>:<>
          <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"1rem"}}>
            <div style={{fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:8}}>Tus artefactos ★</div>
            {ARTIFACTS.filter(a=>a.primaryGroup===group).map(art=>{const dep=deposited.find(d=>d.id===art.id);const isC=carriedId===art.id;return(<div key={art.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"0.5px solid var(--color-border-tertiary)",fontSize:12}}><div style={{width:20,height:20,borderRadius:4,background:dep?art.color:"var(--color-background-secondary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:dep?"#fff":art.color,fontWeight:"bold",flexShrink:0}}>{dep?"✓":art.icon}</div><span style={{flex:1,color:dep?"var(--color-text-tertiary)":"var(--color-text-primary)",textDecoration:dep?"line-through":"none",fontSize:11}}>{art.title}</span>{isC&&<span style={{fontSize:10,color:art.color}}>cargando</span>}</div>);})}
          </div>
          <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:"var(--border-radius-lg)",padding:"1rem"}}>
            <div style={{fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:8}}>Progreso colectivo</div>
            {[{g:1,l:"Teoría-Teoría",c:"#7F77DD"},{g:2,l:"Simulación",c:"#1D9E75"},{g:3,l:"Modularidad",c:"#EF9F27"}].map(gi=>{const total=ARTIFACTS.filter(a=>a.primaryGroup===gi.g).length;const done=deposited.filter(d=>ARTIFACTS.find(a=>a.id===d.id)?.primaryGroup===gi.g).length;return(<div key={gi.g} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}><span style={{color:"var(--color-text-secondary)"}}>{gi.l}</span><span style={{fontWeight:500}}>{done}/{total}</span></div><div style={{height:5,background:"var(--color-background-secondary)",borderRadius:3,overflow:"hidden"}}><div style={{width:`${(done/total)*100}%`,height:"100%",background:gi.c,borderRadius:3,transition:"width .5s"}}/></div></div>);})}
            {deposited.length===ARTIFACTS.length&&<div style={{marginTop:8,fontSize:11,background:"#E1F5EE",color:"#085041",borderRadius:"var(--border-radius-md)",padding:"8px 10px",textAlign:"center"}}>🎉 ¡Mapa completo! Bonus para ToM Runner</div>}
          </div>
          <div style={{background:"var(--color-background-secondary)",borderRadius:"var(--border-radius-md)",padding:"10px 12px"}}><div style={{fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:5}}>Guía</div><div style={{fontSize:10,color:"var(--color-text-tertiary)",display:"flex",flexDirection:"column",gap:3}}><span>★ dorado = artefacto de tu lectura (ventaja)</span><span>Halo = artefacto de tu grupo</span><span>Zona punteada en Gran Sala = depósito</span><span>Punto amarillo minimap = pendiente · verde = depositado</span></div></div>
        </>}
      </div>
    </div>
  );
}
