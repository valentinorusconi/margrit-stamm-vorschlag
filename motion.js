(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const wide = matchMedia('(min-width: 701px)');
  const poster = location.pathname.includes('/plakat/');
  document.body.dataset.motionWorld = poster ? 'plakat' : 'journal';
  const duration = poster ? 450 : 650;
  const easing = 'cubic-bezier(.16,1,.3,1)';
  const active = new Set();
  function animate(node, frames, options = {}) {
    if (reduced.matches || !node?.animate) return;
    const animation = node.animate(frames, {duration, easing, ...options});
    active.add(animation);
    animation.finished.catch(() => {}).finally(() => active.delete(animation));
  }
  // Two halves of the author's name gently separate as the frontispiece leaves view.
  // No scroll interception, pinned panels or movement of reading columns.
  const stage = document.querySelector('.hero, .research-mast');
  const letters = stage ? [...stage.querySelectorAll('h1 span, h1 em')] : [];
  let frame = 0;
  let visible = false;
  function draw() {
    frame = 0;
    if (!stage || reduced.matches || !wide.matches) return;
    const rect = stage.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height)));
    letters.forEach((letter, i) => {
      const distance = progress * (poster ? 14 : 26);
      letter.style.transform = poster ? `translateY(${distance * (i ? -1 : 1)}px)` : `translateX(${distance * (i ? -1 : 1)}px)`;
    });
  }
  function schedule() { if (visible && !frame && !reduced.matches && wide.matches) frame = requestAnimationFrame(draw); }
  if (stage && 'IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) schedule(); }).observe(stage);
    addEventListener('scroll', schedule, {passive:true});
  }
  // The biographical portrait settles into its printed crop once, on arrival.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      animate(entry.target, [{clipPath:'inset(0 4% 0 0)'},{clipPath:'inset(0 0 0 0)'}]);
    }), {threshold:.2});
    document.querySelectorAll('.person figure img').forEach(image => observer.observe(image));
  }
  // Opening a research topic gives the newly exposed text a short, quiet transition.
  document.querySelectorAll('.research-list details').forEach(details => {
    details.addEventListener('toggle', () => {
      if (details.open) details.querySelectorAll('p, a').forEach(node => animate(node, [{opacity:.55},{opacity:1}], {duration:220}));
    });
  });
  const menu = document.querySelector('.menu-toggle');
  menu?.addEventListener('click', () => {
    if (menu.getAttribute('aria-expanded') === 'true') animate(document.querySelector('#navigation'), [{opacity:.7,transform:'translateY(-5px)'},{opacity:1,transform:'translateY(0)'}], {duration:200});
  });
  function reset() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    letters.forEach(letter => letter.style.removeProperty('transform'));
    active.forEach(animation => animation.cancel());
    schedule();
  }
  reduced.addEventListener('change', reset);
  wide.addEventListener('change', reset);
  addEventListener('resize', schedule, {passive:true});
})();
