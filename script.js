// Load saved data on page load
document.addEventListener('DOMContentLoaded', function() {
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