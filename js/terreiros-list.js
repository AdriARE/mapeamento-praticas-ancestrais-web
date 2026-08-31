// Página Terreiros — busca os terreiros aprovados no Supabase e monta as tarjetas

document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('cardGrid');
  const countEl = document.getElementById('resultsCount');
  const searchInput = document.getElementById('searchInput');
  const tradicaoFilter = document.getElementById('tradicaoFilter');

  let todos = [];

  function esc(v) {
    if (v === null || v === undefined) return '';
    return String(v).replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  function cardHTML(t) {
    const fotoPessoa = t.foto_responsavel_url
      ? `<img src="${t.foto_responsavel_url}" alt="Responsável">`
      : `<div class="no-photo"><img src="images/buzio-ocre.png" alt=""></div>`;
    const fotoCasa = t.foto_fachada_url
      ? `<img src="${t.foto_fachada_url}" alt="Fachada do terreiro">`
      : `<div class="no-photo"><img src="images/buzio-ocre.png" alt=""></div>`;

    const tags = (t.tradicoes || [])
      .map(tr => `<span class="tag nacao">${esc(tr)}</span>`)
      .join('');

    const nomeExibido = t.nome || 'Nome do terreiro — a confirmar';
    const nomeClasse = t.nome ? '' : 'pending';

    return `
      <div class="card">
        <div class="card-media">
          <div class="photo-person">${fotoPessoa}</div>
          <div class="photo-house">${fotoCasa}</div>
        </div>
        <div class="card-body">
          <h3 class="${nomeClasse}">${esc(nomeExibido)}</h3>
          <p class="responsavel">Responsável: <strong>${esc(t.responsavel || 'a confirmar')}</strong></p>
          <div class="tag-row">${tags || '<span class="tag pending">Tradição a confirmar</span>'}</div>
        </div>
      </div>
    `;
  }

  function render() {
    const termo = (searchInput.value || '').toLowerCase().trim();
    const tradicaoEscolhida = tradicaoFilter.value;

    const filtrados = todos.filter(t => {
      const bateTexto = !termo ||
        (t.nome || '').toLowerCase().includes(termo) ||
        (t.responsavel || '').toLowerCase().includes(termo);
      const bateTradicao = !tradicaoEscolhida ||
        (t.tradicoes || []).includes(tradicaoEscolhida);
      return bateTexto && bateTradicao;
    });

    if (filtrados.length === 0) {
      grid.innerHTML = '<p class="empty-note">Nenhum terreiro encontrado com esse filtro.</p>';
    } else {
      grid.innerHTML = filtrados.map(cardHTML).join('');
    }

    countEl.textContent = `${filtrados.length} terreiro${filtrados.length === 1 ? '' : 's'} encontrado${filtrados.length === 1 ? '' : 's'}`;
  }

  async function carregar() {
    countEl.textContent = 'Carregando...';
    const { data, error } = await supabaseClient
      .from('terreiros')
      .select('*')
      .eq('status', 'aprovado')
      .order('criado_em', { ascending: false });

    if (error) {
      grid.innerHTML = '<p class="empty-note">Não foi possível carregar os terreiros agora.</p>';
      countEl.textContent = '';
      return;
    }

    todos = data || [];
    render();
  }

  searchInput.addEventListener('input', render);
  tradicaoFilter.addEventListener('change', render);

  carregar();
});
