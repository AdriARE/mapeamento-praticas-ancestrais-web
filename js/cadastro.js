// Envio real do formulário de Cadastrar terreiro para o Supabase

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-cadastro');
  if (!form) return;

  const statusBox = document.getElementById('cadastro-status');
  const submitBtn = document.getElementById('cadastro-submit');

  // Mostra o campo de texto só quando "Outra" está marcada
  const outraCheck = document.getElementById('tradicao-outra-check');
  const outraTexto = document.getElementById('tradicao-outra-texto');
  if (outraCheck && outraTexto) {
    outraCheck.addEventListener('change', () => {
      outraTexto.style.display = outraCheck.checked ? 'block' : 'none';
      if (!outraCheck.checked) outraTexto.value = '';
    });
  }

  function showStatus(message, isError) {
    statusBox.textContent = message;
    statusBox.style.display = 'block';
    statusBox.style.background = isError ? '#F1DDD3' : '#E3E6D3';
    statusBox.style.color = isError ? '#7E2A16' : '#3a4321';
    statusBox.style.borderLeftColor = isError ? '#A6391E' : '#4B5A2E';
  }

  async function uploadFoto(file, prefixo) {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const nomeArquivo = `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabaseClient.storage
      .from('terreiros-fotos')
      .upload(nomeArquivo, file);
    if (error) throw error;
    const { data } = supabaseClient.storage.from('terreiros-fotos').getPublicUrl(nomeArquivo);
    return data.publicUrl;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!document.getElementById('consent').checked) {
      showStatus('Você precisa autorizar a publicação das informações para enviar o cadastro.', true);
      return;
    }

    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    try {
      const fotoFachadaFile = document.getElementById('foto-fachada').files[0];
      const fotoResponsavelFile = document.getElementById('foto-responsavel').files[0];

      const [fotoFachadaUrl, fotoResponsavelUrl] = await Promise.all([
        uploadFoto(fotoFachadaFile, 'fachada'),
        uploadFoto(fotoResponsavelFile, 'responsavel'),
      ]);

      const tradicoes = Array.from(
        document.querySelectorAll('input[name="tradicao"]:checked')
      ).map(el => {
        if (el.value === 'Outra') {
          const outra = document.getElementById('tradicao-outra-texto').value.trim();
          return outra || 'Outra';
        }
        return el.value;
      });

      const enderecoInput = document.getElementById('endereco');
      const lat = enderecoInput.dataset.lat ? Number(enderecoInput.dataset.lat) : null;
      const lng = enderecoInput.dataset.lng ? Number(enderecoInput.dataset.lng) : null;

      const { error } = await supabaseClient.from('terreiros').insert({
        nome: document.getElementById('nome-terreiro').value || null,
        nacao: document.getElementById('nacao').value || null,
        tradicoes: tradicoes,
        ano_fundacao: document.getElementById('ano-fundacao').value || null,
        endereco: document.getElementById('endereco').value || null,
        lat: lat,
        lng: lng,
        responsavel: document.getElementById('nome-responsavel').value || null,
        telefone: document.getElementById('telefone').value || null,
        instagram: document.getElementById('instagram').value || null,
        foto_fachada_url: fotoFachadaUrl,
        foto_responsavel_url: fotoResponsavelUrl,
        descricao: document.getElementById('descricao').value || null,
      });

      if (error) throw error;

      form.reset();
      showStatus('Cadastro enviado! A equipe vai revisar as informações antes de publicá-las.', false);
      submitBtn.textContent = 'Enviar cadastro';
      submitBtn.disabled = false;
    } catch (err) {
      console.error(err);
      showStatus('Não foi possível enviar o cadastro. Tente novamente em alguns instantes.', true);
      submitBtn.textContent = 'Enviar cadastro';
      submitBtn.disabled = false;
    }
  });
});