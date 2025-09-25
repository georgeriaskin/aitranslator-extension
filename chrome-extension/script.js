// Load saved data on page load
const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', function() {
    const modelSelect = document.getElementById('modelSelect');
    const sourceLangSelect = document.getElementById('sourceLang');
    const targetLangSelect = document.getElementById('targetLang');
    const inputText = document.getElementById('inputText');
    const translateBtn = document.getElementById('translateBtn');
    const outputText = document.getElementById('outputText');
    const inputCharCount = document.getElementById('inputCharCount');
    const outputCharCount = document.getElementById('outputCharCount');

    // Char count function
    function updateCharCount(textarea, countElement) {
        countElement.textContent = `${textarea.value.length} characters`;
    }

    // Input char count
    inputText.addEventListener('input', function() {
        updateCharCount(inputText, inputCharCount);
    });

 
    // Pre-populate models
    let models = JSON.parse(localStorage.getItem('openrouter_models')) || [
        'deepseek/deepseek-chat-v3.1:free',
        'x-ai/grok-4-fast:free',
        'qwen/qwen3-235b-a22b:free',
        'google/gemini-2.0-flash-exp:free',
        'mistralai/mistral-small-3.2-24b-instruct:free',
        'meta-llama/llama-4-maverick:free'
    ];

    // Load models into select
    function loadModels() {
        modelSelect.innerHTML = '';
        const customNames = {
            'deepseek/deepseek-chat-v3.1:free': 'DeepSeek V3.1',
            'x-ai/grok-4-fast:free': 'Grok 4 Fast',
            'qwen/qwen3-235b-a22b:free': 'Qwen 3',
            'google/gemini-2.0-flash-exp:free': 'Gemini 2.0',
            'mistralai/mistral-small-3.2-24b-instruct:free': 'Mistral Small',
            'meta-llama/llama-4-maverick:free': 'Llama 4 Maverick'
        };
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = customNames[model] || model.split('/').pop().replace(/:free$/, '') || model;
            modelSelect.appendChild(option);
        });
    }
    loadModels();

 
    // Translate
    translateBtn.addEventListener('click', async function() {
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

        try {
            console.log('Starting translation fetch to', `${API_BASE}/api/translate`, 'with payload:', { text: text.substring(0, 50) + '...', sourceLang, targetLang, model });

            translateBtn.disabled = true;
            translateBtn.textContent = 'Translating...';

            outputText.value = '';
            updateCharCount(outputText, outputCharCount);

            const response = await fetch(`${API_BASE}/api/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    sourceLang: sourceLang,
                    targetLang: targetLang,
                    model: model
                })
            });

            console.log('Fetch response status:', response.status, 'text preview:', (await response.text()).substring(0, 100));

            const responseText = await response.text();
            if (!response.ok || !responseText.startsWith('{')) {
                if (responseText.includes('<!DOCTYPE')) {
                    alert('Translation API unavailable locally...');
                    outputText.value = '';
                    updateCharCount(outputText, outputCharCount);
                    return;
                } else {
                    try {
                        const errorData = JSON.parse(responseText);
                        throw new Error(errorData.error || `API error: ${response.status}`);
                    } catch (parseErr) {
                        throw new Error(`Invalid response: ${response.status}`);
                    }
                }
            }
            try {
                const data = JSON.parse(responseText);
                if (!data || !data.translation) {
                    throw new Error('Invalid response format');
                }
                const translation = data.translation.trim();
                outputText.value = translation;
                updateCharCount(outputText, outputCharCount);
            } catch (parseErr) {
                console.error('Parse error:', parseErr);
                throw new Error('Invalid JSON response from API');
            }
        } catch (error) {
            console.error('Detailed fetch error:', error);
            console.error('Error message:', error.message);
            if (error.cause) console.error('Error cause:', error.cause);
            outputText.value = `Error: ${error.message}`;
            updateCharCount(outputText, outputCharCount);
            alert(`Translation failed: ${error.message}`);
        } finally {
            translateBtn.disabled = false;
            translateBtn.textContent = 'Translate';
        }
    });
});