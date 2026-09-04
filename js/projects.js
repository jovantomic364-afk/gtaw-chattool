const PROJECTS_KEY='gtawChatToolProjectsV1',CURRENT_KEY='gtawChatToolCurrentProjectV1';
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
export function listProjects(){try{return JSON.parse(localStorage.getItem(PROJECTS_KEY)||'[]')}catch{return[]}}
function writeProjects(p){localStorage.setItem(PROJECTS_KEY,JSON.stringify(p))}
export function currentId(){let id=localStorage.getItem(CURRENT_KEY);if(!id){id=uid();localStorage.setItem(CURRENT_KEY,id)}return id}
export function ensureProject(){let id=currentId(),ps=listProjects(),p=ps.find(x=>x.id===id);if(!p){let now=Date.now();p={id,name:`Chat log – ${new Date(now).toLocaleDateString()}`,created:now,modified:now,formatter:null,composer:null};ps.unshift(p);writeProjects(ps)}return p}
export function updateProject(part, data){let p=ensureProject(),ps=listProjects(),i=ps.findIndex(x=>x.id===p.id);ps[i]={...ps[i],[part]:data,modified:Date.now()};writeProjects(ps);return ps[i]}
export function renameProject(id,name){let ps=listProjects(),p=ps.find(x=>x.id===id);if(p){p.name=(name||'Untitled chat log').trim();p.modified=Date.now();writeProjects(ps)}}
export function deleteProject(id){let ps=listProjects().filter(x=>x.id!==id);writeProjects(ps);if(currentId()===id)localStorage.removeItem(CURRENT_KEY)}
export function duplicateProject(id){let ps=listProjects(),p=ps.find(x=>x.id===id);if(!p)return null;let now=Date.now(),n={...structuredClone(p),id:uid(),name:(p.name||'Chat log')+' copy',created:now,modified:now};ps.unshift(n);writeProjects(ps);return n}
export function openProject(id){let p=listProjects().find(x=>x.id===id);if(!p)return false;localStorage.setItem(CURRENT_KEY,id);if(p.formatter)localStorage.setItem('gtawChatToolFormatterV1',JSON.stringify(p.formatter));else localStorage.removeItem('gtawChatToolFormatterV1');if(p.composer)localStorage.setItem('gtawComposerStateV2',JSON.stringify(p.composer));else localStorage.removeItem('gtawComposerStateV2');localStorage.removeItem('gtawComposerIncoming');return true}
export function newProject(){let id=uid();localStorage.setItem(CURRENT_KEY,id);localStorage.removeItem('gtawChatToolFormatterV1');localStorage.removeItem('gtawComposerStateV2');localStorage.removeItem('gtawComposerStateV1');localStorage.removeItem('gtawComposerIncoming');ensureProject();return id}
export function projectName(){return ensureProject().name}
export function autoNameFromFormatter(d){let p=ensureProject();if(!p.name.startsWith('Chat log –')||!d?.source)return;let names=(d.characters||[]).slice(0,3);if(names.length)renameProject(p.id,names.join(' & '))}
