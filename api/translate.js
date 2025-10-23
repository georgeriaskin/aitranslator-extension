export default async function handler(req, res) {
  console.log('=== API DEBUG START ===');
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  console.log('Raw request body:', req.body);
  
  if (req.method !== 'POST') {
    console.log('Method not allowed - rejecting with 405');
    console.log('=== API DEBUG END ===');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, sourceLang, targetLang, tone } = req.body;

    // DEBUG: Log each parameter individually
    console.log('=== PARAMETER VALIDATION DEBUG ===');
    console.log('Text received:', text ? `Present (${text.length} chars)` : 'MISSING');
    console.log('Source language received:', sourceLang);
    console.log('Target language received:', targetLang);
    console.log('Tone received:', tone);
    
    // Check for missing required fields
    const missingFields = [];
    if (!text) missingFields.push('text');
    if (!targetLang) missingFields.push('targetLang');
    if (!tone) missingFields.push('tone');
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      console.log('=== API DEBUG END ===');
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}`,
        received: {
          text: text ? `Present (${text.length} chars)` : 'MISSING',
          sourceLang: sourceLang,
          targetLang: targetLang,
          tone: tone
        }
      });
    }

    let effectiveSourceLang = sourceLang;
    if (sourceLang === 'Automatic' || sourceLang === 'Auto') {
      effectiveSourceLang = 'Russian'; // Default for automatic detection
    }

    console.log('Effective source language:', effectiveSourceLang);
    console.log('Target language:', targetLang);
    console.log('Languages match?', effectiveSourceLang === targetLang);

    if (effectiveSourceLang === targetLang) {
      console.log('Skipping translation - source and target languages are the same');
      console.log('=== API DEBUG END ===');
      return res.status(200).json({ translation: text });
    }

    // System prompt for rules with tone
    const toneInstructions = {
        'Formal': 'Use formal, professional language with proper grammar and structure. Avoid contractions and maintain a respectful, authoritative tone.',
        'Casual': 'Use informal, conversational language with contractions and casual expressions. Make it sound like natural everyday speech.',
        'Professional': 'Use business-appropriate language that is clear, concise, and professional. Maintain a polished tone suitable for business communication.',
        'Friendly': 'Use warm, approachable language with a positive and welcoming tone. Include polite expressions and maintain a helpful demeanor.',
        'Academic': 'Use scholarly language with precise terminology, formal structure, and objective tone. Maintain academic rigor and proper citations.',
        'Conversational': 'Use natural, flowing language as if speaking directly to someone. Include rhetorical questions and engaging expressions.',
        'Technical': 'Use precise technical terminology with clear explanations. Maintain accuracy and provide detailed technical information.'
    };

    const toneInstruction = toneInstructions[tone] || toneInstructions['Formal'];
    
    const systemPrompt = `You are a professional human translator.
Translate the following text from ${effectiveSourceLang} into ${targetLang} following these rules:

${toneInstruction}

Additional translation rules:
1. Always make the text feel as if it were originally written by a native ${targetLang} speaker.
2. Do not translate word-for-word. Preserve the meaning, but adapt idioms and phrases naturally.
3. Never use "—" (em dash). Use shorter dashes or commas if needed.
4. Do not include explanations or extra text — return only the translation.
5. Adapt the style appropriately for the specified tone.`;

    console.log('System prompt prepared for:', effectiveSourceLang, '->', targetLang, 'with tone:', tone);

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.log('OpenRouter API key missing');
      console.log('=== API DEBUG END ===');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('Calling OpenRouter API...');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen/qwen3-235b-a22b:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    console.log('OpenRouter API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error:', errorText);
      console.log('=== API DEBUG END ===');
      return res.status(response.status).json({ error: `API error: ${response.statusText}` });
    }

    const data = await response.json();
    const translation = data.choices[0].message.content.trim();
    
    console.log('Translation received from OpenRouter:', translation);
    console.log('=== API DEBUG END ===');

    res.status(200).json({ translation });
  } catch (error) {
    console.error('=== API ERROR DEBUG START ===');
    console.error('Handler error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('=== API ERROR DEBUG END ===');
    
    console.log('=== API DEBUG END ===');
    res.status(500).json({ error: 'Internal server error' });
  }
}