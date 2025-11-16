document.addEventListener('DOMContentLoaded',function(){
  const logToggle=document.getElementById('logToggle');
  const errorToggle=document.getElementById('errorToggle');
  const logModal=document.getElementById('logModal');
  const errorModal=document.getElementById('errorModal');
  const logClose=document.getElementById('logClose');
  const errorClose=document.getElementById('errorClose');
  const clearLogs=document.getElementById('clearLogs');
  const exportLogs=document.getElementById('exportLogs');
  const sendButton=document.getElementById('sendButton');
  const userInput=document.getElementById('userInput');
  const quickButtons=document.querySelectorAll('.quick-question');

  const open=(el)=>{el.style.display='flex';Logger.render();};
  const close=(el)=>{el.style.display='none';};

  if(logToggle)logToggle.addEventListener('click',()=>open(logModal));
  if(errorToggle)errorToggle.addEventListener('click',()=>open(errorModal));
  if(logClose)logClose.addEventListener('click',()=>close(logModal));
  if(errorClose)errorClose.addEventListener('click',()=>close(errorModal));

  if(clearLogs)clearLogs.addEventListener('click',()=>Logger.clear());
  if(exportLogs)exportLogs.addEventListener('click',()=>{
    const blob=new Blob([Logger.exportJSON()],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download='logs.json';document.body.appendChild(a);a.click();
    setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},0);
  });

  if(sendButton)sendButton.addEventListener('click',()=>Chat.send());
  if(userInput)userInput.addEventListener('keypress',e=>{if(e.key==='Enter')Chat.send();});
  quickButtons.forEach(btn=>btn.addEventListener('click',()=>{const q=btn.getAttribute('data-question')||'';userInput.value=q;Chat.send(q);}));
});