// Cloudflare Pages Function: POST /api/post
// Needs an AI binding named "AI" (Pages project → Settings → Functions → AI bindings).
// Workers AI has a free daily allowance, so this works without paying.

const STYLES = ['тёплый', 'деловой', 'дружеский', 'вдохновляющий'];

const SYSTEM =
  'Ты помогаешь писать короткие посты на русском языке для личного блога. ' +
  'Пиши живо и по-человечески, без пафоса и штампов. ' +
  'Не придумывай факты, цифры, награды и истории. ' +
  'Не давай медицинских, финансовых и юридических советов. ' +
  'Ответ — только текст поста, без заголовков, пояснений и кавычек вокруг текста. ' +
  'Объём — примерно 60–120 слов.';

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Некорректный запрос' }, 400);
  }

  const topic = String(body?.topic ?? '').trim().slice(0, 300);
  const style = STYLES.includes(body?.style) ? body.style : 'тёплый';

  if (!topic) return json({ error: 'Напишите тему поста' }, 400);
  if (!env.AI) return json({ error: 'Нейросеть не подключена' }, 503);

  try {
    const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `Тема: ${topic}\nСтиль: ${style}` },
      ],
      max_tokens: 350,
    });
    const text = String(result?.response ?? '').trim();
    if (!text) return json({ error: 'Пустой ответ' }, 502);
    return json({ text });
  } catch {
    return json({ error: 'Нейросеть временно недоступна' }, 503);
  }
                           }
