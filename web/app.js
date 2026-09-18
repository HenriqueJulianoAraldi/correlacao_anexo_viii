// Consulta do Anexo VIII — página estática, sem dependências.
// Os dados vêm de data/anexo8.json, gerado por ../build/gerar.py.
(async () => {
  const resposta = await fetch('data/anexo8.json');
  if (!resposta.ok) {
    document.getElementById('detail').textContent = 'Não foi possível carregar data/anexo8.json.';
    return;
  }
  const D = await resposta.json();

  const $ = s => document.querySelector(s);
  const el = (t, c, txt) => { const n = document.createElement(t); if (c) n.className = c; if (txt != null) n.textContent = txt; return n; };
  const nf = n => n.toLocaleString('pt-BR');
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const LOC_ORDER = ['Local da prestação', 'Domicílio principal do adquirente', 'Local do imóvel',
    'Local da entrega ou da disponibilização', 'Local do evento', 'Domicílio principal do adquirente (matriz)', 'Via explorada'];
  const INCX = { '100101': ['100101', '100102', '100201'], '100301': ['100301', '100302', '100401'], '100501': ['100501', '100502', '100601'] };

  /* ---------- índice ---------- */
  const ITENS = Object.keys(D.rotas).sort();
  const INDEX = ITENS.map(code => {
    const rotas = D.rotas[code], locais = new Set(), inds = new Set(), ccs = new Set();
    let nbsN = 0, semCod = 0, blob = code + ' ' + (D.itens[code] || '');
    rotas.forEach(rt => {
      rt.nbs.forEach(n => {
        if (n.startsWith('§')) { semCod++; blob += ' ' + n.slice(1); }
        else { nbsN++; blob += ' ' + n + ' ' + (D.nbs[n] || ''); }
      });
      rt.r.forEach(b => {
        if (b.i) { inds.add(b.i); blob += ' ' + b.i; }
        if (b.l) locais.add(b.l);
        b.c.forEach(c => { ccs.add(c); blob += ' ' + c + ' ' + D.cclass[c].n; });
      });
    });
    const grp = code.split('.')[0];
    blob += ' ' + grp + ' ' + ((D.grupos || {})[grp] || '');
    return { code, grp, desc: D.itens[code] || '', rotas, locais, inds, ccs, nbsN, semCod, blob: norm(blob) };
  });
  const BY = Object.fromEntries(INDEX.map(i => [i.code, i]));

  const LS = 'anexo8.sel';
  let stored = null;
  try { stored = localStorage.getItem(LS); } catch (e) { }
  let state = { q: '', grp: '', loc: null, cc: '', sel: (stored && BY[stored]) ? stored : ITENS[0] };
  let view = [];

  /* ---------- filtros ---------- */
  function apply() {
    const q = norm(state.q.trim());
    view = INDEX.filter(it =>
      (!state.grp || it.grp === state.grp) &&
      (!state.loc || it.locais.has(state.loc)) &&
      (!state.cc || it.ccs.has(state.cc)) &&
      (!q || it.blob.includes(q)));
    if (view.length && !view.some(it => it.code === state.sel)) select(view[0].code, false);
  }
  function select(code, persist = true) {
    state.sel = code;
    if (persist) { try { localStorage.setItem(LS, code); } catch (e) { } }
  }

  /* ---------- rail ---------- */
  function renderChips() {
    const box = $('#locchips'); box.textContent = '';
    LOC_ORDER.filter(l => l in D.locais).forEach(l => {
      const b = el('button', 'chip', l.replace('Domicílio principal do adquirente (matriz)', 'Domicílio (matriz)'));
      b.type = 'button';
      b.setAttribute('aria-pressed', String(state.loc === l));
      b.onclick = () => { state.loc = state.loc === l ? null : l; apply(); renderChips(); renderList(); renderDetail(); };
      box.appendChild(b);
    });
  }
  function renderGrpSel() {
    const g = $('#gsel');
    g.appendChild(new Option('Qualquer lista de serviço', ''));
    Object.keys(D.grupos).sort().forEach(k => {
      const nome = D.grupos[k];
      g.appendChild(new Option(k + ' · ' + (nome.length > 44 ? nome.slice(0, 43) + '…' : nome) + '  (' + D.grupoN[k] + ')', k));
    });
    g.onchange = () => { state.grp = g.value; apply(); renderList(); renderDetail(); };
  }
  function renderCcSel() {
    const s = $('#ccsel');
    s.appendChild(new Option('Qualquer cClassTrib', ''));
    Object.keys(D.cclass).sort().forEach(c => {
      const nome = D.cclass[c].n;
      s.appendChild(new Option(c + ' · ' + (nome.length > 46 ? nome.slice(0, 45) + '…' : nome), c));
    });
    s.onchange = () => { state.cc = s.value; apply(); renderList(); renderDetail(); };
  }
  function mark(txt, q) {
    if (!q) return el('span', 'd', txt);
    const i = norm(txt).indexOf(q);
    if (i < 0) return el('span', 'd', txt);
    const sp = el('span', 'd');
    sp.append(txt.slice(0, i), el('mark', null, txt.slice(i, i + q.length)), txt.slice(i + q.length));
    return sp;
  }
  function renderList() {
    const list = $('#list'), q = norm(state.q.trim());
    $('#cnt').textContent = view.length === ITENS.length
      ? nf(ITENS.length) + ' subitens' : nf(view.length) + ' de ' + nf(ITENS.length) + ' subitens';
    $('#clr').hidden = !(state.q || state.grp || state.loc || state.cc);
    list.textContent = '';
    if (!view.length) {
      list.appendChild(el('p', 'empty', 'Nada encontrado. Tente um código NBS, um indOp, um cClassTrib ou uma palavra da descrição.'));
      return;
    }
    const frag = document.createDocumentFragment();
    view.forEach(it => {
      const b = el('button', 'li'); b.type = 'button'; b.dataset.code = it.code;
      b.setAttribute('aria-current', String(it.code === state.sel));
      b.appendChild(el('span', 'c', it.code));
      b.appendChild(mark(it.desc, q));
      const n = it.nbsN + (it.semCod ? ' + ' + it.semCod + ' s/ código' : '');
      b.appendChild(el('span', 'm', n + ' NBS · ' + it.rotas.length + (it.rotas.length > 1 ? ' rotas' : ' rota')));
      b.onclick = () => { select(it.code); renderList(); renderDetail(); };
      frag.appendChild(b);
    });
    list.appendChild(frag);
    const cur = list.querySelector('[aria-current="true"]');
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  }
  function step(delta) {
    const i = view.findIndex(it => it.code === state.sel);
    const j = Math.min(view.length - 1, Math.max(0, (i < 0 ? 0 : i) + delta));
    if (j !== i && view[j]) { select(view[j].code); renderList(); renderDetail(); }
  }

  /* ---------- flowchart ---------- */
  function nbsBox(nbs, q) {
    const box = el('div', 'nbsbox'), LIM = 6;
    const hit = c => q && (norm(c).includes(q) || norm(D.nbs[c] || c.slice(1)).includes(q));
    const ordered = q ? [...nbs].sort((a, b) => (hit(b) ? 1 : 0) - (hit(a) ? 1 : 0)) : nbs;
    if (ordered.some(hit)) box.classList.add('hit');
    const draw = upTo => {
      box.textContent = '';
      ordered.slice(0, upTo).forEach(code => {
        const r = el('div', 'nbsrow');
        if (hit(code)) r.classList.add('hit');
        if (code.startsWith('§')) {
          r.classList.add('nocode');
          r.appendChild(el('span', 'c', 'sem código'));
          r.appendChild(mark(code.slice(1), q));
        } else {
          r.appendChild(el('span', 'c', code));
          r.appendChild(mark(D.nbs[code] || '', q));
        }
        box.appendChild(r);
      });
      if (upTo < ordered.length) {
        const m = el('button', 'more', 'mostrar os outros ' + (ordered.length - upTo) + ' NBS');
        m.type = 'button'; m.onclick = () => { draw(ordered.length); wireUp(); }; box.appendChild(m);
      } else if (ordered.length > LIM) {
        const m = el('button', 'more', 'recolher');
        m.type = 'button'; m.onclick = () => { draw(LIM); wireUp(); }; box.appendChild(m);
      }
    };
    draw(LIM);
    return box;
  }
  function branchNode(b, q) {
    if (!b.i) {
      const g = el('div', 'gap');
      g.innerHTML = '<b>Sem indOp, sem local de incidência e sem cClassTrib.</b> É a única linha do anexo sem nenhuma correlação — linha 1348 da planilha.';
      return g;
    }
    const n = el('div', 'node');
    if (q && norm(b.i).includes(q)) n.classList.add('hit');
    n.appendChild(el('div', 'c', b.i));
    n.appendChild(el('div', 'l', b.l || '—'));
    if (INCX[b.i]) {
      const cond = el('div', 'cond');
      cond.innerHTML = 'Vale para <b>prestação onerosa</b> com <b>adquirente no país</b>.';
      n.appendChild(cond);
      const btn = el('button', 'incx', 'ver a regra do inciso X'); btn.type = 'button';
      const m = el('div', 'matrix'); m.hidden = true;
      const v = INCX[b.i];
      m.innerHTML =
        '<div class="mcap">Estes códigos <b>não são alternativas deste subitem na tabela</b>. ' +
        'Vêm da aba REGRA inc. X: são o substituto do indOp quando a operação foge do caso-base.</div>' +
        '<table><thead><tr><th>Onerosa<br>no país</th><th>Onerosa<br>exterior</th><th>Não<br>onerosa</th></tr></thead>' +
        '<tbody><tr><td class="here">' + v[0] + '</td><td class="off">' + v[1] + '</td><td class="off">' + v[2] + '</td></tr></tbody></table>' +
        '<div class="mfoot">A linha deste subitem traz <b>PS onerosa = S</b> e <b>Adq. exterior = N</b>, por isso o anexo registra ' +
        '<b>' + v[0] + '</b>. O ' + v[1] + ' e o ' + v[2] + ' não aparecem em nenhuma das 1.521 linhas da tabela de correlação.</div>';
      btn.onclick = () => { m.hidden = !m.hidden; btn.textContent = m.hidden ? 'ver a regra do inciso X' : 'ocultar a regra'; wireUp(); };
      n.append(btn, m);
    }
    return n;
  }
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (t, attrs) => { const n = document.createElementNS(NS, t); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };

  function drawWires(flow) {
    let svg = flow.querySelector('svg.wires');
    if (!svg) { svg = svgEl('svg', { class: 'wires' }); flow.appendChild(svg); }
    svg.textContent = '';
    if (window.innerWidth <= 760) return;
    const fr = flow.getBoundingClientRect();
    if (!fr.width) return;
    svg.setAttribute('viewBox', '0 0 ' + fr.width + ' ' + fr.height);
    svg.setAttribute('width', fr.width);
    svg.setAttribute('height', fr.height);

    const nbs = flow.querySelector('.nbsbox');
    const links = [];
    flow.querySelectorAll('.branch').forEach(br => {
      const node = br.querySelector('.node, .gap');
      if (!node) return;
      if (nbs) links.push([nbs, node, 'w2']);
      br.querySelectorAll('.cc').forEach(cc => links.push([node, cc, 'w3']));
    });

    links.forEach(([a, b, tone]) => {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      const x1 = ra.right - fr.left, y1 = ra.top - fr.top + ra.height / 2;
      const x2 = rb.left - fr.left, y2 = rb.top - fr.top + Math.min(rb.height / 2, 28);
      if (x2 <= x1) return;
      const dx = Math.max(16, (x2 - x1) * 0.55);
      svg.appendChild(svgEl('path', {
        class: tone,
        d: 'M' + x1 + ',' + y1 + ' C' + (x1 + dx) + ',' + y1 + ' ' + (x2 - dx) + ',' + y2 + ' ' + x2 + ',' + y2
      }));
      svg.appendChild(svgEl('circle', { class: tone, cx: x1, cy: y1, r: 2.6 }));
      svg.appendChild(svgEl('circle', { class: tone, cx: x2, cy: y2, r: 2.6 }));
    });
  }

  let ro = null;
  function wireUp() {
    const flows = document.querySelectorAll('#detail .flow');
    if (ro) ro.disconnect();
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(entries => entries.forEach(e => drawWires(e.target)));
      flows.forEach(f => ro.observe(f));
    }
    requestAnimationFrame(() => flows.forEach(drawWires));
  }
  let wt = null;
  function syncHeader() {
    const h = document.querySelector('header.top');
    if (h) document.documentElement.style.setProperty('--hdr', Math.round(h.getBoundingClientRect().height) + 'px');
  }
  window.addEventListener('resize', () => { clearTimeout(wt); wt = setTimeout(() => { syncHeader(); wireUp(); }, 120); });
  if ('ResizeObserver' in window) {
    const hr = new ResizeObserver(syncHeader);
    const h = document.querySelector('header.top');
    if (h) hr.observe(h);
  }
  syncHeader();

  function renderDetail() {
    const it = BY[state.sel] || INDEX[0], d = $('#detail'), q = norm(state.q.trim());
    d.textContent = '';

    const head = el('div', 'itemhead');
    const nav = el('div', 'navrow');
    const pos = view.findIndex(x => x.code === it.code);
    nav.appendChild(el('span', 'pos', pos >= 0 ? 'Subitem ' + (pos + 1) + ' de ' + nf(view.length) : 'Subitem'));
    const nb = el('div', 'nav');
    [['‹', -1, 'Subitem anterior'], ['›', 1, 'Próximo subitem']].forEach(([g, dl, lab]) => {
      const b = el('button', null, g); b.type = 'button'; b.title = lab; b.setAttribute('aria-label', lab);
      b.disabled = pos < 0 || (dl < 0 ? pos === 0 : pos === view.length - 1);
      b.onclick = () => step(dl); nb.appendChild(b);
    });
    nav.appendChild(nb); head.appendChild(nav);

    const g = (D.grupos || {})[it.grp];
    if (g) {
      const gl = el('div', 'grpline');
      gl.appendChild(el('span', 'gc', 'Lista ' + it.grp));
      gl.appendChild(el('span', null, g));
      head.appendChild(gl);
    }
    const k = el('div', 'k');
    k.appendChild(el('span', 'lbl', 'Subitem LC 116'));
    k.appendChild(el('span', 'code', it.code));
    head.appendChild(k);
    head.appendChild(el('p', null, it.desc));

    const facts = el('div', 'facts');
    const add = html => { const f = el('div', 'fact'); f.innerHTML = html; facts.appendChild(f); };
    add('<b>' + it.nbsN + '</b> NBS');
    if (it.semCod) add('<b>' + it.semCod + '</b> sem código NBS');
    add('<b>' + it.rotas.length + '</b> ' + (it.rotas.length > 1 ? 'rotas' : 'rota'));
    add('<b>' + it.inds.size + '</b> indOp');
    add('<b>' + it.ccs.size + '</b> cClassTrib');
    [...it.locais].forEach(l => add(l));
    head.appendChild(facts);
    d.appendChild(head);

    const wrap = el('div', 'rotas');
    it.rotas.forEach((rt, i) => {
      const card = el('div', 'rota');
      const hd = el('div', 'rotahd');
      hd.appendChild(el('span', 'n', 'Rota ' + (i + 1) + ' de ' + it.rotas.length));
      const nOk = rt.nbs.filter(n => !n.startsWith('§')).length, semc = rt.nbs.length - nOk;
      const parts = [];
      if (nOk) parts.push(nOk + ' NBS');
      if (semc) parts.push(semc + (semc === 1 ? ' serviço sem código NBS' : ' serviços sem código NBS'));
      const ind = rt.r.filter(b => b.i).length;
      if (ind) parts.push(ind + ' indOp');
      hd.appendChild(el('span', 'meta', parts.join(' · ')));
      card.appendChild(hd);

      const flow = el('div', 'flow');
      const s2 = el('div', 'stage');
      s2.appendChild(el('div', 'stagelbl lbl2', 'NBS · o que foi fornecido'));
      s2.appendChild(nbsBox(rt.nbs, q));
      flow.appendChild(s2);

      const right = el('div', 'stage');
      const temCc = rt.r.some(b => b.c.length);
      const lbls = el('div', 'blbls');
      lbls.appendChild(el('div', 'stagelbl lbl3', 'indOp · onde incide'));
      if (temCc) lbls.appendChild(el('div', 'stagelbl lbl4', 'cClassTrib · como tributa'));
      right.appendChild(lbls);

      const br = el('div', 'branches');
      rt.r.forEach(b => {
        const row = el('div', 'branch'), g = el('div', 'bgrid');
        g.appendChild(branchNode(b, q));
        if (b.c.length) {
          const cl = el('div', 'ccs');
          b.c.forEach(c => {
            const o = D.cclass[c], n = el('div', 'cc');
            if (q && (norm(c).includes(q) || norm(o.n).includes(q))) n.classList.add('hit');
            if (o.div) n.classList.add('diverge');
            n.appendChild(el('span', 'c', c));
            n.appendChild(el('span', 'd', o.n));
            const meta = el('div', 'meta');
            if (o.cst) meta.appendChild(el('span', 'tag cst', 'CST ' + o.cst));
            if (o.dcst) meta.appendChild(el('span', 'tag', o.dcst));
            if (o.art) meta.appendChild(el('span', 'tag', 'LC 214/25 · ' + o.art));
            if (meta.children.length) n.appendChild(meta);
            if (o.div) n.appendChild(el('div', 'warn', o.div));
            cl.appendChild(n);
          });
          g.appendChild(cl);
        }
        row.appendChild(g); br.appendChild(row);
      });
      right.appendChild(br);
      flow.appendChild(right);
      card.appendChild(flow);
      wrap.appendChild(card);
    });
    d.appendChild(wrap);
    wireUp();
  }

  /* ---------- eventos ---------- */
  $('#q').addEventListener('input', e => { state.q = e.target.value; apply(); renderList(); renderDetail(); });
  $('#clr').onclick = () => {
    state.q = ''; state.grp = ''; state.loc = null; state.cc = '';
    $('#q').value = ''; $('#gsel').value = ''; $('#ccsel').value = '';
    apply(); renderChips(); renderList(); renderDetail();
  };
  $('#list').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
  });
  $('#q').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); $('#list').focus(); step(1); }
  });

  $('.ver').textContent = D.meta.versao;
  $('.sub').textContent = 'Consulta de correlação para IBS e CBS — ' + nf(D.meta.subitens) +
    ' subitens, ' + nf(D.meta.nbs) + ' NBS, ' + nf(D.meta.rotas) + ' rotas.';
  $('#foot').textContent =
    'Fonte: ' + D.meta.fonte_anexo + ', a aba REGRA inc. X do mesmo arquivo e ' + D.meta.fonte_cc + '. ' +
    'Os indOp são os do AnexoVII v1.01.00; a versão vigente é a v1.02.00 (NT 009/2026). ' +
    'Lacunas da planilha aparecem marcadas em vermelho no fluxo.';

  /* ---------- tabelas de apoio ---------- */
  let refDone = false;
  function renderRef() {
    if (refDone) return; refDone = true;

    const it = $('#indtbl');
    it.innerHTML = '<thead><tr><th>indOp</th><th>Local de incidência do IBS e da CBS</th></tr></thead>';
    const ib = el('tbody');
    Object.keys(D.indop).sort().forEach(code => {
      const tr = el('tr');
      tr.append(el('td', 'k3', code), el('td', null, D.indop[code].l));
      ib.appendChild(tr);
    });
    it.appendChild(ib);

    const t = $('#cctbl');
    t.innerHTML = '<thead><tr><th>cClassTrib</th><th>CST</th><th>Tratamento</th><th>Nome</th><th>LC 214/25</th></tr></thead>';
    const tb = el('tbody');
    Object.keys(D.cclass).sort().forEach(code => {
      const o = D.cclass[code], tr = el('tr');
      tr.append(el('td', 'k', code), el('td', 'k2', o.cst || '—'), el('td', null, o.dcst || '—'),
                el('td', null, o.n), el('td', 'k2', o.art || '—'));
      tb.appendChild(tr);
    });
    t.appendChild(tb);
  }

  document.querySelectorAll('.tab').forEach(t => {
    t.onclick = () => {
      document.querySelectorAll('.tab').forEach(x => x.setAttribute('aria-selected', String(x === t)));
      $('#p-fluxo').hidden = t.dataset.tab !== 'fluxo';
      $('#p-ref').hidden = t.dataset.tab !== 'ref';
      if (t.dataset.tab === 'ref') renderRef(); else wireUp();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  });
  document.querySelectorAll('.jump a').forEach(a => {
    a.onclick = e => {
      e.preventDefault();
      const el2 = document.querySelector(a.getAttribute('href'));
      if (el2) el2.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  });

  renderChips(); renderGrpSel(); renderCcSel(); apply(); renderList(); renderDetail();
})();
