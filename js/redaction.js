// Manual editing markup shared by Preview, transparent PNG export and Composer.
// %text% = solid redaction block. //text// = blurred text.
export function redactSegments(groups){
  const out=[];
  for(const g of groups){
    const text=g.text||'';
    const re=/%([^%]+)%|\/\/([^/]+)\/\//g;
    let pos=0,m;
    while((m=re.exec(text))){
      if(m.index>pos)out.push({...g,text:text.slice(pos,m.index)});
      if(m[1]!==undefined)out.push({...g,text:m[1],redacted:true});
      else out.push({...g,text:m[2],blurred:true});
      pos=m.index+m[0].length;
    }
    if(pos<text.length)out.push({...g,text:text.slice(pos)});
    if(!text.length)out.push(g);
  }
  return out;
}
export function appendRedacted(parent,groups){
  for(const g of redactSegments(groups)){
    const s=document.createElement('span');
    s.style.color=g.color;
    if(g.redacted){s.className='redacted';s.textContent=g.text;s.setAttribute('aria-label','Redacted text')}
    else if(g.blurred){s.className='blurred';s.textContent=g.text;s.setAttribute('aria-label','Blurred text')}
    else s.textContent=g.text;
    parent.appendChild(s);
  }
}
