const capacity = 60;
const json=(value,status=200)=>Response.json(value,{status,headers:{'cache-control':'no-store'}});
const countQuery='SELECT COUNT(*) AS total FROM registrations';
export async function registration(request,db){
  if(request.method==='GET'){
    const row=await db.prepare(countQuery).first();
    return json({remaining:Math.max(0,capacity-row.total),capacity});
  }
  if(request.method!=='POST')return json({error:'Use GET or POST.'},405);
  if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Send registration as JSON.'},415);
  const origin=request.headers.get('origin');
  if(origin&&origin!==new URL(request.url).origin)return json({error:'Open the workshop page to register.'},403);
  let input;
  try{const body=await request.text();if(body.length>4096)return json({error:'Registration is too long.'},413);input=JSON.parse(body)}catch{return json({error:'Invalid registration.'},400)}
  const name=typeof input?.name==='string'?input.name.trim():'';
  const email=typeof input?.email==='string'?input.email.trim().toLowerCase():'';
  const key=typeof input?.key==='string'?input.key:'';
  if(name.length<1||name.length>90||email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)||!/^[0-9a-f-]{36}$/i.test(key))return json({error:'Enter your name and a valid email address.'},400);
  const code='AV-'+crypto.randomUUID().slice(0,8).toUpperCase();
  // The capacity test and insert execute in a single SQLite write statement.
  await db.prepare('INSERT INTO registrations(full_name,email,request_key,pass_code) SELECT ?,?,?,? WHERE (SELECT COUNT(*) FROM registrations) < ? ON CONFLICT DO NOTHING').bind(name,email,key,code,capacity).run();
  const row=await db.prepare('SELECT full_name,pass_code FROM registrations WHERE email=? AND request_key=?').bind(email,key).first();
  if(row)return json({name:row.full_name,code:row.pass_code},201);
  const total=await db.prepare(countQuery).first();
  if(total.total>=capacity)return json({error:'All 60 seats are booked.'},409);
  return json({error:'This email already has a registration. Check your saved workshop pass.'},409);
}