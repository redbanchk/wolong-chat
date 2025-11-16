const Chat=(function(){
  const API_URL=window.__CHAT_API_URL__||"/api/chat_api";
  const chatMessages=document.getElementById('chatMessages');
  const userInput=document.getElementById('userInput');
  const sendButton=document.getElementById('sendButton');
  const loadingOverlay=document.getElementById('loadingOverlay');
  const history=[];
  const scroll=()=>{chatMessages.scrollTop=chatMessages.scrollHeight;};
  const messageNode=(text,type)=>{const row=document.createElement('div');row.className=`message ${type}`;const bubble=document.createElement('div');bubble.className='message-content';bubble.textContent=text;row.appendChild(bubble);const time=document.createElement('div');time.className='message-time';time.textContent=new Date().toLocaleString();row.appendChild(time);return row;};
  const append=(text,type)=>{chatMessages.appendChild(messageNode(text,type));scroll();};
  const setLoading=(v)=>{if(v){loadingOverlay.style.display='flex';}else{loadingOverlay.style.display='none';}};
  const disableSend=(v)=>{sendButton.disabled=v;};
  const send=async(message)=>{
    const msg=message!==undefined?String(message).trim():userInput.value.trim();
    if(!msg)return;
    userInput.value='';
    disableSend(true);setLoading(true);
    append(msg,'user');
    Logger.info('发送消息',{message:msg});
    try{
      Logger.info('请求接口',{url:API_URL,payload:{message:msg,history}});
      const res=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg,history})});
      if(!res.ok){
        let body='';
        try{ body=await res.text(); }catch(_){}
        Logger.error('接口响应异常',{status:res.status,statusText:res.statusText,body});
        const errorModal=document.getElementById('errorModal');
        const errorContent=document.getElementById('errorContent');
        if(errorModal&&errorContent){
          errorContent.textContent=`状态: ${res.status} ${res.statusText}\n\n${body}`;
          errorModal.style.display='flex';
        }
        throw new Error(`API 请求失败: ${res.status}`);
      }
      let data; 
      try{ data=await res.json(); }catch(_){
        Logger.warn('接口返回非JSON',{status:res.status});
        data={};
      }
      if(data&&data.error){
        Logger.error('接口返回错误字段',data.error);
        throw new Error(data.error);
      }
      const reply=data.reply;
      append(reply,'assistant');
      history.push([msg,reply]);
      Logger.log('info','接口成功',{reply});
    }catch(e){
      const errorModal=document.getElementById('errorModal');
      const errorContent=document.getElementById('errorContent');
      Logger.error('接口错误',String(e));
      if(errorModal&&errorContent){
        errorContent.textContent=`${String(e)}`;
        errorModal.style.display='flex';
      }
      append('抱歉，在下思绪稍有混乱，请稍后再试。','assistant');
    }finally{
      disableSend(false);setLoading(false);
    }
  };
  return{send};
})();