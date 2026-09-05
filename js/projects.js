const PROJECTS_KEY='gtawChatToolProjects';
const LEGACY_PROJECTS_KEY='gtawChatToolProjectsV1';
const CURRENT_KEY='gtawChatToolCurrentProjectV1';
const FORMATTER_KEY='gtawChatToolFormatterV1',COMPOSER_KEY='gtawComposerStateV2';
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const readJson=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
function normalize(raw){if(Array.isArray(raw))return raw;if(raw&&Array.isArray(raw.projects))return raw.projects;return[]}
function migrate(){
 if(localStorage.getItem(PROJECTS_KEY)!==null)return;
 const legacy=normalize(readJson(LEGACY_PROJECTS_KEY));
 if(legacy.length)writeProjects(legacy);
}
function writeProjects(projects){
 const db={version:1,projects};
 localStorage.setItem(PROJECTS_KEY,JSON.stringify(db));
 // Verify the exact same key History reads.
 const check=normalize(readJson(PROJECTS_KEY));
 if(check.length!==projects.length)throw new Error('Project store verification failed');
 return check;
}
export function listProjects(){migrate();return normalize(readJson(PROJECTS_KEY))}
export function projectStoreInfo(){
 let raw=localStorage.getItem(PROJECTS_KEY);let projects=listProjects();
 return {key:PROJECTS_KEY,count:projects.length,bytes:raw?raw.length:0};
}
export function currentId(){let id=localStorage.getItem(CURRENT_KEY);if(!id){id=uid();localStorage.setItem(CURRENT_KEY,id)}return id}
export function getCurrentProject(){let id=currentId();return listProjects().find(x=>x.id===id)||null}
export function isCurrentSaved(){return !!getCurrentProject()}
export function projectName(){return getCurrentProject()?.name||'gtaw-chat'}
export function suggestedName(formatter=readJson(FORMATTER_KEY)){let names=(formatter?.characters||[]).slice(0,3).filter(Boolean);return names.length?names.join(' & '):`Chat log – ${new Date().toLocaleDateString()}`}
export function updateProject(){return getCurrentProject()}
export function autoNameFromFormatter(){}
export function saveCurrentProject(name=null,formatterData=null,composerData=null){
 let id=currentId(),ps=listProjects(),i=ps.findIndex(x=>x.id===id),now=Date.now(),existing=i>=0?ps[i]:null;
 let formatter=formatterData??readJson(FORMATTER_KEY),composer=composerData??readJson(COMPOSER_KEY);
 const hasText=v=>typeof v==='string'&&v.trim().length>0;
 let hasFormatter=!!(formatter&&(hasText(formatter.source)||hasText(formatter.filtered)||hasText(formatter.filteredText)||hasText(formatter.edited)||hasText(formatter.raw)||(Array.isArray(formatter.lines)&&formatter.lines.length>0)));
 let hasComposer=!!(composer&&((Array.isArray(composer.segments)&&composer.segments.some(x=>hasText(x?.text)))||hasText(composer.text)));
 if(!hasFormatter&&!hasComposer)return {ok:false,reason:'empty'};
 let finalName=(name??existing?.name??suggestedName(formatter)).trim()||'Untitled chat log';
 let item={id,name:finalName,created:existing?.created||now,modified:now,formatter:formatter||null,composer:composer||null};
 if(i>=0)ps[i]=item;else ps.unshift(item);
 try{
   writeProjects(ps);
   const verified=listProjects().find(x=>x.id===id);
   if(!verified)return {ok:false,reason:'verify'};
   return {ok:true,project:verified,count:listProjects().length};
 }catch(error){return {ok:false,reason:'storage',error}}
}
export function hasWorkspaceContent(){let f=readJson(FORMATTER_KEY),c=readJson(COMPOSER_KEY);return !!(f&&(String(f.source||'').trim()||String(f.filtered||'').trim()))||!!(c&&Array.isArray(c.segments)&&c.segments.some(x=>String(x?.text||'').trim()))}
export function hasUnsavedChanges(){if(!hasWorkspaceContent())return false;let p=getCurrentProject();if(!p)return true;let f=readJson(FORMATTER_KEY),c=readJson(COMPOSER_KEY);return JSON.stringify(f||null)!==JSON.stringify(p.formatter||null)||JSON.stringify(c||null)!==JSON.stringify(p.composer||null)}
export function renameProject(id,name){let ps=listProjects(),p=ps.find(x=>x.id===id);if(p){p.name=(name||'Untitled chat log').trim();p.modified=Date.now();writeProjects(ps)}}
export function deleteProject(id){writeProjects(listProjects().filter(x=>x.id!==id))}
export function duplicateProject(id){let ps=listProjects(),p=ps.find(x=>x.id===id);if(!p)return null;let now=Date.now(),n={...structuredClone(p),id:uid(),name:(p.name||'Chat log')+' copy',created:now,modified:now};ps.unshift(n);writeProjects(ps);return n}
export function openProject(id){let p=listProjects().find(x=>x.id===id);if(!p)return false;localStorage.setItem(CURRENT_KEY,id);if(p.formatter)localStorage.setItem(FORMATTER_KEY,JSON.stringify(p.formatter));else localStorage.removeItem(FORMATTER_KEY);if(p.composer)localStorage.setItem(COMPOSER_KEY,JSON.stringify(p.composer));else localStorage.removeItem(COMPOSER_KEY);localStorage.removeItem('gtawComposerIncoming');return true}
export function newProject(){let id=uid();localStorage.setItem(CURRENT_KEY,id);localStorage.removeItem(FORMATTER_KEY);localStorage.removeItem(COMPOSER_KEY);localStorage.removeItem('gtawComposerStateV1');localStorage.removeItem('gtawComposerIncoming');return id}
export function archiveCurrentProject(formatterData=null,composerData=null){return saveCurrentProject(null,formatterData,composerData).ok}
