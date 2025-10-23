// Load saved data on page load
const API_BASE = 'https://aitranslator-extension.vercel.app/';

document.addEventListener('DOMContentLoaded', function() {
    const toneSelect = document.getElementById('toneSelect');
    const sourceLangSelect = document.getElementById('sourceLang');
    const targetLangSelect = document.getElementById('targetLang');
    const inputText = document.getElementById('inputText');
    const translateBtn = document.getElementById('translateBtn');
    const outputText = document.getElementById('outputText');
    const inputCharCount = document.getElementById('inputCharCount');
    const outputCharCount = document.getElementById('outputCharCount');
    
    // Load last translation if available
    const lastOriginal = localStorage.getItem('lastOriginal');
    const lastTranslated = localStorage.getItem('lastTranslated');
    if (lastOriginal && lastTranslated) {
        inputText.value = lastOriginal;
        outputText.value = lastTranslated;
        updateCharCount(inputText, inputCharCount);
        updateCharCount(outputText, outputCharCount);
    }

    // Char count function
    function updateCharCount(textarea, countElement) {
        countElement.textContent = `${textarea.value.length} characters`;
    }

    // Input char count
    inputText.addEventListener('input', function() {
        updateCharCount(inputText, inputCharCount);
    });

    // Load saved tone
    const savedTone = localStorage.getItem('selectedTone') || 'Formal';
    toneSelect.value = savedTone;
    toneSelect.addEventListener('change', function() {
        localStorage.setItem('selectedTone', this.value);
    });

    // Translate
    translateBtn.addEventListener('click', async function() {
        const text = inputText.value.trim();
        if (!text) {
            alert('Please enter text to translate.');
            return;
        }

        let sourceLang = sourceLangSelect.value;
        if (sourceLang === 'Auto') {
            sourceLang = 'Russian'; // Default for automatic detection
        }
        const targetLang = targetLangSelect.value;
        const tone = toneSelect.value;

        // DEBUG: Log all parameters before validation
        // DEBUG: Log all parameters before validation
        // console.log('=== TRANSLATION DEBUG START ===');
        // console.log('Input text length:', text.length);
        // console.log('Source language:', sourceLang);
        // console.log('Target language:', targetLang);
        // console.log('Tone:', tone);
        // console.log('Source === Target?', sourceLang === targetLang);

        if (sourceLang === targetLang) {
            // console.log('Skipping translation - source and target languages are the same');
            outputText.value = text;
            updateCharCount(outputText, outputCharCount);
            return;
        }

        try {
            // DEBUG: Log the exact request being sent
            // const requestPayload = {
            //     text: text,
            //     sourceLang: sourceLang,
            //     targetLang: targetLang,
            //     tone: tone
            // };
            //
            // console.log('Starting translation fetch to', `${API_BASE}/api/translate`, 'with FULL payload:', JSON.stringify(requestPayload, null, 2));
            // console.log('Request URL:', `${API_BASE}/api/translate`);
            // console.log('Request headers:', {
            //     'Content-Type': 'application/json'
            // });

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
                    tone: tone
                })
            });

            // DEBUG: Log response details
            // console.log('Fetch response status:', response.status);
            // console.log('Fetch response headers:', Object.fromEntries(response.headers.entries()));
            
            const responseText = await response.text();
            // console.log('Raw response body:', responseText);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${responseText}`);
            }
            
            const data = JSON.parse(responseText);
            // console.log('Parsed response data:', data);
            
            if (!data || !data.translation) {
                console.error('Invalid response format - missing translation field');
                throw new Error('Invalid response format: missing translation field');
            }
            
            const translation = data.translation.trim();
            // console.log('Final translation:', translation);
            
            outputText.value = translation;
            updateCharCount(outputText, outputCharCount);
            
            // Save last translation
            localStorage.setItem('lastOriginal', text);
            localStorage.setItem('lastTranslated', translation);
            
            // console.log('Translation successful');
            // console.log('=== TRANSLATION DEBUG END ===');
        } catch (error) {
            // console.error('=== TRANSLATION ERROR DEBUG START ===');
            // console.error('Detailed fetch error:', error);
            // console.error('Error message:', error.message);
            // console.error('Error stack:', error.stack);
            // if (error.cause) console.error('Error cause:', error.cause);
            // console.error('=== TRANSLATION ERROR DEBUG END ===');
            
            outputText.value = `Error: ${error.message}`;
            updateCharCount(outputText, outputCharCount);
            alert(`Translation failed: ${error.message}`);
        } finally {
            translateBtn.disabled = false;
            translateBtn.textContent = 'Translate';
        }
    });
});