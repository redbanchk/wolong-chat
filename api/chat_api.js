module.exports=async function(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS'){res.status(204).end();return;}
  if(req.method!=='POST'){res.status(405).send('Method Not Allowed');return;}
  let message='';
  let history=[];
  try{
    const b=typeof req.body==='object'?req.body:JSON.parse(req.body||'{}');
    message=String(b.message||'');
    history=Array.isArray(b.history)?b.history:[];
  }catch(_){message='';history=[];}
  const apiKey=process.env.ARK_API_KEY||'';
  const endpointId=process.env.ENDPOINT_ID||'';
  const baseUrl=(process.env.ARK_BASE_URL||'https://ark.cn-beijing.volces.com/api/v3').replace(/\/+$/,'');
  const systemPrompt=(process.env.SYSTEM_PROMPT||'').trim();
  const systemPromptDecoded=systemPrompt.replace(/\\n/g,'\n');
  const tRaw=process.env.TEMPERATURE;
  const temperature=tRaw!==undefined&&tRaw!==null?Number(tRaw):undefined;
  if(!apiKey||!endpointId){res.status(500).json({error:'缺少配置'});return;}
  const msgs=[];
  if(systemPromptDecoded.length)msgs.push({role:'system',content:systemPromptDecoded});
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
  if(message.length)msgs.push({role:'user',content:message});
  try{
    const payload={model:endpointId,messages:msgs};
    if(Number.isFinite(temperature))payload.temperature=temperature;
    const resp=await fetch(baseUrl+'/chat/completions',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body:JSON.stringify(payload)});
    const text=await resp.text();
    if(!resp.ok){res.status(resp.status).send(text);return;}
    let json={};
    try{json=JSON.parse(text||'{}');}catch(_){json={};}
    const reply=json&&json.choices&&json.choices[0]&&json.choices[0].message&&json.choices[0].message.content||'';
    res.status(200).json({reply});
  }catch(e){
    res.status(502).json({error:String(e)});
  }
}