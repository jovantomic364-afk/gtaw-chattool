import{parse,parseEditedLine,renderLine}from'./parser.js?v=1.9.3';import{png}from'./exporter.js?v=1.9.3';import{appendRedacted}from'./redaction.js?v=1.9.3';import{updateProject,newProject,autoNameFromFormatter,saveCurrentProject,isCurrentSaved,hasUnsavedChanges,suggestedName,listProjects}from'./projects.js?v=1.9.4';
const $=s=>document.querySelector(s);let state={mode:'assistant',lines:[]};let generated='';
function build(){state=parse($('#source').value,$('#mode').value,$('#self').value.trim());$('#detected').textContent=state.lines.length?`Detected: ${state.mode.toUpperCase()} · ${state.lines.length} lines`:'No chat lines detected.';document.body.classList.toggle('has-log',state.lines.length>0);people();messages();rpTypes();regenerate()}
function people(){let ps=[...new Set(state.lines.flatMap(x=>x.people||[]).filter(Boolean))].sort();$('#people').innerHTML=ps.length?ps.map(p=>`<label class="chip"><input type="checkbox" data-person="${esc(p)}" checked> ${p}</label>`).join('\n'):'<span class="muted">No characters detected.</span>';$('#people').querySelectorAll('input').forEach(x=>x.onchange=regenerate)}
function messages(){let box=$('#messages'),ms=[...new Set(state.lines.map(x=>x.messagePerson).filter(Boolean))].sort();box.innerHTML=ms.length?`<div class="filtertitle">Messages</div><div class="chips"><label class="chip"><input type="checkbox" id="allmessages"> All messages</label>${ms.map(p=>`<label class="chip"><input type="checkbox" data-message-person="${esc(p)}"> ${p}</label>`).join('\n')}</div>`:'';if(!ms.length)return;let all=$('#allmessages'),items=[...box.querySelectorAll('[data-message-person]')];all.onchange=()=>{items.forEach(x=>x.checked=all.checked);regenerate()};items.forEach(x=>x.onchange=()=>{all.checked=items.every(y=>y.checked);regenerate()})}
function rpTypes(){$('#rptypes').innerHTML=`<div class="filtertitle">RP Type</div><div class="chips"><label class="chip"><input type="checkbox" id="inperson" checked> In-person RP</label><label class="chip"><input type="checkbox" id="phonecalls" checked> Phone calls</label></div>`;$('#inperson').onchange=regenerate;$('#phonecalls').onchange=regenerate}
function esc(s){return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}
function allowed(l){let f=$('#from').value,t=$('#to').value;if(f&&l.ts&&l.ts<f)return false;if(t&&l.ts&&l.ts>t)return false;if(l.type==='ooc')return $('#ooc').checked;if(l.type==='system')return $('#system').checked;if(l.type==='message'){let selected=[...document.querySelectorAll('[data-message-person]:checked')].map(x=>x.dataset.messagePerson);return !!l.messagePerson&&selected.includes(l.messagePerson)}if((l.type==='speech'||l.type==='emote')&&l.phoneRP&&!$('#phonecalls')?.checked)return false;if((l.type==='speech'||l.type==='emote')&&!l.phoneRP&&!$('#inperson')?.checked)return false;let inputs=[...document.querySelectorAll('[data-person]')],selected=inputs.filter(x=>x.checked).map(x=>x.dataset.person);if(inputs.length&&!(l.people||[]).some(p=>selected.includes(p)))return false;return true}
function regenerate(){let lines=state.lines.filter(allowed);generated=lines.map(l=>l.raw).join('\n');$('#filtered').value=generated;$('#editstatus').textContent='';preview()}
function preview(){let raw=$('#filtered').value,lines=raw.replace(/\r/g,'').split('\n').filter(x=>x.trim()).map(x=>parseEditedLine(x,state.mode,$('#self').value.trim())),p=$('#preview');p.innerHTML='';if(!lines.length){let e=document.createElement('div');e.className='preview-empty';e.textContent=state.lines.length?'No lines match the current filters.':'Load a chatlog to preview it here.';p.appendChild(e)}p.style.maxWidth=$('#width').value+'px';p.style.padding=$('#chatbg').checked?'8px':'0';let bgAlpha=(+$('#bgopacity').value||45)/100;p.style.background=$('#chatbg').checked?`rgba(0,0,0,${bgAlpha})`:'transparent';lines.forEach(l=>{let d=document.createElement('div');d.className='chat';d.style.fontSize=$('#font').value+'px';if($('#timestamps').checked&&l.ts){let s=document.createElement('span');s.className='ts';s.textContent=`[${l.ts}] `;d.appendChild(s)}appendRedacted(d,renderLine(l,state.mode,$('#self').value.trim()));d.style.fontFamily=`${$('#fontfamily').value}, Arial, sans-serif`;d.style.fontWeight=$('#fontweight').value;let ol=$('#outline').value;d.style.textShadow=ol==='0'?'none':ol==='1'?'-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000':'-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000,2px 2px 0 #000,0 2px 0 #000,2px 0 0 #000';p.appendChild(d)});$('#stats').textContent=`${lines.length} lines`;$('#editstatus').textContent=raw===generated?'':'Edited'}
function exportLines(){return $('#filtered').value.replace(/\r/g,'').split('\n').filter(x=>x.trim()).map(x=>{let l=parseEditedLine(x,state.mode,$('#self').value.trim());return{...l,selected:true,visible:true,edited:l.body,original:l.body}})}
$('#build').onclick=build;['ooc','system','from','to'].forEach(id=>$('#'+id).onchange=regenerate);$('#filtered').oninput=preview;['font','fontfamily','fontweight','outline','width','timestamps','chatbg','bgopacity'].forEach(id=>$('#'+id).oninput=()=>{$('#fontv').textContent=$('#font').value;$('#bgopacityv').textContent=$('#bgopacity').value+'%';$('#bgopacitywrap').classList.toggle('is-disabled',!$('#chatbg').checked);preview()});$('#copy').onclick=async()=>navigator.clipboard.writeText($('#filtered').value);$('#resetedit').onclick=()=>{$('#filtered').value=generated;preview()};$('#png').onclick=()=>png(exportLines(),{font:$('#font').value,fontfamily:$('#fontfamily').value,fontweight:$('#fontweight').value,outline:$('#outline').value,width:$('#width').value,timestamps:$('#timestamps').checked,bg:$('#chatbg').checked,bgopacity:(+$('#bgopacity').value||45)/100},l=>renderLine(l,state.mode,$('#self').value.trim()));$('#clear').onclick=()=>{$('#source').value='';$('#filtered').value='';state={mode:'assistant',lines:[]};generated='';$('#people').innerHTML='<span class="muted">No characters detected.</span>';$('#messages').innerHTML='';$('#rptypes').innerHTML='';$('#preview').innerHTML='<div class="preview-empty">Load a chatlog to preview it here.</div>';$('#stats').textContent='';$('#detected').textContent='Waiting for a chatlog.';document.body.classList.remove('has-log')};$('#sample').onclick=()=>{$('#source').value=`[20:55:03] ~y~Marisol Lopez says (phone): Zohan?\n[20:55:59] (Phone) * Marisol Lopez has a broken tone of voice.\n[20:57:02] !{#C2A2DA}* Marisol Lopez pinches Jovan’s side.\n[20:57:09] !{#5F5F5F}Marisol Lopez says [low]: Or what?\n[20:57:20] !{#F0F0F0}Jovan Tomic says [low]: I didn't mean that, baby girl, princess.`;$('#mode').value='auto';$('#self').value='Jovan Tomic';build()};


const FORMATTER_KEY='gtawChatToolFormatterV1';
let restoring=false;
function formatterSnapshot(){
 return{
  source:$('#source').value,mode:$('#mode').value,self:$('#self').value,
  ooc:$('#ooc').checked,system:$('#system').checked,from:$('#from').value,to:$('#to').value,
  filtered:$('#filtered').value,width:$('#width').value,font:$('#font').value,fontfamily:$('#fontfamily').value,fontweight:$('#fontweight').value,outline:$('#outline').value,
  timestamps:$('#timestamps').checked,chatbg:$('#chatbg').checked,bgopacity:$('#bgopacity').value,
  characters:[...document.querySelectorAll('[data-person]:checked')].map(x=>x.dataset.person),
  messages:[...document.querySelectorAll('[data-message-person]:checked')].map(x=>x.dataset.messagePerson),
  inperson:$('#inperson')?.checked??true,phonecalls:$('#phonecalls')?.checked??true
 }}
function saveFormatter(){if(restoring)return;try{let snap=formatterSnapshot();localStorage.setItem(FORMATTER_KEY,JSON.stringify(snap));updateProject('formatter',snap);autoNameFromFormatter(snap)}catch(e){console.warn('Could not save formatter workspace',e)}}
function restoreChecks(d){
 document.querySelectorAll('[data-person]').forEach(x=>x.checked=(d.characters||[]).includes(x.dataset.person));
 document.querySelectorAll('[data-message-person]').forEach(x=>x.checked=(d.messages||[]).includes(x.dataset.messagePerson));
 if($('#allmessages'))$('#allmessages').checked=[...document.querySelectorAll('[data-message-person]')].every(x=>x.checked)&&document.querySelectorAll('[data-message-person]').length>0;
 if($('#inperson'))$('#inperson').checked=d.inperson!==false;
 if($('#phonecalls'))$('#phonecalls').checked=d.phonecalls!==false;
}
function restoreFormatter(){
 let d;try{d=JSON.parse(localStorage.getItem(FORMATTER_KEY)||'null')}catch{}if(!d)return;
 restoring=true;
 $('#source').value=d.source||'';$('#mode').value=d.mode||'auto';$('#self').value=d.self||'';
 $('#ooc').checked=!!d.ooc;$('#system').checked=!!d.system;$('#from').value=d.from||'';$('#to').value=d.to||'';
 $('#width').value=d.width||'900';$('#font').value=d.font||'16';$('#fontv').textContent=$('#font').value;$('#fontfamily').value=d.fontfamily||'Arial';$('#fontweight').value=d.fontweight||'700';$('#outline').value=d.outline??'1';
 $('#timestamps').checked=!!d.timestamps;$('#chatbg').checked=!!d.chatbg;$('#bgopacity').value=d.bgopacity||'45';$('#bgopacityv').textContent=$('#bgopacity').value+'%';$('#bgopacitywrap').classList.toggle('is-disabled',!$('#chatbg').checked);
 if(d.source){state=parse(d.source,$('#mode').value,$('#self').value.trim());$('#detected').textContent=state.lines.length?`Detected: ${state.mode.toUpperCase()} · ${state.lines.length} lines`:'No chat lines detected.';document.body.classList.toggle('has-log',state.lines.length>0);people();messages();rpTypes();restoreChecks(d);let lines=state.lines.filter(allowed);generated=lines.map(l=>l.raw).join('\n');$('#filtered').value=d.filtered??generated;preview()}
 restoring=false
}
function clearFormatterOnly(){
 localStorage.removeItem(FORMATTER_KEY);$('#source').value='';$('#filtered').value='';state={mode:'assistant',lines:[]};generated='';
 $('#people').innerHTML='<span class="muted">No characters detected.</span>';$('#messages').innerHTML='';$('#rptypes').innerHTML='';
 $('#preview').innerHTML='<div class="preview-empty">Load a chatlog to preview it here.</div>';$('#stats').textContent='';$('#detected').textContent='Waiting for a chatlog.';document.body.classList.remove('has-log')
}
const sendFilteredToComposer=()=>{saveFormatter();localStorage.setItem('gtawComposerIncoming',JSON.stringify({text:$('#filtered').value,mode:state.mode,self:$('#self').value.trim(),timestamps:$('#timestamps').checked,font:+$('#font').value,fontfamily:$('#fontfamily').value,fontweight:$('#fontweight').value,outline:$('#outline').value,add:true}));location.href='composer.html'};
$('#composer').onclick=sendFilteredToComposer;
if($('#composerfiltered'))$('#composerfiltered').onclick=sendFilteredToComposer;
function refreshSaveButton(){let b=$('#saveproject');if(!b)return;b.textContent=isCurrentSaved()?'Save Changes':'Save Project';b.classList.toggle('has-unsaved',hasUnsavedChanges())}
$('#saveproject').onclick=()=>{const snap=formatterSnapshot();try{localStorage.setItem(FORMATTER_KEY,JSON.stringify(snap))}catch(e){console.warn('Could not save formatter workspace',e)}let name=null;if(!isCurrentSaved()){name=prompt('Name this project:',suggestedName(snap));if(name===null)return}let r=saveCurrentProject(name,snap);if(!r.ok){console.warn('Save Project failed',r,{sourceLength:(snap.source||'').length,filteredLength:(snap.filtered||'').length,parsedLines:state.lines.length});alert(r.reason==='empty'?'There is nothing to save yet. Load or edit a chatlog first.':'This project could not be saved to History.');return}refreshSaveButton();$('#editstatus').textContent=`Saved to History · ${r.count} project${r.count===1?'':'s'}`};
$('#newproject').onclick=()=>{saveFormatter();if(hasUnsavedChanges()&&!confirm('This project has unsaved changes. Start a new project and discard them?'))return;restoring=true;newProject();clearFormatterOnly();location.reload()};
document.addEventListener('input',e=>{if(e.target.closest('main')){saveFormatter();refreshSaveButton()}});
document.addEventListener('change',e=>{if(e.target.closest('main'))setTimeout(()=>{saveFormatter();refreshSaveButton()},0)});
addEventListener('beforeunload',saveFormatter);
restoreFormatter();refreshSaveButton();


function filterRows(containerId,query){
 const q=(query||'').trim().toLowerCase();
 document.querySelectorAll(`#${containerId} [data-person],#${containerId} [data-message-person]`).forEach(input=>{
   const row=input.closest('label')||input.parentElement;
   if(row)row.classList.toggle('filter-hidden',q&&!((input.dataset.person||input.dataset.messagePerson||'').toLowerCase().includes(q)));
 });
}
function enhanceCharacterRows(){
 document.querySelectorAll('#people [data-person]').forEach(input=>{
   let label=input.closest('label');if(!label||label.dataset.enhanced)return;label.dataset.enhanced='1';
   label.classList.add('person-row');
   let only=document.createElement('button');only.type='button';only.className='only-person';only.textContent='Only';
   only.onclick=e=>{e.preventDefault();e.stopPropagation();document.querySelectorAll('#people [data-person]').forEach(x=>x.checked=x===input);regenerate();saveFormatter();};
   label.appendChild(only);
 });
 filterRows('people',$('#charactersearch')?.value);
}
function enhanceMessageRows(){
 document.querySelectorAll('#messages [data-message-person]').forEach(input=>{
   let label=input.closest('label');if(!label||label.dataset.enhanced)return;label.dataset.enhanced='1';
   label.classList.add('message-person-row');
   let only=document.createElement('button');only.type='button';only.className='only-person';only.textContent='Only';
   only.onclick=e=>{e.preventDefault();e.stopPropagation();document.querySelectorAll('#messages [data-message-person]').forEach(x=>x.checked=x===input);if($('#allmessages'))$('#allmessages').checked=false;regenerate();saveFormatter();};
   label.appendChild(only);
 });
 filterRows('messages',$('#messagesearch')?.value);
}
function setFilteredChecks(container,selector,value,visibleOnly=false){
 document.querySelectorAll(`#${container} ${selector}`).forEach(input=>{
   const row=input.closest('label')||input.parentElement;
   if(!visibleOnly||!row?.classList.contains('filter-hidden'))input.checked=value;
 });
 if(container==='messages'&&$('#allmessages'))$('#allmessages').checked=[...document.querySelectorAll('#messages [data-message-person]')].every(x=>x.checked)&&document.querySelectorAll('#messages [data-message-person]').length>0;
 regenerate();saveFormatter();
}
function installFilterTools(){
 $('#charactersearch')?.addEventListener('input',e=>filterRows('people',e.target.value));
 $('#messagesearch')?.addEventListener('input',e=>filterRows('messages',e.target.value));
 $('#charall')?.addEventListener('click',()=>setFilteredChecks('people','[data-person]',true));
 $('#charnone')?.addEventListener('click',()=>setFilteredChecks('people','[data-person]',false));
 $('#charselectvisible')?.addEventListener('click',()=>setFilteredChecks('people','[data-person]',true,true));
 $('#chardeselectvisible')?.addEventListener('click',()=>setFilteredChecks('people','[data-person]',false,true));
 $('#msgall')?.addEventListener('click',()=>setFilteredChecks('messages','[data-message-person]',true));
 $('#msgnone')?.addEventListener('click',()=>setFilteredChecks('messages','[data-message-person]',false));
 $('#msgselectvisible')?.addEventListener('click',()=>setFilteredChecks('messages','[data-message-person]',true,true));
 $('#msgdeselectvisible')?.addEventListener('click',()=>setFilteredChecks('messages','[data-message-person]',false,true));
 const obs=new MutationObserver(()=>{enhanceCharacterRows();enhanceMessageRows()});
 if($('#people'))obs.observe($('#people'),{childList:true,subtree:true});
 if($('#messages'))obs.observe($('#messages'),{childList:true,subtree:true});
 enhanceCharacterRows();enhanceMessageRows();
}
installFilterTools();
