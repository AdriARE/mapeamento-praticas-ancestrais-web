// Seletor de endereço — autocompletar (Photon/OpenStreetMap) + marcador arrastável
// Uso:
//   EnderecoPicker.attach(inputElement, { lat: -8.11, lng: -35.29 })
// As coordenadas ficam guardadas em input.dataset.lat / input.dataset.lng

(function () {
  // Centro de Vitória de Santo Antão — usado para priorizar resultados próximos
  const CENTRO = { lat: -8.1178, lng: -35.2911 };
  const ZOOM_INICIAL = 13;
  const ZOOM_ESCOLHIDO = 17;

  let estilosInjetados = false;

  function injetarEstilos() {
    if (estilosInjetados) return;
    estilosInjetados = true;
    const css = `
      .ep-wrap { position: relative; }
      .ep-sugestoes {
        position: absolute; z-index: 900; left: 0; right: 0;
        background: #fff; border: 1px solid rgba(42,33,21,.2); border-radius: 8px;
        margin-top: 4px; max-height: 220px; overflow-y: auto; display: none;
        box-shadow: 0 10px 24px -12px rgba(42,33,21,.4);
      }
      .ep-sugestoes.aberto { display: block; }
      .ep-sugestao {
        padding: 9px 12px; font-size: .85rem; cursor: pointer; line-height: 1.35;
        border-bottom: 1px solid rgba(42,33,21,.07); color: #2a2115;
      }
      .ep-sugestao:last-child { border-bottom: none; }
      .ep-sugestao:hover, .ep-sugestao.ativo { background: #f3ece0; }
      .ep-sugestao small { display: block; color: #8a7d64; font-size: .76rem; }
      .ep-mapa {
        height: 220px; margin-top: 10px; border-radius: 8px;
        border: 1px solid rgba(42,33,21,.15); overflow: hidden; background: #e9e4d8;
      }
      .ep-ajuda { font-size: .78rem; color: #7a6d54; margin-top: 6px; line-height: 1.45; }
      .ep-status { font-size: .78rem; color: #8a7d64; margin-top: 4px; min-height: 1em; }
      .ep-status.ok { color: #4B5A2E; }
    `;
    const tag = document.createElement('style');
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  function montarRotulo(props) {
    const linha1 = [props.name, props.housenumber].filter(Boolean).join(', ');
    const linha2 = [props.district, props.city, props.state].filter(Boolean).join(' — ');
    return { principal: linha1 || props.city || 'Sem nome', secundaria: linha2 };
  }

  function textoCompleto(props) {
    return [
      [props.name, props.housenumber].filter(Boolean).join(', '),
      props.district,
      props.city,
      props.state
    ].filter(Boolean).join(', ');
  }

  function attach(input, iniciais) {
    if (!input || input.dataset.epAtivo === '1') return;
    input.dataset.epAtivo = '1';
    injetarEstilos();

    // --- estrutura ---
    const wrap = document.createElement('div');
    wrap.className = 'ep-wrap';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);

    const lista = document.createElement('div');
    lista.className = 'ep-sugestoes';
    wrap.appendChild(lista);

    const status = document.createElement('div');
    status.className = 'ep-status';
    wrap.appendChild(status);

    const divMapa = document.createElement('div');
    divMapa.className = 'ep-mapa';
    wrap.appendChild(divMapa);

    const ajuda = document.createElement('p');
    ajuda.className = 'ep-ajuda';
    ajuda.textContent = 'Digite o endereço e escolha uma das sugestões. Se o endereço não aparecer na lista, arraste o marcador no mapa até o local exato do terreiro.';
    wrap.appendChild(ajuda);

    // --- coordenadas iniciais ---
    const temIniciais = iniciais && iniciais.lat != null && iniciais.lng != null &&
                        iniciais.lat !== '' && iniciais.lng !== '';
    const latIni = temIniciais ? Number(iniciais.lat) : CENTRO.lat;
    const lngIni = temIniciais ? Number(iniciais.lng) : CENTRO.lng;

    if (temIniciais) {
      input.dataset.lat = latIni;
      input.dataset.lng = lngIni;
      status.textContent = 'Localização definida.';
      status.classList.add('ok');
    } else {
      input.dataset.lat = '';
      input.dataset.lng = '';
    }

    // --- mapa ---
    const mapa = L.map(divMapa).setView([latIni, lngIni], temIniciais ? ZOOM_ESCOLHIDO : ZOOM_INICIAL);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(mapa);

    const marcador = L.marker([latIni, lngIni], { draggable: true }).addTo(mapa);

    // O mapa às vezes nasce com tamanho errado quando o contêiner ainda está oculto
    setTimeout(() => mapa.invalidateSize(), 200);

    function gravarCoords(lat, lng) {
      input.dataset.lat = lat;
      input.dataset.lng = lng;
      status.textContent = 'Localização definida.';
      status.classList.add('ok');
      input.dispatchEvent(new Event('ep:change', { bubbles: true }));
    }

    marcador.on('dragend', () => {
      const p = marcador.getLatLng();
      gravarCoords(p.lat, p.lng);
    });

    mapa.on('click', (e) => {
      marcador.setLatLng(e.latlng);
      gravarCoords(e.latlng.lat, e.latlng.lng);
    });

    // --- autocompletar ---
    let timer = null;
    let resultados = [];

    function fecharLista() {
      lista.classList.remove('aberto');
      lista.innerHTML = '';
    }

    async function buscar(termo) {
      const url = 'https://photon.komoot.io/api/?q=' + encodeURIComponent(termo) +
                  '&lat=' + CENTRO.lat + '&lon=' + CENTRO.lng +
                  '&limit=6&lang=pt';
      try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('busca falhou');
        const json = await resp.json();
        resultados = (json.features || []).filter(f => f.geometry && f.geometry.coordinates);
        mostrarResultados();
      } catch (err) {
        fecharLista();
        status.textContent = 'Não foi possível buscar sugestões agora. Você pode marcar o local no mapa.';
        status.classList.remove('ok');
      }
    }

    function mostrarResultados() {
      if (resultados.length === 0) {
        lista.innerHTML = '<div class="ep-sugestao" style="cursor:default;color:#8a7d64;">Nenhum endereço encontrado. Marque o local no mapa abaixo.</div>';
        lista.classList.add('aberto');
        return;
      }
      lista.innerHTML = '';
      resultados.forEach((f, i) => {
        const props = f.properties || {};
        const rot = montarRotulo(props);
        const item = document.createElement('div');
        item.className = 'ep-sugestao';
        item.innerHTML = `${rot.principal}<small>${rot.secundaria}</small>`;
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
          escolher(i);
        });
        lista.appendChild(item);
      });
      lista.classList.add('aberto');
    }

    function escolher(i) {
      const f = resultados[i];
      if (!f) return;
      const coords = f.geometry.coordinates; // [lng, lat]
      const lat = coords[1];
      const lng = coords[0];
      input.value = textoCompleto(f.properties || {});
      marcador.setLatLng([lat, lng]);
      mapa.setView([lat, lng], ZOOM_ESCOLHIDO);
      gravarCoords(lat, lng);
      fecharLista();
    }

    input.addEventListener('input', () => {
      const termo = input.value.trim();
      clearTimeout(timer);
      if (termo.length < 3) {
        fecharLista();
        return;
      }
      timer = setTimeout(() => buscar(termo), 350);
    });

    input.addEventListener('blur', () => setTimeout(fecharLista, 150));

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') fecharLista();
    });

    return { mapa, marcador };
  }

  window.EnderecoPicker = { attach };
})();
