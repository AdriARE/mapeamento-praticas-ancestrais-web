// Envio real do formulário de Denúncia para o Supabase
// VERSÃO DE DIAGNÓSTICO — mostra o erro completo na tela

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-denuncia');
  if (!form) return;

  const statusBox = document.getElementById('denuncia-status');
  const submitBtn = document.getElementById('denuncia-submit');

  function showStatus(message, isError) {
    statusBox.textContent = message;
    statusBox.style.display = 'block';
    statusBox.style.whiteSpace = 'pre-wrap';
    statusBox.style.fontFamily = 'monospace';
    statusBox.style.fontSize = '13px';
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

    // Informação do cliente Supabase que o site está realmente usando
    let infoCliente = '';
    try {
      infoCliente =
        'URL: ' + (supabaseClient.supabaseUrl || '???') + '\n' +
        'KEY (início): ' + String(supabaseClient.supabaseKey || '???').slice(0, 24) + '...\n\n';
    } catch (e2) {
      infoCliente = 'Não foi possível ler dados do cliente Supabase.\n\n';
    }

    try {
      const resposta = await supabaseClient.from('denuncias').insert({
        relato: relato,
        nome_contato: document.getElementById('nome-contato').value || null,
        telefone_contato: document.getElementById('telefone-contato').value || null,
        consentimento_publicacao: document.getElementById('publish-consent').checked,
      });

      if (resposta.error) {
        showStatus(
          'DIAGNÓSTICO\n\n' +
          infoCliente +
          'ERRO COMPLETO:\n' +
          JSON.stringify(resposta.error, null, 2) + '\n\n' +
          'STATUS: ' + (resposta.status || '-') + ' ' + (resposta.statusText || ''),
          true
        );
        submitBtn.textContent = 'Enviar relato';
        submitBtn.disabled = false;
        return;
      }

      form.reset();
      showStatus('Relato enviado com segurança. Obrigado por confiar nesse canal.', false);
      submitBtn.textContent = 'Enviar relato';
      submitBtn.disabled = false;
    } catch (err) {
      showStatus(
        'DIAGNÓSTICO (exceção)\n\n' +
        infoCliente +
        'ERRO:\n' +
        JSON.stringify(err, Object.getOwnPropertyNames(err || {}), 2),
        true
      );
      submitBtn.textContent = 'Enviar relato';
      submitBtn.disabled = false;
    }
  });
});
