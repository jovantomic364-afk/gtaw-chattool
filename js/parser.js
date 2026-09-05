export const C={purple:'#C2A2DA',white:'#F0F0F0',ooc:'#696969',yellow:'#FFFF00',pink:'#FF00C3',grey:'#B8B8B8',green:'#00FF00'};
const tokenRE=/!\{#([0-9A-Fa-f]{6})\}|(~[yrgbpows]~)/g;
const gta={'~y~':'#FFFF00','~r~':'#FF0000','~g~':'#00FF00','~b~':'#0000FF','~p~':'#A020F0','~o~':'#FFA500','~w~':'#FFFFFF'};
export function detect(s){return /!\{#[0-9a-f]{6}\}/i.test(s)?'ucp':'assistant'}
function ucp(body){let a=[],last=0,color=C.white,m;tokenRE.lastIndex=0;while((m=tokenRE.exec(body))){if(m.index>last)a.push({text:body.slice(last,m.index),color});if(m[1])color='#'+m[1].toUpperCase();else if(gta[m[2]?.toLowerCase()])color=gta[m[2].toLowerCase()];last=tokenRE.lastIndex}if(last<body.length)a.push({text:body.slice(last),color});if(/^\s*\(Phone\)\s*\*/i.test(body)&&!body.includes('!{#'))return[{text:body,color:C.purple}];return a.length?a:[{text:body,color}]}
function assistant(body,self){if(/^\s*You\s+(?:paid|gave|received)\b/i.test(body))return[{text:body,color:C.green}];if(/^\s*(?:\(Phone\)\s*)?\*\s+/i.test(body)||/^\s*>\s+/.test(body))return[{text:body,color:C.purple}];if(/^\s*\(\(.*\)\)\s*$/.test(body))return[{text:body,color:C.ooc}];if(/^\s*\[!\]\s*/.test(body))return[{text:'[!] ',color:C.pink},{text:body.replace(/^\s*\[!\]\s*/,''),color:C.white}];if(/\bsays(?:\s+\[[^\]]+\])?\s+\(phone\):/i.test(body)){let sp=(body.match(/^\s*(.+?)\s+says/i)||[])[1]||'';return[{text:body,color:self&&sp.toLowerCase()===self.toLowerCase()?C.white:C.yellow}]}if(/^\s*\[PHONE\]/i.test(body))return[{text:body,color:C.yellow}];if(/\bMessage\s+(?:from|sent to)\s+/i.test(body))return[{text:body,color:'#D9D9D9'}];return[{text:body,color:C.white}]}
function typeOf(p){if(/^\s*\(\(/.test(p))return'ooc';if(/^\s*(?:\(Phone\)\s*)?\*|^\s*>/.test(p))return'emote';if(/\bsays\b/i.test(p))return'speech';if(/\bMessage\s+(?:from|sent to)\s+/i.test(p))return'message';return'system'}
function cleanName(s){return(s||'').replace(/^\[!\]\s*/,'').trim()}
function peopleOf(p){let out=[];let speech=p.match(/^\s*(?:\[!\]\s*)?(.+?)\s+says(?:\s+\[[^\]]+\])?(?:\s+\(phone\))?:/i);if(speech)out.push(cleanName(speech[1]));let emote=p.match(/^\s*(?:\(Phone\)\s*)?(?:\*|>)\s+([A-Z][\w'-]+(?:\s+[A-Z][\w'-]+)+)\b/);if(emote)out.push(cleanName(emote[1]));return[...new Set(out.filter(Boolean))]}
function messagePersonOf(p){let m=p.match(/\bMessage\s+(?:from|sent to)\s+([^:]+):/i);return m?cleanName(m[1]):''}
export function parse(text,mode='auto',self=''){const actual=mode==='auto'?detect(text):mode;let lines=text.replace(/\r/g,'').split('\n').filter(x=>x.trim().length).map((raw,i)=>{let ts='',body=raw,m=body.match(/^\s*\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*/);if(m){ts=m[1];body=body.slice(m[0].length)}let seg=actual==='ucp'?ucp(body):assistant(body,self),plain=seg.map(x=>x.text).join(''),people=peopleOf(plain),messagePerson=messagePersonOf(plain),phoneRP=/\bsays(?:\s+\[[^\]]+\])?\s+\(phone\):/i.test(plain)||/^\s*\(Phone\)\s*\*/i.test(plain);return{id:String(i),raw,ts,body,plain,segments:seg,type:typeOf(plain),people,messagePerson,phoneRP}});return{mode:actual,lines}}
function inlineEmotes(groups,body){
  // Manual Edit Chat syntax: paired *...* inside a speech line becomes GTAW emote purple.
  // We only inspect text after the speech colon, so stars elsewhere are left untouched.
  const plain=groups.map(g=>g.text||'').join('');
  const speech=plain.match(/^([\s\S]*?\bsays(?:\s+\[[^\]]+\])?(?:\s+\([^)]*\))?:)([\s\S]*)$/i);
  if(!speech)return groups;
  const prefixLen=speech[1].length,tail=plain.slice(prefixLen);
  if((tail.match(/\*/g)||[]).length<2)return groups;
  let out=[],absolute=0,inEmote=false,remainingStars=(tail.match(/\*/g)||[]).length;
  for(const g of groups){
    const text=g.text||'';let chunk='',chunkColor=g.color;
    const flush=()=>{if(chunk){out.push({...g,text:chunk,color:chunkColor});chunk=''}};
    for(let i=0;i<text.length;i++,absolute++){
      const ch=text[i],afterPrefix=absolute>=prefixLen;
      if(afterPrefix&&ch==='*'){
        // Only open an emote when another closing star remains. Unpaired stars stay normal.
        if(!inEmote){
          if(remainingStars>=2){flush();inEmote=true;chunkColor=C.purple;chunk='*'}else{chunk+=ch}
        }else{chunk+='*';flush();inEmote=false;chunkColor=g.color}
        remainingStars--;
      }else{
        const wanted=inEmote?C.purple:g.color;
        if(wanted!==chunkColor){flush();chunkColor=wanted}
        chunk+=ch;
      }
    }
    flush();
  }
  return out;
}
export function renderLine(line,mode,self){let groups=line.segments|| (mode==='ucp'?ucp(line.body):assistant(line.body,self));return inlineEmotes(groups,line.body||groups.map(g=>g.text||'').join(''))}
export function parseEditedLine(raw,mode,self){let ts='',body=raw,m=body.match(/^\s*\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*/);if(m){ts=m[1];body=body.slice(m[0].length)}return{raw,ts,body,segments:mode==='ucp'?ucp(body):assistant(body,self)}}