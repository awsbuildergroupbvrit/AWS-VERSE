const dialog=document.querySelector('#details');
document.querySelectorAll('[data-venue]').forEach(node=>node.textContent=eventSettings.venue);
document.querySelector('#close').onclick=()=>dialog.close();
dialog.onclick=e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close()};
