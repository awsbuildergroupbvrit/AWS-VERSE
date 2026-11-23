const form=document.querySelector('#signup-form'),statusLine=document.querySelector('#form-status');
const availability=document.querySelector('#availability'),submit=form.querySelector('button');
let pass=null,requestKey;
try{requestKey=sessionStorage.getItem('verse-request')||crypto.randomUUID();sessionStorage.setItem('verse-request',requestKey);pass=JSON.parse(sessionStorage.getItem('verse-pass')||'null')}catch{requestKey=crypto.randomUUID()}
function showPass(){
  document.querySelector('#signup').hidden=true;document.querySelector('#confirmed').hidden=false;
  document.querySelector('#pass-name').textContent=pass.name;document.querySelector('#pass-id').textContent=pass.code;
}
async function refreshSeats(){
  try{
    const r=await fetch('/api/registration',{cache:'no-store'});if(!r.ok)return;
    const {remaining,capacity}=await r.json();
    availability.textContent=remaining>0?remaining+' of '+capacity+' seats available':'All 60 seats are booked.';
    submit.disabled=remaining===0;
    const sticker=document.querySelector('.seat-sticker');
    if(remaining<capacity){sticker.querySelector('strong').textContent=remaining===0?'FULL':remaining+' LEFT';sticker.querySelector('small:last-child').textContent=remaining===0?'BOOKED':'AVAILABLE!';sticker.setAttribute('aria-label',remaining+' workshop seats available. Open registration.')}
  }catch{/* The form reports availability errors when a visitor submits. */}
}
document.querySelectorAll('[data-details]').forEach(b=>b.onclick=()=>{
  if(eventSettings.registrationUrl&&/^https:\/\//.test(eventSettings.registrationUrl)){location.assign(eventSettings.registrationUrl);return}
  statusLine.textContent='';dialog.showModal();if(pass)showPass();else refreshSeats();
});
form.addEventListener('submit',async e=>{
  e.preventDefault();if(!form.reportValidity())return;submit.disabled=true;statusLine.textContent='Reserving your seat…';
  try{
    const values=Object.fromEntries(new FormData(form));
    const r=await fetch('/api/registration',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...values,key:requestKey})});
    const data=await r.json();if(!r.ok)throw new Error(data.error);
    pass={name:data.name,code:data.code};try{sessionStorage.setItem('verse-pass',JSON.stringify(pass))}catch{}
    showPass();statusLine.textContent='Registration confirmed for both days.';document.querySelector('#save-pass').focus();refreshSeats();
  }catch(error){statusLine.textContent=error instanceof TypeError?'Connection interrupted. You can safely retry.':error.message;submit.disabled=false;refreshSeats()}
});
document.querySelector('#save-pass').onclick=async()=>{
  if(!pass)return;await document.fonts.ready;
  const c=document.createElement('canvas');c.width=1200;c.height=660;const g=c.getContext('2d');
  g.fillStyle='#121013';g.fillRect(0,0,1200,660);
  for(let y=0;y<660;y+=8)for(let x=0;x<1200;x+=8){g.fillStyle='rgba(160,86,94,.19)';g.fillRect(x,y,1.5,1.5)}
  g.fillStyle='#ff505e';g.fillRect(0,0,1200,14);g.font='italic 900 128px Display';g.fillText('AWS-VERSE',62,162);
  g.font='28px Mono';g.fillStyle='#95e6df';g.fillText('TWO-DAY WORKSHOP PASS',66,220);g.fillText(pass.code,66,594);
  g.fillStyle='#faf2e7';g.font='800 64px Head';g.fillText(pass.name,64,335,1060);
  g.font='32px Body';g.fillText('November 27–28, 2026   /   9:00 AM – 4:30 PM',66,417,1080);g.fillText(eventSettings.venue,66,473,1065);
  g.setLineDash([9,9]);g.strokeStyle='#af8a90';g.beginPath();g.moveTo(0,525);g.lineTo(1200,525);g.stroke();
  const blob=await new Promise(resolve=>c.toBlob(resolve));if(!blob)return;
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='AWS-VERSE-'+pass.code+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
};
refreshSeats();