const Logger=(function(){
  const entries=[];const errors=[];const max=500;
  const push=(list,item)=>{list.push(item);if(list.length>max)list.shift();};
  const now=()=>new Date().toLocaleString();
  const toText=(e)=>`[${e.time}] ${e.level.toUpperCase()} - ${e.message}`+(e.meta?`\n${typeof e.meta==='string'?e.meta:JSON.stringify(e.meta,null,2)}`:'');
  const render=()=>{
    const logContent=document.getElementById('logContent');
    const errorContent=document.getElementById('errorContent');
    if(logContent){logContent.innerHTML='';entries.slice().reverse().forEach(e=>{const div=document.createElement('div');div.className=`log-entry ${e.level}`;const head=document.createElement('div');head.className='head';head.textContent=`[${e.time}] ${e.level.toUpperCase()} - ${e.message}`;div.appendChild(head);if(e.meta!==undefined&&e.meta!==null){const pre=document.createElement('pre');pre.textContent=typeof e.meta==='string'?e.meta:JSON.stringify(e.meta,null,2);div.appendChild(pre);}logContent.appendChild(div);});}
    if(errorContent){errorContent.innerHTML='';errors.slice().reverse().forEach(e=>{const div=document.createElement('div');div.className=`log-entry error`;const head=document.createElement('div');head.className='head';head.textContent=`[${e.time}] ERROR - ${e.message}`;div.appendChild(head);if(e.meta!==undefined&&e.meta!==null){const pre=document.createElement('pre');pre.textContent=typeof e.meta==='string'?e.meta:JSON.stringify(e.meta,null,2);div.appendChild(pre);}errorContent.appendChild(div);});}
  };
  const api={
    log(level,message,meta){const item={level,message,meta:meta||null,time:now()};push(entries,item);render();},
    info(message,meta){api.log('info',message,meta);},
    warn(message,meta){api.log('warn',message,meta);},
    error(message,meta){const item={level:'error',message,meta:meta||null,time:now()};push(errors,item);push(entries,item);render();},
    clear(){entries.length=0;errors.length=0;render();},
    exportText(){return entries.map(toText).join('\n\n');},
    exportJSON(){return JSON.stringify({entries,errors},null,2);},
    render
  };
  window.addEventListener('error',e=>{api.error(e.message,{filename:e.filename,lineno:e.lineno,colno:e.colno,stack:e.error&&e.error.stack});});
  window.addEventListener('unhandledrejection',e=>{api.error('未处理的Promise拒绝',{reason:e.reason});});
  return api;
})();