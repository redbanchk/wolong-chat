const http=require('http');
const https=require('https');
const fs=require('fs');
const path=require('path');

const base=__dirname;
const port=process.env.PORT||8080;
const envFile=path.join(base,'.env.local');
if(fs.existsSync(envFile)){
  try{
    const text=fs.readFileSync(envFile,'utf8');
    text.split(/\r?\n/).forEach(line=>{
      const m=/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?(.*?)"?\s*$/.exec(line);
      if(m){process.env[m[1]]=m[2];}
    });
  }catch(_){}
}

function send(res,status,data,type){res.writeHead(status,{"Content-Type":type||"text/plain"});res.end(data);} 

function serveFile(res,filePath){
  try{
    const ext=path.extname(filePath).toLowerCase();
    const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json'};
    const content=fs.readFileSync(filePath);
    send(res,200,content,types[ext]||'text/plain');
  }catch(_){
    send(res,404,'Not Found','text/plain');
  }
}

function buildReply(msg){
  const s=String(msg||'');
  const baseText='孔明以为：';
  const counsel='善用时势，谨慎行事，审时度势。';
  return `${baseText}${s.length?`“${s}”`:'万事当观其势'}。${counsel}`;
}

function toMessages(history,message,systemPrompt){
  const msgs=[];
  if(systemPrompt&&systemPrompt.length)msgs.push({role:'system',content:systemPrompt});
  if(Array.isArray(history)){
    history.forEach(pair=>{
      if(Array.isArray(pair)&&pair.length>=2){
        const u=String(pair[0]||'');
        const a=String(pair[1]||'');
        if(u.length)msgs.push({role:'user',content:u});
        if(a.length)msgs.push({role:'assistant',content:a});
      }
    });
  }
  const m=String(message||'');
  if(m.length)msgs.push({role:'user',content:m});
  return msgs;
}

function arkChatCompletion(apiKey,endpointId,baseUrl,message,history){
  return new Promise((resolve,reject)=>{
    if(!apiKey||!endpointId){reject(new Error('缺少配置'));return;}
    const u=new URL((baseUrl||'https://ark.cn-beijing.volces.com/api/v3').replace(/\/+$/,'')+'/chat/completions');
    const sp=((process.env.SYSTEM_PROMPT||'').trim()).replace(/\\n/g,'\n');
    const tRaw=process.env.TEMPERATURE;
    const temperature=tRaw!==undefined&&tRaw!==null?Number(tRaw):undefined;
    const body={model:endpointId,messages:toMessages(history,message,sp)};
    if(Number.isFinite(temperature))body.temperature=temperature;
    const payload=JSON.stringify(body);
    const req=https.request({hostname:u.hostname,port:u.port||443,path:u.pathname,method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`}},resp=>{
      let body='';
      resp.on('data',d=>{body+=d;});
      resp.on('end',()=>{
        if(resp.statusCode<200||resp.statusCode>=300){reject(new Error(`API ${resp.statusCode} ${resp.statusMessage||''} ${body}`));return;}
        try{
          const json=JSON.parse(body||'{}');
          const reply=json&&json.choices&&json.choices[0]&&json.choices[0].message&&json.choices[0].message.content;
          if(typeof reply==='string'&&reply.length){resolve(reply);}else{reject(new Error('响应解析失败'));}
        }catch(e){reject(e);
        }
      });
    });
    req.on('error',e=>reject(e));
    req.setTimeout(30000,()=>{req.destroy(new Error('请求超时'));});
    req.write(payload);
    req.end();
  });
}

const server=http.createServer((req,res)=>{
  const urlPath=decodeURIComponent(req.url.split('?')[0]);

  if(req.method==='OPTIONS'&&urlPath==='/api/chat_api'){
    res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'});
    res.end();
    return;
  }

  if(req.method==='POST'&&urlPath==='/api/chat_api'){
    let body='';
    req.on('data',chunk=>{body+=chunk;if(body.length>1e6)req.socket.destroy();});
    req.on('end',()=>{
      let payload={};
      try{payload=JSON.parse(body||'{}');}catch(_){payload={};}
      const message=payload.message||'';
      const history=payload.history||[];
      const apiKey=process.env.ARK_API_KEY||'';
      const endpointId=process.env.ENDPOINT_ID||'';
      const baseUrl=process.env.ARK_BASE_URL||'';
      arkChatCompletion(apiKey,endpointId,baseUrl,message,history)
        .then(reply=>{send(res,200,JSON.stringify({reply}),'application/json');})
        .catch(_=>{const reply=buildReply(message);send(res,200,JSON.stringify({reply}),'application/json');});
    });
    return;
  }

  if(req.method==='GET'){
    const file=urlPath==='/'?path.join(base,'index.html'):path.join(base,urlPath.replace(/^\/+/,''));
    if(fs.existsSync(file)&&fs.statSync(file).isFile()){serveFile(res,file);return;}
  }

  send(res,405,'Method Not Allowed','text/plain');
});

server.listen(port,'127.0.0.1',()=>{console.log(`Server running at http://localhost:${port}/`);});