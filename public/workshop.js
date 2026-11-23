const agenda=document.querySelector('#agenda');
const tabs=[...document.querySelectorAll('[role=tab]')];
function selectDay(index){
  const day=workshopDays[index];
  tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(index===i));tab.tabIndex=index===i?0:-1});
  agenda.setAttribute('aria-labelledby',tabs[index].id);agenda.replaceChildren();
  const heading=document.createElement('h3');heading.className='agenda-title';heading.textContent=day.title;agenda.append(heading);
  day.sessions.forEach((sessions,i)=>{
    const section=document.createElement('details');section.className='session';section.open=i===0;
    const summary=document.createElement('summary');summary.textContent=i?'Afternoon sessions':'Morning sessions';section.append(summary);
    const list=document.createElement('ul');
    for(const [time,name] of sessions){
      const row=document.createElement('li'),clock=document.createElement('time'),label=document.createElement('span');
      clock.textContent=time;label.textContent=name;row.append(clock,label);list.append(row);
    }
    section.append(list);agenda.append(section);
  });
}
tabs.forEach((tab,i)=>{
  tab.onclick=()=>selectDay(i);
  tab.onkeydown=e=>{
    let next;
    if(e.key==='ArrowRight'||e.key==='ArrowLeft')next=1-i;
    else if(e.key==='Home')next=0;else if(e.key==='End')next=1;else return;
    e.preventDefault();selectDay(next);tabs[next].focus();
  };
});selectDay(0);
const dialog=document.querySelector('#details');
document.querySelectorAll('[data-venue]').forEach(node=>node.textContent=eventSettings.venue);
document.querySelector('#close').onclick=()=>dialog.close();
dialog.onclick=e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close()};
