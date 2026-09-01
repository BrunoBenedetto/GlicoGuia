const form = document.querySelector('#glucose-form');
const result = document.querySelector('#result');
const error = document.querySelector('#form-error');

const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]);

function analyse(glucose, context) {
  if (glucose < 54) return {
    tone: 'low', label: 'Hipoglicemia importante',
    summary: 'Sua glicemia está muito baixa. Isso pode se tornar uma emergência, principalmente se houver sonolência, confusão, desmaio ou convulsão.',
    actions: ['Se estiver acordado e conseguir engolir, consuma 15 g de carboidrato de ação rápida (por exemplo: 150 mL de suco comum, 1 colher de sopa de açúcar ou 3–4 tabletes de glicose).', 'Meça novamente após 15 minutos. Se continuar abaixo de 70 mg/dL, repita.', 'Depois que melhorar, faça um lanche ou refeição com carboidrato e proteína.'],
    urgent: 'Não dirija. Se houver desmaio, convulsão, confusão, incapacidade de engolir ou se a pessoa não melhorar, chame o serviço de emergência local imediatamente. Não ofereça alimento ou líquido a quem estiver inconsciente.'
  };
  if (glucose < 70) return {
    tone: 'low', label: 'Hipoglicemia (glicose baixa)',
    summary: 'Sua glicemia está abaixo de 70 mg/dL. É importante corrigi-la agora e observar como você se sente.',
    actions: ['Use a regra 15–15: consuma 15 g de carboidrato de absorção rápida e aguarde 15 minutos.', 'Meça novamente. Se o resultado ainda for menor que 70 mg/dL, repita.', 'Evite pular refeições e converse com sua equipe de saúde se essas quedas se repetirem, especialmente se usa insulina ou remédios para diabetes.'],
    urgent: 'Procure atendimento urgente se surgirem confusão, desmaio, convulsão ou se você não conseguir engolir.'
  };
  if (context === 'fasting') {
    if (glucose <= 99) return normalResult('Em jejum, este valor fica na faixa esperada para a maioria dos adultos.');
    if (glucose <= 125) return {
      tone: 'attention', label: 'Faixa de pré-diabetes',
      summary: 'Em jejum, esta leitura está na faixa de pré-diabetes. Um aparelho doméstico não confirma diagnóstico: exames laboratoriais e avaliação profissional são necessários.',
      actions: ['Marque uma conversa com profissional de saúde para confirmar a avaliação com exames adequados.', 'Priorize refeições com verduras, feijões, grãos integrais e proteínas; reduza bebidas açucaradas e ultraprocessados.', 'Busque inserir movimento na rotina de forma segura, como caminhadas, conforme sua condição e orientação profissional.'],
      urgent: null
    };
    return highResult('Em jejum, este valor está na faixa que precisa de investigação para diabetes. Uma única medição não fecha diagnóstico.');
  }
  if (context === 'after-meal') {
    if (glucose < 140) return normalResult('Duas horas após iniciar a refeição, este valor costuma ficar em uma faixa esperada.');
    if (glucose < 200) return {
      tone: 'attention', label: 'Valor acima do esperado',
      summary: 'Duas horas após a refeição, esta leitura está acima da faixa geralmente esperada. Ela merece acompanhamento, mas não confirma um diagnóstico sozinha.',
      actions: ['Anote a leitura, o horário e o que comeu para compartilhar na consulta.', 'Considere uma avaliação profissional, principalmente se esses valores aparecem mais de uma vez.', 'Prefira uma alimentação equilibrada e atividade física regular, com orientação adequada para você.'], urgent: null
    };
    return highResult('Duas horas após a refeição, este valor está bastante elevado e precisa de avaliação médica o quanto antes.');
  }
  if (glucose < 140) return normalResult('Fora do jejum, esta leitura não parece baixa. Ainda assim, o horário e a refeição influenciam a interpretação.');
  if (glucose < 200) return {
    tone: 'attention', label: 'Atenção à glicemia', summary: 'Sem saber o horário da refeição, não é possível classificar esta leitura com precisão. O valor merece ser registrado e discutido se for recorrente.',
    actions: ['Faça uma nova medida em jejum em outro dia, seguindo a orientação profissional.', 'Anote sintomas, horário, alimentos e medicamentos para a consulta.', 'Cuide da rotina de alimentação, sono e movimento sem fazer mudanças em medicamentos por conta própria.'], urgent: null
  };
  return highResult('Fora do jejum, este valor está muito elevado. Com sintomas como muita sede, urinar muito ou perda de peso, a avaliação deve ser imediata.');
}

function normalResult(summary) { return { tone: 'good', label: 'Faixa esperada', summary, actions: ['Mantenha refeições regulares, hidratação e hábitos que façam sentido para sua rotina.', 'Continue acompanhando conforme a orientação da sua equipe de saúde, se tiver uma.', 'Se sentir sintomas ou notar valores alterados repetidamente, procure avaliação profissional.'], urgent: null }; }
function highResult(summary) { return { tone: 'high', label: 'Glicemia elevada — investigue', summary, actions: ['Procure um(a) profissional de saúde para avaliação e exames de confirmação. Não se autodiagnostique.', 'Não altere nem inicie medicamentos por conta própria.', 'Anote suas leituras, horários, sintomas e medicamentos para levar à consulta.'], urgent: 'Procure atendimento no mesmo dia se houver vômitos persistentes, respiração difícil, dor abdominal, confusão, sonolência intensa ou mal-estar importante.' }; }

function personalMessage(age, activity, weight) {
  const activityText = activity === 'no' ? 'Comece devagar e converse com um profissional antes de iniciar exercícios, especialmente se tiver sintomas ou outras condições de saúde.' : activity === 'sometimes' ? 'Pequenos períodos de movimento ao longo da semana já podem ser um bom começo; escolha algo de que você goste.' : 'Que bom que o movimento já faz parte da sua rotina. Mantenha o acompanhamento que for adequado para você.';
  const ageText = age < 18 ? 'Como você tem menos de 18 anos, peça a ajuda de um responsável e procure um serviço de saúde para interpretar a leitura.' : age >= 65 ? 'Em pessoas mais velhas, metas e sintomas podem ser diferentes; uma conversa individualizada com a equipe de saúde é especialmente valiosa.' : activityText;
  return `${ageText}${weight ? ` O peso informado (${escapeHtml(weight)} kg) foi registrado apenas para sua referência e não determina esta classificação.` : ''}`;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const glucose = Number(data.get('glucose'));
  const age = Number(data.get('age'));
  const weight = data.get('weight');
  if (!Number.isFinite(glucose) || glucose < 20 || glucose > 700 || !Number.isFinite(age) || age < 1 || age > 120) {
    error.textContent = 'Confira a glicemia (20 a 700 mg/dL) e a idade antes de continuar.';
    return;
  }
  error.textContent = '';
  const outcome = analyse(glucose, data.get('context'));
  const actions = outcome.actions.map((action) => `<li>${action}</li>`).join('');
  result.hidden = false;
  result.innerHTML = `<article class="card result-card ${outcome.tone}"><div class="result-header"><div><p class="eyebrow">Leitura informada: ${glucose} mg/dL</p><h2>${outcome.label}</h2><p class="result-summary">${outcome.summary}</p></div><span class="result-pill">Resultado educativo</span></div><div class="result-grid"><div class="action-box"><h3>Cuidados agora</h3><ul>${actions}</ul></div>${outcome.urgent ? `<div class="action-box urgent"><h3>Sinal de urgência</h3><p>${outcome.urgent}</p></div>` : `<div class="action-box"><h3>Lembrete importante</h3><p>Esta ferramenta não substitui consulta, exames laboratoriais ou uma orientação individualizada.</p></div>`}</div><p class="personal-note">${personalMessage(age, data.get('activity'), weight)}</p></article>`;
  result.focus({ preventScroll: true });
  result.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
