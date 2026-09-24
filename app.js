const view = document.querySelector('#view');
const screen = document.querySelector('#screen');
const clock = document.querySelector('#device-clock');
const KEYS = { history: 'glicoguia-history', settings: 'glicoguia-settings', contacts: 'glicoguia-emergency-contacts' };
const defaultSettings = { brightness: 100, volume: 60, language: 'pt-BR', age: '', weight: '', theme: 'light' };
let settings = { ...defaultSettings, ...JSON.parse(localStorage.getItem(KEYS.settings) || '{}') };
let currentContext = 'fasting';

function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char]); }
function getHistory() { return JSON.parse(localStorage.getItem(KEYS.history) || '[]'); }
function saveHistory(history) { localStorage.setItem(KEYS.history, JSON.stringify(history)); }
function getContacts() { return JSON.parse(localStorage.getItem(KEYS.contacts) || '[]'); }
function saveContacts(contacts) { localStorage.setItem(KEYS.contacts, JSON.stringify(contacts)); }
function saveSettings() { localStorage.setItem(KEYS.settings, JSON.stringify(settings)); applySettings(); }
function applySettings() { document.documentElement.style.setProperty('--brightness', Math.max(.45, settings.brightness / 100)); document.body.classList.toggle('dark-mode', settings.theme === 'dark'); }
function updateClock() { clock.textContent = new Intl.DateTimeFormat(settings.language, { hour: '2-digit', minute: '2-digit' }).format(new Date()); }
function dateText(value) { return new Intl.DateTimeFormat(settings.language, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)); }
function focusView() { view.focus({ preventScroll: true }); }
function go(name) { ({ home, testContext, testMeasure, history, emergency, settings: settingsView, off, result })[name](); focusView(); }

function analyse(glucose, context) {
  if (glucose < 54) return { tone: 'low', label: 'Hipoglicemia importante', summary: 'Sua glicose está muito baixa e pode ser uma emergência.', actions: ['Se estiver acordado e conseguir engolir, consuma 15 g de carboidrato de ação rápida.', 'Meça novamente após 15 minutos. Se continuar abaixo de 70 mg/dL, repita.'], urgent: 'Desmaio, convulsão, confusão ou incapacidade de engolir exigem atendimento de urgência. Não ofereça comida ou bebida a alguém inconsciente.' };
  if (glucose < 70) return { tone: 'low', label: 'Glicose baixa', summary: 'O resultado está abaixo de 70 mg/dL. Corrija a glicose e acompanhe seus sintomas.', actions: ['Use a regra 15–15: 15 g de carboidrato rápido e espere 15 minutos.', 'Meça novamente. Se permanecer abaixo de 70 mg/dL, repita.'], urgent: 'Procure urgência se houver confusão, desmaio, convulsão ou dificuldade para engolir.' };
  if (context === 'fasting') {
    if (glucose <= 99) return normal('Em jejum, este valor fica na faixa esperada para a maioria dos adultos.');
    if (glucose <= 125) return { tone: 'attention', label: 'Faixa de pré-diabetes', summary: 'Em jejum, a leitura merece investigação profissional; ela não confirma diagnóstico sozinha.', actions: ['Marque uma avaliação para confirmação com exames adequados.', 'Priorize alimentação equilibrada e movimento regular, com orientação profissional.'], urgent: null };
    return high('Em jejum, o valor está em uma faixa que precisa de investigação para diabetes.');
  }
  if (context === 'after-meal') {
    if (glucose < 140) return normal('Duas horas após a refeição, este valor costuma estar em uma faixa esperada.');
    if (glucose < 200) return { tone: 'attention', label: 'Valor acima do esperado', summary: 'A leitura merece acompanhamento, mas uma medida isolada não confirma diagnóstico.', actions: ['Registre o horário e os alimentos consumidos.', 'Procure avaliação se leituras parecidas aparecerem novamente.'], urgent: null };
    return high('Duas horas após a refeição, o valor está elevado e precisa de avaliação médica.');
  }
  if (glucose < 140) return normal('Fora do jejum, este valor não parece baixo. O horário da refeição ainda influencia a leitura.');
  if (glucose < 200) return { tone: 'attention', label: 'Atenção à glicose', summary: 'Sem o horário da refeição, não é possível classificar a leitura com precisão.', actions: ['Registre esta medida e, se possível, faça uma nova leitura em jejum em outro dia.', 'Converse com um profissional se os valores se repetirem.'], urgent: null };
  return high('Este valor está bastante elevado e deve ser avaliado por um profissional de saúde.');
}
function normal(summary) { return { tone: 'good', label: 'Faixa esperada', summary, actions: ['Mantenha refeições regulares, hidratação e os hábitos de cuidado que funcionam para você.', 'Procure orientação profissional se sentir sintomas ou notar alterações repetidas.'], urgent: null }; }
function high(summary) { return { tone: 'high', label: 'Glicose elevada', summary, actions: ['Procure um(a) profissional de saúde para avaliação e exames de confirmação.', 'Não inicie ou altere medicamentos por conta própria.'], urgent: 'Procure atendimento no mesmo dia se houver vômitos persistentes, respiração difícil, dor abdominal, confusão ou sonolência intensa.' }; }
function contextLabel(context) { return ({ fasting: 'Em jejum', 'after-meal': 'Após refeição', random: 'Outro horário' })[context]; }
function nav(label) { return `<div class="top-nav"><button class="back-button" data-go="home" aria-label="Voltar ao menu">←</button><p>${label}</p></div>`; }

function home() {
  view.innerHTML = `<p class="eyebrow">Pronto para cuidar de você</p><h1>Olá, vamos começar?</h1><p class="lead">Escolha uma opção para usar seu GlicoGuia.</p><div class="menu-list"><button class="menu-button" data-go="testContext"><span class="menu-icon">✦</span><span><b>Realizar teste</b><small>Registrar uma nova leitura</small></span><i class="menu-arrow">›</i></button><button class="menu-button" data-go="history"><span class="menu-icon">◷</span><span><b>Histórico de testes</b><small>Consulte suas medições salvas</small></span><i class="menu-arrow">›</i></button><button class="menu-button" data-go="emergency"><span class="menu-icon">♥</span><span><b>Números de emergência</b><small>Ajuda quando você precisa</small></span><i class="menu-arrow">›</i></button><button class="menu-button" data-go="settings"><span class="menu-icon">⚙</span><span><b>Configurações</b><small>Brilho, volume e perfil</small></span><i class="menu-arrow">›</i></button><button class="menu-button danger" data-go="off"><span class="menu-icon">⏻</span><span><b>Desligar</b><small>Colocar o dispositivo em descanso</small></span><i class="menu-arrow">›</i></button></div><div class="info-strip">Este é um guia educativo. Resultados alterados ou sintomas devem ser avaliados por um profissional de saúde.</div>`;
}
function testContext() {
  view.innerHTML = `${nav('Novo teste')}<p class="eyebrow">Etapa 1 de 2</p><h2>Quando você vai medir?</h2><p class="lead">Escolha o contexto para uma explicação mais adequada.</p><div class="context-options"><label class="context-option"><input type="radio" name="context" value="fasting" checked><span><b>Em jejum</b><small>Sem comer por pelo menos 8 horas</small></span></label><label class="context-option"><input type="radio" name="context" value="after-meal"><span><b>Após refeição</b><small>Cerca de 2 horas após começar a comer</small></span></label><label class="context-option"><input type="radio" name="context" value="random"><span><b>Outro horário</b><small>Sem jejum ou referência de refeição</small></span></label></div><button class="button primary" id="continue-test">Continuar →</button><p class="disclaimer">O resultado não substitui consulta ou exame laboratorial.</p>`;
  document.querySelector('#continue-test').onclick = () => { currentContext = document.querySelector('input[name=context]:checked').value; go('testMeasure'); };
}
function testMeasure() {
  const time = new Date();
  view.innerHTML = `${nav('Novo teste')}<p class="eyebrow">Etapa 2 de 2</p><h2>Insira a leitura</h2><div class="test-meta"><div><b>Contexto</b>${contextLabel(currentContext)}</div><div><b>Data e hora</b>${dateText(time)}</div></div><div class="measure-display"><label for="glucose">Glicose</label><div class="glucose-input"><input id="glucose" type="text" inputmode="numeric" maxlength="3" autocomplete="off" aria-label="Valor da glicose"><span>mg/dL</span></div></div><div class="keypad" aria-label="Teclado numérico"><button class="key" data-key="1">1</button><button class="key" data-key="2">2</button><button class="key" data-key="3">3</button><button class="key" data-key="4">4</button><button class="key" data-key="5">5</button><button class="key" data-key="6">6</button><button class="key" data-key="7">7</button><button class="key" data-key="8">8</button><button class="key" data-key="9">9</button><button class="key action" data-key="clear">⌫</button><button class="key" data-key="0">0</button><button class="key action" id="confirm-test">✓</button></div><p id="test-error" class="form-error" role="alert"></p>`;
  const input = document.querySelector('#glucose');
  document.querySelectorAll('[data-key]').forEach(button => button.onclick = () => { const key = button.dataset.key; if (key === 'clear') input.value = input.value.slice(0, -1); else input.value += key; input.focus(); });
  document.querySelector('#confirm-test').onclick = () => completeTest(time);
  input.focus();
}
function completeTest(time) {
  const glucose = Number(document.querySelector('#glucose').value);
  const error = document.querySelector('#test-error');
  if (!Number.isFinite(glucose) || glucose < 20 || glucose > 700) { error.textContent = 'Digite uma leitura entre 20 e 700 mg/dL.'; return; }
  const outcome = analyse(glucose, currentContext);
  const record = { id: Date.now(), glucose, context: currentContext, date: time.toISOString(), tone: outcome.tone, label: outcome.label };
  saveHistory([record, ...getHistory()].slice(0, 100));
  result(record, outcome);
}
function result(record, outcome) {
  const actions = outcome.actions.map(item => `<li>${item}</li>`).join('');
  view.innerHTML = `${nav('Resultado do teste')}<article class="result-card ${outcome.tone}"><p class="eyebrow">${contextLabel(record.context)} · ${dateText(record.date)}</p><div class="result-number">${record.glucose} <span>mg/dL</span></div><p class="result-label">${outcome.label}</p><p class="result-summary">${outcome.summary}</p></article><section class="advice"><div class="advice-box"><h3>Cuidados agora</h3><ul>${actions}</ul></div>${outcome.urgent ? `<div class="advice-box urgent"><h3>Sinal de urgência</h3><p>${outcome.urgent}</p></div>` : ''}</section><button class="button primary" data-go="home">Concluir</button><p class="disclaimer">Teste salvo no histórico em ${dateText(record.date)}.</p>`;
}
function history() {
  const records = getHistory();
  const list = records.length ? `<div class="history-list">${records.map(item => `<article class="history-item"><span class="tone-dot ${item.tone}"></span><div><b>${item.glucose} mg/dL · ${escapeHtml(item.label)}</b><small>${escapeHtml(contextLabel(item.context))} · ${dateText(item.date)}</small></div><span>›</span></article>`).join('')}</div><button class="button secondary clear-history" id="clear-history">Apagar histórico</button>` : `<div class="empty"><span>◷</span><b>Nenhum teste salvo</b><p>As próximas medições aparecerão aqui com data e hora.</p></div>`;
  view.innerHTML = `${nav('Histórico de testes')}<h2>Suas medições</h2><p class="lead">Os dados ficam somente neste navegador.</p>${list}`;
  const clear = document.querySelector('#clear-history');
  if (clear) clear.onclick = () => { if (confirm('Apagar todos os testes salvos neste dispositivo?')) { saveHistory([]); go('history'); } };
}
function emergency() {
  const personalContacts = getContacts().map(contact => `<div class="contact-card personal-contact"><span class="contact-icon">★</span><span><b>${escapeHtml(contact.name)}</b><small>${escapeHtml(contact.phone)}</small></span><a class="contact-number" href="tel:${encodeURIComponent(contact.phone)}">Ligar</a></div>`).join('');
  view.innerHTML = `${nav('Números de emergência')}<h2>Ajuda rápida</h2><p class="lead">Em risco imediato, procure o serviço de emergência da sua região.</p><div class="contact-card"><span class="contact-icon">✚</span><span><b>SAMU</b><small>Urgência médica</small></span><a class="contact-number" href="tel:192">192</a></div><div class="contact-card"><span class="contact-icon">♨</span><span><b>Bombeiros</b><small>Resgate e emergência</small></span><a class="contact-number" href="tel:193">193</a></div><div class="contact-card"><span class="contact-icon">◉</span><span><b>Polícia Militar</b><small>Segurança pública</small></span><a class="contact-number" href="tel:190">190</a></div><section class="personal-contacts"><h3>Seus contatos de emergência</h3>${personalContacts || '<p class="empty-contact">Nenhum contato pessoal adicionado.</p>'}<form id="contact-form" class="contact-form"><label>Nome<input id="contact-name" maxlength="40" required placeholder="Ex.: Maria"></label><label>Número<input id="contact-phone" inputmode="tel" maxlength="20" required placeholder="Ex.: (92) 99999-9999"></label><button class="button secondary" type="submit">+ Adicionar contato</button><p id="contact-error" class="form-error" role="alert"></p></form></section><div class="warning"><b>Glicose muito baixa:</b> se houver desmaio, convulsão, confusão ou a pessoa não conseguir engolir, não ofereça alimentos ou líquidos. Chame ajuda imediatamente.</div>`;
  document.querySelector('#contact-form').onsubmit = event => {
    event.preventDefault();
    const name = document.querySelector('#contact-name').value.trim();
    const phone = document.querySelector('#contact-phone').value.trim();
    const error = document.querySelector('#contact-error');
    if (!name || phone.replace(/\D/g, '').length < 8) { error.textContent = 'Informe um nome e um número válido.'; return; }
    saveContacts([...getContacts(), { id: Date.now(), name, phone }]);
    emergency();
  };
}
function settingsView() {
  const nextTheme = settings.theme === 'dark' ? '☀ Usar modo claro' : '◐ Usar modo escuro';
  view.innerHTML = `${nav('Configurações')}<h2>Ajustes do dispositivo</h2><p class="lead">Personalize sua experiência.</p><button class="theme-button" id="toggle-theme" type="button">${nextTheme}</button><div class="settings-list"><div class="setting"><label for="brightness">Brilho <output id="brightness-value">${settings.brightness}%</output></label><input id="brightness" type="range" min="45" max="100" value="${settings.brightness}"></div><div class="setting"><label for="volume">Volume <output id="volume-value">${settings.volume}%</output></label><input id="volume" type="range" min="0" max="100" value="${settings.volume}"></div><div class="setting"><label for="language">Idioma</label><select id="language"><option value="pt-BR">Português (Brasil)</option><option value="en-US">English</option><option value="es-ES">Español</option></select></div><div class="setting"><label>Perfil (opcional)</label><div class="profile-grid"><label>Idade<input id="age" type="number" min="1" max="120" value="${escapeHtml(settings.age)}" placeholder="Ex.: 42"></label><label>Peso (kg)<input id="weight" type="number" min="2" max="500" value="${escapeHtml(settings.weight)}" placeholder="Ex.: 70"></label></div></div></div><button class="button primary" id="save-settings">Salvar ajustes</button>`;
  document.querySelector('#language').value = settings.language;
  document.querySelector('#toggle-theme').onclick = () => { settings.theme = settings.theme === 'dark' ? 'light' : 'dark'; saveSettings(); settingsView(); };
  document.querySelector('#brightness').oninput = event => { settings.brightness = event.target.value; document.querySelector('#brightness-value').textContent = `${event.target.value}%`; applySettings(); };
  document.querySelector('#volume').oninput = event => document.querySelector('#volume-value').textContent = `${event.target.value}%`;
  document.querySelector('#save-settings').onclick = () => { settings = { ...settings, volume: document.querySelector('#volume').value, language: document.querySelector('#language').value, age: document.querySelector('#age').value, weight: document.querySelector('#weight').value }; saveSettings(); updateClock(); go('home'); };
}
function off() { view.innerHTML = `<section class="off-screen"><div class="off-icon">⌁</div><h1>Em descanso</h1><p>Seu GlicoGuia está desligado.</p><button class="button" data-go="home">Ligar dispositivo</button></section>`; }

view.addEventListener('click', event => { const target = event.target.closest('[data-go]'); if (target) go(target.dataset.go); });
applySettings(); updateClock(); setInterval(updateClock, 1000); home();
