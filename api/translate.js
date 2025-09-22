export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, sourceLang, targetLang, model } = req.body;

    if (!text || !targetLang || !model) {
      return res.status(400).json({ error: 'Missing required fields: text, targetLang, model' });
    }

    let effectiveSourceLang = sourceLang;
    if (sourceLang === 'Automatic') {
      effectiveSourceLang = 'Russian'; // Default for automatic detection
    }

    if (effectiveSourceLang === targetLang) {
      return res.status(200).json({ translation: text });
    }

    // System prompt for rules
    const systemPrompt = `You are a professional human translator.
Translate the following text from ${effectiveSourceLang} into ${targetLang} following these rules:

1. Use simple, natural, human-like language.
2. Avoid formal or bureaucratic style — no overcomplicated phrasing, no official tone.
3. The translation must sound friendly, polite, and conversational.
4. Always make the text feel as if it were originally written by a native ${targetLang} speaker.
5. Use natural contractions (don't, can't, it's, etc.) where appropriate.
6. Do not translate word-for-word. Preserve the meaning, but adapt idioms and phrases naturally.
7. Never use “—” (em dash). Use shorter dashes or commas if needed.
8. Avoid robotic or AI-like tone.
9. Do not include explanations or extra text — return only the translation.
10. Adapt the style depending on context (marketing, blog, UI text, customer support, technical).`;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error:', errorText);
      return res.status(response.status).json({ error: `API error: ${response.statusText}` });
    }

    const data = await response.json();
    const translation = data.choices[0].message.content.trim();

    res.status(200).json({ translation });
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}