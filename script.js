// Load saved data on page load
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
        'openai/gpt-3.5-turbo',
        'anthropic/claude-3-haiku'
    ];

    // Load models into select
    function loadModels() {
        modelSelect.innerHTML = '';
        const customNames = {
            'deepseek/deepseek-chat-v3.1:free': 'DeepSeek V3.1 (Free)',
            'openai/gpt-3.5-turbo': 'GPT-3.5 Turbo',
            'anthropic/claude-3-haiku': 'Claude 3 Haiku'
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
            translateBtn.disabled = true;
            translateBtn.textContent = 'Translating...';

            const response = await fetch('/api/translate', {
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

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error Details:', errorData);
                throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const translation = data.translation.trim();

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