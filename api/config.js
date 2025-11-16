module.exports=async function(req,res){
  if(req.method!=='GET'){res.status(405).send('Method Not Allowed');return;}
  const avatarUrl=(process.env.AVATAR_URL||'').trim();
  const chatApi='/api/chat_api';
  res.setHeader('Content-Type','application/json');
  res.setHeader('Cache-Control','no-store');
  res.status(200).end(JSON.stringify({avatarUrl,chatApi}));
}