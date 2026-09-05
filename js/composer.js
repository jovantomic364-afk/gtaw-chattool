import{parse,parseEditedLine,renderLine}from'./parser.js?v=2.0';import{newProject}from'./projects.js?v=2.0';import{appendRedacted,redactSegments}from'./redaction.js?v=2.0';
const $=s=>document.querySelector(s),canvas=$('#canvas'),layers=$('#chatLayers'),bg=$('#bg');
const COMPOSER_KEY='gtawComposerStateV2';
let imgURL='',segments=[],selectedId=null,drag=null;

const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
function defaults(text='',extra={}){return{id:uid(),name:`Segment ${segments.length+1}`,text,mode:'auto',self:'',font:16,fontfamily:'Arial',fontweight:'700',outline:'1',width:700,opacity:0,timestamps:true,visible:true,left:35,top:35,...extra}}
function selected(){return segments.find(s=>s.id===selectedId)}
function detectedMode(s){return s.mode==='auto'?parse(s.text,'auto',s.self).mode:s.mode}
function lineCount(s){return s.text.replace(/\r/g,'').split('\n').filter(x=>x.trim()).length}

function renderList(){
 $('#segmentlist').innerHTML='';
 segments.forEach((s,i)=>{let b=document.createElement('button');b.type='button';b.className='segment-item'+(s.id===selectedId?' active':'');
 b.innerHTML=`<span class="seg-title">${escapeHtml(s.name||`Segment ${i+1}`)}</span><span class="seg-meta">${lineCount(s)} lines${s.visible?'':' · hidden'}</span>`;
 b.onclick=()=>selectSegment(s.id);$('#segmentlist').appendChild(b)});
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderSegment(s){
 let o=document.createElement('div');o.className='chat-overlay'+(s.id===selectedId?' selected':'');o.dataset.id=s.id;
 o.style.left=s.left+'px';o.style.top=s.top+'px';o.style.width=s.width+'px';o.style.background=`rgba(0,0,0,${s.opacity/100})`;o.style.padding=s.opacity?'8px':'0';o.style.display=s.visible?'block':'none';
 let m=detectedMode(s),self=s.self.trim(),lines=s.text.replace(/\r/g,'').split('\n').filter(x=>x.trim()).map(x=>parseEditedLine(x,m,self));
 for(let l of lines){let d=document.createElement('div');d.className='chat';d.style.fontSize=s.font+'px';
  if(s.timestamps&&l.ts){let t=document.createElement('span');t.style.color='#aaa';t.textContent=`[${l.ts}] `;d.appendChild(t)}
  appendRedacted(d,renderLine(l,m,self));d.style.fontFamily=`${s.fontfamily||'Arial'}, Arial, sans-serif`;d.style.fontWeight=s.fontweight||'700';let ol=String(s.outline??'1');d.style.textShadow=ol==='0'?'none':ol==='1'?'-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000':'-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000,2px 2px 0 #000,0 2px 0 #000,2px 0 0 #000';o.appendChild(d)}
 o.addEventListener('pointerdown',startDrag);layers.appendChild(o);
}
function renderAll(){layers.innerHTML='';segments.forEach(renderSegment);renderList()}
function loadControls(){
 let s=selected(),disabled=!s;
 ['segmentname','chattext','cmode','cself','cfont','cfontfamily','cfontweight','coutline','chatwidth','opacity','ctimestamps','segmentvisible','duplicatesegment','deletesegment','centerchat'].forEach(id=>$('#'+id).disabled=disabled);
 if(!s){$('#segmentname').value='';$('#chattext').value='';return}
 $('#segmentname').value=s.name;$('#chattext').value=s.text;$('#cmode').value=s.mode;$('#cself').value=s.self;$('#cfont').value=s.font;$('#cfontfamily').value=s.fontfamily||'Arial';$('#cfontweight').value=s.fontweight||'700';$('#coutline').value=String(s.outline??'1');$('#chatwidth').value=s.width;$('#opacity').value=s.opacity;$('#ctimestamps').checked=s.timestamps;$('#segmentvisible').checked=s.visible;
 $('#cfontv').textContent=s.font;$('#chatwidthv').textContent=s.width;$('#opacityv').textContent=s.opacity+'%';
}
function selectSegment(id){selectedId=id;loadControls();renderAll();saveComposer()}
function syncSelected(){
 let s=selected();if(!s)return;
 s.name=$('#segmentname').value||'Untitled segment';s.text=$('#chattext').value;s.mode=$('#cmode').value;s.self=$('#cself').value;s.font=+$('#cfont').value;s.fontfamily=$('#cfontfamily').value;s.fontweight=$('#cfontweight').value;s.outline=$('#coutline').value;s.width=+$('#chatwidth').value;s.opacity=+$('#opacity').value;s.timestamps=$('#ctimestamps').checked;s.visible=$('#segmentvisible').checked;
 $('#cfontv').textContent=s.font;$('#chatwidthv').textContent=s.width;$('#opacityv').textContent=s.opacity+'%';renderAll();saveComposer();
}
function addSegment(data={}){let s=defaults(data.text||'',data);segments.push(s);selectedId=s.id;loadControls();renderAll();saveComposer()}
function duplicate(){let s=selected();if(!s)return;let n=defaults(s.text,{...s,id:uid(),name:(s.name||'Segment')+' copy',left:s.left+30,top:s.top+30});segments.push(n);selectedId=n.id;loadControls();renderAll();saveComposer()}
function removeSelected(){let i=segments.findIndex(s=>s.id===selectedId);if(i<0)return;segments.splice(i,1);selectedId=segments[Math.min(i,segments.length-1)]?.id||null;loadControls();renderAll();saveComposer()}

function startDrag(e){let id=e.currentTarget.dataset.id;if(selectedId!==id){selectedId=id;loadControls();renderAll()}
 let s=selected(),o=layers.querySelector(`[data-id="${id}"]`),r=o.getBoundingClientRect();drag={id,pid:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};o.setPointerCapture(e.pointerId);e.preventDefault()}
layers.addEventListener('pointermove',e=>{if(!drag)return;let s=segments.find(x=>x.id===drag.id),o=layers.querySelector(`[data-id="${drag.id}"]`),r=canvas.getBoundingClientRect(),sx=canvas.offsetWidth/r.width,sy=canvas.offsetHeight/r.height,x=(e.clientX-r.left)*sx-drag.dx*sx,y=(e.clientY-r.top)*sy-drag.dy*sy;s.left=Math.max(0,Math.min(canvas.offsetWidth-o.offsetWidth,x));s.top=Math.max(0,Math.min(canvas.offsetHeight-o.offsetHeight,y));o.style.left=s.left+'px';o.style.top=s.top+'px'});
layers.addEventListener('pointerup',()=>{if(drag){drag=null;saveComposer()}});

function size(){let[w,h]=$('#preset').value.split('x').map(Number);canvas.style.width=w+'px';canvas.style.height=h+'px';$('#canvasinfo').textContent=`${w} × ${h}`;scale()}
function scale(){let shell=document.querySelector('.canvas-shell'),w=parseInt(canvas.style.width)||1920,h=parseInt(canvas.style.height)||1080,aw=Math.max(1,shell.clientWidth-8),ah=Math.max(1,shell.clientHeight-8),s=Math.min(aw/w,ah/h);canvas.style.transform=`scale(${s})`}
function fit(){bg.style.objectFit=$('#imagemode').value||'cover'}

function openDB(){return new Promise((resolve,reject)=>{let q=indexedDB.open('gtawChatToolDB',1);q.onupgradeneeded=()=>{if(!q.result.objectStoreNames.contains('files'))q.result.createObjectStore('files')};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)})}
async function saveImage(blob){try{let db=await openDB(),tx=db.transaction('files','readwrite');blob?tx.objectStore('files').put(blob,'composerBackground:'+currentId()):tx.objectStore('files').delete('composerBackground:'+currentId());await new Promise((r,j)=>{tx.oncomplete=r;tx.onerror=()=>j(tx.error)});db.close()}catch(e){console.warn(e)}}
async function loadImage(){try{let db=await openDB(),tx=db.transaction('files','readonly'),q=tx.objectStore('files').get('composerBackground:'+currentId()),blob=await new Promise((r,j)=>{q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)});db.close();if(blob){imgURL=URL.createObjectURL(blob);bg.src=imgURL;bg.style.display='block';$('#empty').style.display='none'}}catch(e){console.warn(e)}}

function snapshot(){return{segments,selectedId,preset:$('#preset').value,imagemode:$('#imagemode').value}}
let startingNewProject=false;
function saveComposer(){if(startingNewProject)return;try{let snap=snapshot();localStorage.setItem(COMPOSER_KEY,JSON.stringify(snap))}catch(e){console.warn(e)}}
function migrateV1(){
 let d;try{d=JSON.parse(localStorage.getItem('gtawComposerStateV1')||'null')}catch{}if(!d)return false;
 segments=[defaults(d.text||'',{name:'Segment 1',mode:d.mode||'auto',self:d.self||'',font:+d.font||16,fontfamily:d.fontfamily||'Arial',fontweight:d.fontweight||'700',outline:d.outline??'1',width:+d.chatwidth||700,opacity:+d.opacity||0,timestamps:d.timestamps!==false,left:parseFloat(d.left)||35,top:parseFloat(d.top)||35})];selectedId=segments[0].id;$('#preset').value=d.preset||'1920x1080';$('#imagemode').value=d.imagemode||'cover';return true
}
async function restore(){
 let d;try{d=JSON.parse(localStorage.getItem(COMPOSER_KEY)||'null')}catch{}
 if(d){segments=Array.isArray(d.segments)?d.segments:[];selectedId=d.selectedId;$('#preset').value=d.preset||'1920x1080';$('#imagemode').value=d.imagemode||'cover'}else migrateV1();
 let incoming;try{incoming=JSON.parse(localStorage.getItem('gtawComposerIncoming')||'null')}catch{}
 if(incoming?.text){addSegment({text:incoming.text,mode:incoming.mode||'auto',self:incoming.self||'',timestamps:incoming.timestamps!==false,font:+incoming.font||16,fontfamily:incoming.fontfamily||'Arial',fontweight:incoming.fontweight||'700',outline:incoming.outline??'1',name:`Segment ${segments.length+1}`});localStorage.removeItem('gtawComposerIncoming')}
 if(!segments.length)addSegment();
 if(!segments.some(s=>s.id===selectedId))selectedId=segments[0].id;
 await loadImage();size();fit();loadControls();renderAll();saveComposer()
}

$('#addsegment').onclick=()=>addSegment();
$('#duplicatesegment').onclick=duplicate;$('#deletesegment').onclick=removeSelected;
['segmentname','chattext','cself'].forEach(id=>$('#'+id).addEventListener('input',syncSelected));
['cmode','cfontfamily','cfontweight','coutline','ctimestamps','segmentvisible'].forEach(id=>$('#'+id).addEventListener('change',syncSelected));
['cfont','cfontfamily','cfontweight','coutline','chatwidth','opacity'].forEach(id=>$('#'+id).addEventListener('input',syncSelected));
$('#centerchat').onclick=()=>{let s=selected();if(!s)return;s.left=35;s.top=35;renderAll();saveComposer()};
$('#preset').onchange=()=>{size();saveComposer()};$('#imagemode').onchange=()=>{fit();saveComposer()};
let pendingImage=null;
$('#image').onchange=e=>{pendingImage=e.target.files[0]||null;$('#selectedfile').textContent=pendingImage?pendingImage.name:'No screenshot selected';$('#loadimage').disabled=!pendingImage};
$('#loadimage').onclick=async()=>{let f=pendingImage;if(!f)return;if(imgURL)URL.revokeObjectURL(imgURL);imgURL=URL.createObjectURL(f);bg.src=imgURL;bg.style.display='block';$('#empty').style.display='none';fit();await saveImage(f);saveComposer();$('#selectedfile').textContent=f.name+' · loaded';};
$('#removebg').onclick=async()=>{bg.removeAttribute('src');bg.style.display='none';$('#empty').style.display='grid';if(imgURL)URL.revokeObjectURL(imgURL);imgURL='';await saveImage(null)};

$('#export').onclick=async()=>{
 let W=canvas.offsetWidth,H=canvas.offsetHeight,c=document.createElement('canvas');c.width=W;c.height=H;let ctx=c.getContext('2d');ctx.clearRect(0,0,W,H);
 if(bg.src){let iw=bg.naturalWidth,ih=bg.naturalHeight,cover=$('#imagemode').value==='cover',z=cover?Math.max(W/iw,H/ih):Math.min(W/iw,H/ih),dw=iw*z,dh=ih*z;ctx.drawImage(bg,(W-dw)/2,(H-dh)/2,dw,dh)}
 for(let s of segments.filter(x=>x.visible)){
  let fs=+s.font,lh=Math.ceil(fs*1.27),pad=s.opacity?8:0,x0=s.left+pad,y=s.top+pad,maxw=s.width-pad*2,m=detectedMode(s),self=s.self.trim();let family=s.fontfamily||'Arial',weight=s.fontweight||'700',outline=+s.outline||0;ctx.font=`${weight} ${fs}px "${family}",Arial,sans-serif`;ctx.textBaseline='top';ctx.lineJoin='round';
  let rawLines=s.text.replace(/\r/g,'').split('\n').filter(x=>x.trim());
  let prepared=[];
  for(let raw of rawLines){let l=parseEditedLine(raw,m,self),segs=[];if(s.timestamps&&l.ts)segs.push({text:`[${l.ts}] `,color:'#aaa'});segs.push(...redactSegments(renderLine(l,m,self)));let rows=[[]],rw=0;
   for(let sg of segs)for(let part of sg.text.split(/(\s+)/)){if(!part)continue;let pw=ctx.measureText(part).width;if(rw+pw>maxw&&rows.at(-1).length&&!/^\s+$/.test(part)){rows.push([]);rw=0}rows.at(-1).push({text:part,color:sg.color,redacted:sg.redacted,blurred:sg.blurred});rw+=pw}prepared.push(...rows)}
  if(s.opacity){ctx.fillStyle=`rgba(0,0,0,${s.opacity/100})`;ctx.fillRect(s.left,s.top,s.width,prepared.length*lh+pad*2)}
  for(let row of prepared){let x=x0;for(let sg of row){let sw=ctx.measureText(sg.text).width;if(sg.redacted){ctx.fillStyle='#050505';ctx.fillRect(x,y+1,sw,lh-3)}else{ctx.save();if(sg.blurred)ctx.filter='blur(4px)';if(outline){ctx.lineWidth=outline===1?2:4;ctx.strokeStyle='#000';ctx.strokeText(sg.text,x,y)}ctx.fillStyle=sg.color;ctx.fillText(sg.text,x,y);ctx.restore()}x+=sw}y+=lh}
 }
 let blob=await new Promise(r=>c.toBlob(r,'image/png')),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='gtaw-chat'.replace(/[^a-z0-9-_]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)
};
$('#newproject').onclick=()=>{if(segments.some(s=>String(s.text||'').trim())&&!confirm('Start a new project? Your current workspace will be cleared.'))return;startingNewProject=true;newProject();location.href='index.html'};
addEventListener('beforeunload',saveComposer);addEventListener('resize',scale);restore();
