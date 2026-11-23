const view = document.querySelector('.map-view');
const stage = view.querySelector('.map-stage');
const zoomIn = document.querySelector('#map-in');
const zoomOut = document.querySelector('#map-out');
let zoom = 1, x = 0, y = 0, drag;
function drawMap() {
  const maxX = view.clientWidth * (1.1 * zoom - .5);
  const maxY = view.clientHeight * (1.1 * zoom - .5);
  x = Math.max(-maxX, Math.min(maxX, x));
  y = Math.max(-maxY, Math.min(maxY, y));
  stage.style.transform = 'translate('+x+'px,'+y+'px) scale('+zoom+')';
  zoomIn.disabled = zoom >= 1.75;
  zoomOut.disabled = zoom <= .75;
}
function adjustZoom(delta) {
  const next = Math.max(.75, Math.min(1.75, zoom + delta));
  x *= next/zoom; y *= next/zoom; zoom = next; drawMap();
}
function centerVenue() { x = 0; y = 0; zoom = 1; drawMap(); }
zoomIn.onclick = () => adjustZoom(.25);
zoomOut.onclick = () => adjustZoom(-.25);
document.querySelector('#map-center').onclick = centerVenue;
view.onpointerdown = e => {
  if (!e.isPrimary || e.button !== 0) return;
  drag = {id:e.pointerId, startX:e.clientX, startY:e.clientY, x, y};
  view.setPointerCapture(e.pointerId); view.classList.add('dragging');
};
view.onpointermove = e => {
  if (drag?.id !== e.pointerId) return;
  x = drag.x + e.clientX - drag.startX; y = drag.y + e.clientY - drag.startY;
  drawMap();
};
view.onlostpointercapture = () => { drag = null; view.classList.remove('dragging'); };
view.onkeydown = e => {
  switch(e.key) {
    case 'ArrowLeft': x += 30; break;
    case 'ArrowRight': x -= 30; break;
    case 'ArrowDown': y -= 30; break;
    case 'ArrowUp': y += 30; break;
    case 'Home': centerVenue(); break;
    case '+': case '=': adjustZoom(.25); break;
    case '-': adjustZoom(-.25); break;
    default: return;
  }
  e.preventDefault(); drawMap();
};
new ResizeObserver(drawMap).observe(view);
if (location.hash === '#schedule') location.replace('#tracker');
