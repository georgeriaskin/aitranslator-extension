// Load saved data on page load
document.addEventListener('DOMContentLoaded', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const saveApiKeyBtn = document.getElementById('saveApiKey');
    const modelSelect = document.getElementById('modelSelect');
    const newModelInput = document.getElementById('newModel');
    const addModelBtn = document.getElementById('addModel');
    const sourceLangSelect = document.getElementById('sourceLang');
    const targetLangSelect = document.getElementById('targetLang');
    const inputText = document.getElementById('inputText');
    const translateBtn = document.getElementById('translateBtn');
    const outputText = document.getElementById('outputText');
    const settingsGear = document.getElementById('settingsGear');
    const closeModal = document.getElementById('closeModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const inputCharCount = document.getElementById('inputCharCount');
    const outputCharCount = document.getElementById('outputCharCount');

    // Modal events
    settingsGear.addEventListener('click', function() {
        document.getElementById('settingsModal').style.display = 'block';
    });

    closeModal.addEventListener('click', function() {
        document.getElementById('settingsModal').style.display = 'none';
    });

    modalOverlay.addEventListener('click', function() {
        document.getElementById('settingsModal').style.display = 'none';
    });

    // Char count function
    function updateCharCount(textarea, countElement) {
        countElement.textContent = `${textarea.value.length} characters`;
    }

    // Input char count
    inputText.addEventListener('input', function() {
        updateCharCount(inputText, inputCharCount);
    });

    // Load API key
    const savedApiKey = localStorage.getItem('openrouter_api_key');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
    }

    // Pre-populate models
    let models = JSON.parse(localStorage.getItem('openrouter_models')) || [
        'deepseek/deepseek-chat-v3.1:free',
        'openai/gpt-3.5-turbo',
        'anthropic/claude-3-haiku'
    ];

    // Load models into select
    function loadModels() {
        modelSelect.innerHTML = '';
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model.split('/').pop().replace(/:free$/, '') || model;
            modelSelect.appendChild(option);
        });
    }
    loadModels();

    // Save API key
    saveApiKeyBtn.addEventListener('click', function() {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('openrouter_api_key', apiKey);
            alert('API key saved!');
        } else {
            alert('Please enter an API key.');
        }
    });

    // Add new model
    addModelBtn.addEventListener('click', function() {
        const newModel = newModelInput.value.trim();
        if (newModel && !models.includes(newModel)) {
            models.push(newModel);
            localStorage.setItem('openrouter_models', JSON.stringify(models));
            loadModels();
            newModelInput.value = '';
            alert('Model added!');
        } else if (models.includes(newModel)) {
            alert('Model already exists.');
        } else {
            alert('Please enter a valid model name.');
        }
    });

    // Translate
    translateBtn.addEventListener('click', async function() {
        const apiKey = localStorage.getItem('openrouter_api_key');
        if (!apiKey) {
            alert('Please save your API key first.');
            return;
        }

        const text = inputText.value.trim();
        if (!text) {
            alert('Please enter text to translate.');
            return;
        }

        let sourceLang = sourceLangSelect.value;
        if (sourceLang === 'Automatic') {
            sourceLang = 'Russian'; // Default for automatic detection
        }
        const targetLang = targetLangSelect.value;
        const model = modelSelect.value;

        if (sourceLang === targetLang) {
            outputText.value = text;
            updateCharCount(outputText, outputCharCount);
            return;
        }

        // System prompt for rules
        const systemPrompt = `You are a professional human translator.
Translate the following text from ${sourceLang} into ${targetLang} following these rules:

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

        try {
            translateBtn.disabled = true;
            translateBtn.textContent = 'Translating...';

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
                console.error('API Error Details:', errorText);
                throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            const translation = data.choices[0].message.content.trim();

            outputText.value = translation;
            updateCharCount(outputText, outputCharCount);
        } catch (error) {
            console.error(error);
            outputText.value = `Error: ${error.message}`;
            alert(`Translation failed: ${error.message}`);
        } finally {
            translateBtn.disabled = false;
            translateBtn.textContent = 'Translate';
        }
    });
});