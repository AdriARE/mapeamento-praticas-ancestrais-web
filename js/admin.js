// Painel administrativo — login + gestão de terreiros e denúncias

document.addEventListener('DOMContentLoaded', () => {
  const loginWrap = document.getElementById('loginWrap');
  const dashboard = document.getElementById('dashboard');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');

  // ---------- AUTENTICAÇÃO ----------
  async function checkSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      showDashboard();
    } else {
      showLogin();
    }
  }

  function showLogin() {
    loginWrap.style.display = 'block';
    dashboard.style.display = 'none';
    logoutBtn.style.display = 'none';
  }

  function showDashboard() {
    loginWrap.style.display = 'none';
    dashboard.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
    carregarTerreiros();
    carregarDenuncias();
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.style.display = 'none';
    const email = document.getElementById('login-email').value;
    const senha = document.getElementById('login-senha').value;
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password: senha });
    if (error) {
      loginError.textContent = 'E-mail ou senha incorretos.';
      loginError.style.display = 'block';
      return;
    }
    showDashboard();
  });

  logoutBtn.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    showLogin();
  });

  // ---------- ABAS ----------
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
    });
  });

  // ---------- TERREIROS ----------
  document.getElementById('novoTerreiroBtn').addEventListener('click', async () => {
    const { error } = await supabaseClient.from('terreiros').insert({ nome: 'Novo terreiro (editar)' });
    if (error) {
      alert('Erro ao criar: ' + error.message);
      return;
    }
    carregarTerreiros();
  });

  async function carregarTerreiros() {
    const list = document.getElementById('terreirosList');
    list.innerHTML = '<p class="empty-note">Carregando...</p>';

    const { data, error } = await supabaseClient
      .from('terreiros')
      .select('*')
      .order('status', { ascending: true })
      .order('criado_em', { ascending: false });

    if (error) {
      list.innerHTML = '<p class="empty-note">Erro ao carregar: ' + error.message + '</p>';
      return;
    }
    if (!data || data.length === 0) {
      list.innerHTML = '<p class="empty-note">Nenhum terreiro cadastrado ainda.</p>';
      return;
    }

    list.innerHTML = '';
    data.forEach(t => list.appendChild(renderTerreiroCard(t)));
  }

  function renderTerreiroCard(t) {
    const card = document.createElement('div');
    card.className = 'item-card';

    const fotoResponsavel = t.foto_responsavel_url
      ? `<img src="${t.foto_responsavel_url}" alt="Responsável">`
      : '<div class="no-foto">Sem foto<br>responsável</div>';
    const fotoFachada = t.foto_fachada_url
      ? `<img src="${t.foto_fachada_url}" alt="Fachada">`
      : '<div class="no-foto">Sem foto<br>fachada</div>';

    card.innerHTML = `
      <div class="top-row">
        <strong>${t.nome || '(nome não informado)'}</strong>
        <span class="status-badge ${t.status}">${t.status}</span>
      </div>
      <div class="foto-slot-group">
        <div class="foto-slot">
          ${fotoResponsavel}
          <label class="foto-upload-label">Trocar foto do responsável
            <input type="file" class="foto-input" data-slot="responsavel" accept="image/*">
          </label>
        </div>
        <div class="foto-slot">
          ${fotoFachada}
          <label class="foto-upload-label">Trocar foto da fachada
            <input type="file" class="foto-input" data-slot="fachada" accept="image/*">
          </label>
        </div>
      </div>
      <div class="field-grid">
        <div class="f"><label>Nome do terreiro</label><input type="text" data-field="nome" value="${esc(t.nome)}"></div>
        <div class="f"><label>Responsável</label><input type="text" data-field="responsavel" value="${esc(t.responsavel)}"></div>
        <div class="f"><label>Nação</label><input type="text" data-field="nacao" value="${esc(t.nacao)}"></div>
        <div class="f"><label>Tradições (separadas por vírgula)</label><input type="text" data-field="tradicoes" value="${esc((t.tradicoes || []).join(', '))}"></div>
        <div class="f"><label>Função</label><input type="text" data-field="funcao" value="${esc(t.funcao)}"></div>
        <div class="f"><label>Ano de fundação</label><input type="text" data-field="ano_fundacao" value="${esc(t.ano_fundacao)}"></div>
        <div class="f"><label>Telefone</label><input type="text" data-field="telefone" value="${esc(t.telefone)}"></div>
        <div class="f"><label>Instagram</label><input type="text" data-field="instagram" value="${esc(t.instagram)}"></div>
      </div>
      <div class="field-grid full">
        <div class="f"><label>Endereço</label><input type="text" data-field="endereco" value="${esc(t.endereco)}"></div>
        <div class="f"><label>Descrição</label><textarea data-field="descricao">${esc(t.descricao)}</textarea></div>
        <div class="f"><label>Coletado por</label><input type="text" data-field="coletado_por" value="${esc(t.coletado_por)}"></div>
      </div>
      <div class="actions-row">
        <button class="abtn abtn-save">Salvar alterações</button>
        <button class="abtn abtn-aprovar">Aprovar</button>
        <button class="abtn abtn-rejeitar">Rejeitar</button>
        <button class="abtn abtn-excluir">Excluir</button>
        <span class="save-msg">Salvo ✓</span>
      </div>
    `;

    function coletarDados() {
      const dados = {};
      card.querySelectorAll('[data-field]').forEach(el => {
        const campo = el.dataset.field;
        if (campo === 'tradicoes') {
          dados[campo] = el.value.split(',').map(s => s.trim()).filter(Boolean);
        } else {
          dados[campo] = el.value.trim() || null;
        }
      });
      return dados;
    }

    async function uploadFotoSlot(file, prefixo) {
      const ext = file.name.split('.').pop();
      const nomeArquivo = `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabaseClient.storage.from('terreiros-fotos').upload(nomeArquivo, file);
      if (error) throw error;
      const { data } = supabaseClient.storage.from('terreiros-fotos').getPublicUrl(nomeArquivo);
      return data.publicUrl;
    }

    async function atualizar(extra, msg) {
      const saveBtn = card.querySelector('.abtn-save');
      const textoOriginal = saveBtn.textContent;
      saveBtn.textContent = 'Salvando...';
      saveBtn.disabled = true;

      try {
        const dados = { ...coletarDados(), ...extra };

        for (const input of card.querySelectorAll('.foto-input')) {
          const file = input.files[0];
          if (!file) continue;
          const url = await uploadFotoSlot(file, input.dataset.slot);
          if (input.dataset.slot === 'fachada') dados.foto_fachada_url = url;
          if (input.dataset.slot === 'responsavel') dados.foto_responsavel_url = url;
        }

        const { error } = await supabaseClient.from('terreiros').update(dados).eq('id', t.id);
        if (error) throw error;

        if (msg) {
          carregarTerreiros();
        } else {
          const saveMsg = card.querySelector('.save-msg');
          saveMsg.style.display = 'inline';
          setTimeout(() => saveMsg.style.display = 'none', 2000);
        }
      } catch (err) {
        alert('Erro ao salvar: ' + err.message);
      } finally {
        saveBtn.textContent = textoOriginal;
        saveBtn.disabled = false;
      }
    }

    card.querySelector('.abtn-save').addEventListener('click', () => atualizar({}, false));
    card.querySelector('.abtn-aprovar').addEventListener('click', () => atualizar({ status: 'aprovado' }, true));
    card.querySelector('.abtn-rejeitar').addEventListener('click', () => atualizar({ status: 'rejeitado' }, true));
    card.querySelector('.abtn-excluir').addEventListener('click', async () => {
      const nomeConfirmacao = t.nome || t.responsavel || 'este terreiro';
      if (!confirm(`Excluir "${nomeConfirmacao}" para sempre? Isso não pode ser desfeito.`)) return;
      const { error } = await supabaseClient.from('terreiros').delete().eq('id', t.id);
      if (error) {
        alert('Erro ao excluir: ' + error.message);
        return;
      }
      carregarTerreiros();
    });

    return card;
  }

  // ---------- DENÚNCIAS ----------
  async function carregarDenuncias() {
    const list = document.getElementById('denunciasList');
    list.innerHTML = '<p class="empty-note">Carregando...</p>';

    const { data, error } = await supabaseClient
      .from('denuncias')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) {
      list.innerHTML = '<p class="empty-note">Erro ao carregar: ' + error.message + '</p>';
      return;
    }
    if (!data || data.length === 0) {
      list.innerHTML = '<p class="empty-note">Nenhuma denúncia recebida ainda.</p>';
      return;
    }

    list.innerHTML = '';
    data.forEach(d => list.appendChild(renderDenunciaCard(d)));
  }

  function renderDenunciaCard(d) {
    const card = document.createElement('div');
    card.className = 'item-card';

    const dataFmt = new Date(d.criado_em).toLocaleString('pt-BR');
    const contato = d.nome_contato || d.telefone_contato
      ? `${d.nome_contato || '—'} · ${d.telefone_contato || '—'}`
      : 'Anônima';

    card.innerHTML = `
      <div class="top-row">
        <strong>${dataFmt}</strong>
        <span class="status-badge ${d.status}">${d.status.replace('_', ' ')}</span>
      </div>
      <div class="relato-box">${esc(d.relato)}</div>
      <div class="field-grid">
        <div class="f"><label>Contato</label><input type="text" value="${esc(contato)}" disabled></div>
        <div class="f"><label>Autoriza publicação (agregada)</label><input type="text" value="${d.consentimento_publicacao ? 'Sim' : 'Não'}" disabled></div>
      </div>
      <div class="field-grid full">
        <div class="f"><label>Status</label>
          <select data-field="status">
            <option value="recebida" ${d.status === 'recebida' ? 'selected' : ''}>Recebida</option>
            <option value="em_analise" ${d.status === 'em_analise' ? 'selected' : ''}>Em análise</option>
            <option value="arquivada" ${d.status === 'arquivada' ? 'selected' : ''}>Arquivada</option>
            <option value="publicada" ${d.status === 'publicada' ? 'selected' : ''}>Publicada</option>
          </select>
        </div>
        <div class="f"><label>Notas internas (só a equipe vê)</label><textarea data-field="notas_internas">${esc(d.notas_internas)}</textarea></div>
      </div>
      <div class="actions-row">
        <button class="abtn abtn-save">Salvar</button>
        <span class="save-msg">Salvo ✓</span>
      </div>
    `;

    card.querySelector('.abtn-save').addEventListener('click', async () => {
      const dados = {
        status: card.querySelector('[data-field="status"]').value,
        notas_internas: card.querySelector('[data-field="notas_internas"]').value.trim() || null,
      };
      const { error } = await supabaseClient.from('denuncias').update(dados).eq('id', d.id);
      if (error) {
        alert('Erro ao salvar: ' + error.message);
        return;
      }
      const saveMsg = card.querySelector('.save-msg');
      saveMsg.style.display = 'inline';
      setTimeout(() => saveMsg.style.display = 'none', 2000);
    });

    return card;
  }

  function esc(v) {
    if (v === null || v === undefined) return '';
    return String(v).replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  checkSession();
});
