// Envio real do formulário de Denúncia para o Supabase

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-denuncia');
  if (!form) return;

  const statusBox = document.getElementById('denuncia-status');
  const submitBtn = document.getElementById('denuncia-submit');

  function showStatus(message, isError) {
    statusBox.textContent = message;
    statusBox.style.display = 'block';
    statusBox.style.background = isError ? '#F1DDD3' : '#E3E6D3';
    statusBox.style.color = isError ? '#7E2A16' : '#3a4321';
    statusBox.style.borderLeftColor = isError ? '#A6391E' : '#4B5A2E';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const relato = document.getElementById('relato').value.trim();
    if (!relato) {
      showStatus('Por favor, descreva o que aconteceu antes de enviar.', true);
      return;
    }

    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;

    try {
      const { error } = await supabaseClient.from('denuncias').insert({
        relato: relato,
        nome_contato: document.getElementById('nome-contato').value || null,
        telefone_contato: document.getElementById('telefone-contato').value || null,
        consentimento_publicacao: document.getElementById('publish-consent').checked,
      });

      if (error) throw error;

      form.reset();
      showStatus('Relato enviado com segurança. Obrigado por confiar nesse canal.', false);
      submitBtn.textContent = 'Enviar relato';
      submitBtn.disabled = false;
    } catch (err) {
      console.error(err);
      const detalhe = (err && (err.message || err.error_description || err.hint)) || 'erro desconhecido';
      showStatus('Erro ao enviar (debug): ' + detalhe, true);
      submitBtn.textContent = 'Enviar relato';
      submitBtn.disabled = false;
    }
  });
});
