const PROJECTS_KEY='gtawChatToolProjectsV1',CURRENT_KEY='gtawChatToolCurrentProjectV1';
const FORMATTER_KEY='gtawChatToolFormatterV1',COMPOSER_KEY='gtawComposerStateV2';
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const readJson=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
function writeProjects(p){localStorage.setItem(PROJECTS_KEY,JSON.stringify(p))}
export function listProjects(){try{return JSON.parse(localStorage.getItem(PROJECTS_KEY)||'[]')}catch{return[]}}
export function currentId(){let id=localStorage.getItem(CURRENT_KEY);if(!id){id=uid();localStorage.setItem(CURRENT_KEY,id)}return id}
export function getCurrentProject(){let id=currentId();return listProjects().find(x=>x.id===id)||null}
export function isCurrentSaved(){return !!getCurrentProject()}
export function projectName(){return getCurrentProject()?.name||'gtaw-chat'}
export function suggestedName(formatter=readJson(FORMATTER_KEY)){
 let names=(formatter?.characters||[]).slice(0,3).filter(Boolean);
 return names.length?names.join(' & '):`Chat log – ${new Date().toLocaleDateString()}`;
}
// Workspace autosave and History are deliberately separate. This function is kept
// for compatibility with older page code, but it never writes to History.
export function updateProject(){return getCurrentProject()}
export function autoNameFromFormatter(){}
export function saveCurrentProject(name=null,formatterData=null,composerData=null){
 let id=currentId(),ps=listProjects(),i=ps.findIndex(x=>x.id===id),now=Date.now();
 let existing=i>=0?ps[i]:null;
 let formatter=formatterData??readJson(FORMATTER_KEY);
 let composer=composerData??readJson(COMPOSER_KEY);
 const hasText=v=>typeof v==='string'&&v.trim().length>0;
 let hasFormatter=!!(formatter&&(hasText(formatter.source)||hasText(formatter.filtered)||hasText(formatter.filteredText)||hasText(formatter.edited)||hasText(formatter.raw)||(Array.isArray(formatter.lines)&&formatter.lines.length>0)));
 let hasComposer=!!(composer&&((Array.isArray(composer.segments)&&composer.segments.some(x=>hasText(x?.text)))||hasText(composer.text)));
 if(!hasFormatter&&!hasComposer)return {ok:false,reason:'empty'};
 let finalName=(name??existing?.name??suggestedName(formatter)).trim()||'Untitled chat log';
 let item={id,name:finalName,created:existing?.created||now,modified:now,formatter:formatter||null,composer:composer||null};
 if(i>=0)ps[i]=item;else ps.unshift(item);
 try{writeProjects(ps)}catch(e){return {ok:false,reason:'storage',error:e}}
 return {ok:listProjects().some(x=>x.id===id),project:item};
}
export function hasWorkspaceContent(){
 let f=readJson(FORMATTER_KEY),c=readJson(COMPOSER_KEY);
 return !!(f&&(String(f.source||'').trim()||String(f.filtered||'').trim()))||!!(c&&Array.isArray(c.segments)&&c.segments.some(x=>String(x?.text||'').trim()));
}
export function hasUnsavedChanges(){
 if(!hasWorkspaceContent())return false;
 let p=getCurrentProject();if(!p)return true;
 let f=readJson(FORMATTER_KEY),c=readJson(COMPOSER_KEY);
 return JSON.stringify(f||null)!==JSON.stringify(p.formatter||null)||JSON.stringify(c||null)!==JSON.stringify(p.composer||null);
}
export function renameProject(id,name){let ps=listProjects(),p=ps.find(x=>x.id===id);if(p){p.name=(name||'Untitled chat log').trim();p.modified=Date.now();writeProjects(ps)}}
export function deleteProject(id){let ps=listProjects().filter(x=>x.id!==id);writeProjects(ps)}
export function duplicateProject(id){let ps=listProjects(),p=ps.find(x=>x.id===id);if(!p)return null;let now=Date.now(),n={...structuredClone(p),id:uid(),name:(p.name||'Chat log')+' copy',created:now,modified:now};ps.unshift(n);writeProjects(ps);return n}
export function openProject(id){let p=listProjects().find(x=>x.id===id);if(!p)return false;localStorage.setItem(CURRENT_KEY,id);if(p.formatter)localStorage.setItem(FORMATTER_KEY,JSON.stringify(p.formatter));else localStorage.removeItem(FORMATTER_KEY);if(p.composer)localStorage.setItem(COMPOSER_KEY,JSON.stringify(p.composer));else localStorage.removeItem(COMPOSER_KEY);localStorage.removeItem('gtawComposerIncoming');return true}
export function newProject(){let id=uid();localStorage.setItem(CURRENT_KEY,id);localStorage.removeItem(FORMATTER_KEY);localStorage.removeItem(COMPOSER_KEY);localStorage.removeItem('gtawComposerStateV1');localStorage.removeItem('gtawComposerIncoming');return id}
// Legacy compatibility. History is now explicit-save only.
export function archiveCurrentProject(formatterData=null,composerData=null){return saveCurrentProject(null,formatterData,composerData).ok}
