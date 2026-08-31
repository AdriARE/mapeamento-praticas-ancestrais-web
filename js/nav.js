// Menu móvil — abrir/fechar, compartilhado por todas as páginas
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('hamburgerBtn');
  const panel = document.getElementById('mobilePanel');
  const closeBtn = document.getElementById('closeBtn');
  if (!btn || !panel || !closeBtn) return;

  function openPanel() {
    panel.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closePanel() {
    panel.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', () => {
    panel.classList.contains('open') ? closePanel() : openPanel();
  });
  closeBtn.addEventListener('click', closePanel);
  panel.querySelectorAll('a').forEach(a => a.addEventListener('click', closePanel));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });
});
