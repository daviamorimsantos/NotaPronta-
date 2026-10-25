export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'A IA ainda não está configurada. Configure OPENAI_API_KEY nas variáveis de ambiente do Vercel.' });
  const { topic, subject = '', grade = 'Ensino Médio', length = '5', style = 'immersive', instructions = '' } = req.body || {};
  if (typeof topic !== 'string' || topic.trim().length < 3) return res.status(400).json({ error: 'Informe um tema com pelo menos 3 caracteres.' });
  if (topic.length > 160 || String(instructions).length > 1200) return res.status(400).json({ error: 'O tema ou as orientações são muito longos.' });
  const slideCount = Number(length) >= 12 ? 10 : Number(length) >= 8 ? 8 : Number(length) >= 5 ? 7 : 5;
  const prompt = `Você é um professor e designer de experiências educacionais para estudantes brasileiros. Crie uma apresentação interativa, correta e clara em português do Brasil. Público: ${grade}. Tema: ${topic.trim()}. Matéria: ${subject || 'não especificada'}. Duração: ${length} minutos. Estilo visual: ${style}. Orientações: ${instructions || 'nenhuma especificada'}. Gere exatamente ${slideCount} seções. Organize como capa, explicação conceitual, funcionamento/contexto, exemplo, análise/impacto, síntese, quiz com alternativas e encerramento conforme a quantidade permitir. Evite conteúdo genérico: explique o tema de fato. Não invente citações, estatísticas, fontes ou dados; se um dado depender de pesquisa, indique que precisa ser verificado. Use no máximo 3 pontos por seção, com títulos curtos e textos de 1-2 frases. Quiz deve ter 3-4 alternativas e apenas uma correta. Responda SOMENTE JSON no formato: {"slides":[{"type":"cover|concept|quiz|closing","kicker":"...","title":"...","subtitle":"...","points":[{"title":"...","text":"..."}],"visualLabel":"...","note":"...","question":"...","answers":[{"text":"...","correct":true}]}]}. Em cada seção, note pode ser uma dica de apresentação curta. Não use markdown.`;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Você cria materiais educacionais precisos. Siga o formato JSON solicitado. Não inclua HTML nem instruções executáveis.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.65,
        max_tokens: 4500
      })
    });
    const data = await response.json();
    if (!response.ok) {
      const message = data?.error?.message || 'O serviço de IA não respondeu corretamente.';
      return res.status(response.status === 401 ? 502 : 502).json({ error: `Falha ao gerar conteúdo com IA: ${message}` });
    }
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return res.status(502).json({ error: 'A IA retornou uma resposta vazia. Tente novamente.' });
    let parsed;
    try { parsed = JSON.parse(content); } catch { return res.status(502).json({ error: 'A IA retornou um formato inesperado. Tente novamente.' }); }
    if (!Array.isArray(parsed.slides) || parsed.slides.length < 3) return res.status(502).json({ error: 'A apresentação veio incompleta. Tente gerar novamente.' });
    const clean = parsed.slides.slice(0, 12).map(s => ({
      type: ['cover','concept','quiz','closing'].includes(s.type) ? s.type : 'concept',
      kicker: cleanText(s.kicker, 80), title: cleanText(s.title, 180), subtitle: cleanText(s.subtitle, 500),
      points: Array.isArray(s.points) ? s.points.slice(0,4).map(p => typeof p === 'string' ? { title: 'Ponto importante', text: cleanText(p, 500) } : ({ title: cleanText(p.title, 100), text: cleanText(p.text, 500) })) : [],
      visualLabel: cleanText(s.visualLabel, 80), note: cleanText(s.note, 500), question: cleanText(s.question, 300),
      answers: Array.isArray(s.answers) ? s.answers.slice(0,4).map(a => ({ text: cleanText(a.text, 220), correct: a.correct === true })) : []
    }));
    return res.status(200).json({ slides: clean, demo: false });
  } catch (error) {
    return res.status(500).json({ error: 'Erro de conexão com o serviço de IA. Confira a configuração do backend e tente novamente.' });
  }
}
function cleanText(value, max) { return typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim().slice(0, max) : ''; }
