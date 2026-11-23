// The glitch is part of the source footage. Play it at its native speed.
(() => {
  const intro = document.getElementById('site-intro');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || location.hash || typeof intro.showModal !== 'function') return;
  const key = 'aws-verse-intro-seen';
  try { if (sessionStorage.getItem(key)) return; } catch { /* Storage is optional. */ }

  const clip = intro.querySelector('video');
  const progress = intro.querySelector('.intro-progress');
  let watchdog;
  const finish = () => { if (intro.open) intro.close(); };
  const watchPlayback = () => {
    clearTimeout(watchdog);
    watchdog = setTimeout(finish, 5000);
  };
  const onPreference = () => { if (motion.matches) finish(); };
  intro.addEventListener('close', () => {
    clearTimeout(watchdog);
    motion.removeEventListener('change', onPreference);
    window.removeEventListener('hashchange', finish);
    clip.pause();
    clip.removeAttribute('src');
    clip.load();
  }, {once:true});
  intro.querySelector('button').addEventListener('click', finish);
  clip.addEventListener('ended', finish);
  clip.addEventListener('error', finish);
  clip.addEventListener('timeupdate', () => {
    if (!intro.open || !Number.isFinite(clip.duration) || !clip.duration) return;
    progress.style.transform = 'scaleX(' + clip.currentTime / clip.duration + ')';
    watchPlayback();
  });
  motion.addEventListener('change', onPreference);
  window.addEventListener('hashchange', finish);
  intro.showModal();
  try { sessionStorage.setItem(key, '1'); } catch { /* Playback still works. */ }
  clip.muted = true;
  clip.src = 'assets/spider-logo-intro.mp4';
  watchPlayback();
  clip.play().catch(finish);
})();
