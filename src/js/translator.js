chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    chrome.storage.sync.get(['apiKey', 'modelName'], function(result) {
        switch(request.action) {
            case "setupTranslation":
                setupAutoTranslation(result.apiKey, result.modelName);
                break;
            case "translateSelection":
                handleTranslation(
                    request.text, 
                    document.activeElement, 
                    result.apiKey, 
                    result.modelName,
                    true
                );
                break;
            case "translatePage":
                translateFullPage(result.apiKey, result.modelName);
                break;
        }
    });
    return true;
});

function setupAutoTranslation(apiKey, modelName) {
    if (window.translationInitialized) return;
    window.translationInitialized = true;

    const fontStyle = document.createElement('style');
    fontStyle.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap');
        .translation-card, .inline-translation {
            font-family: 'Noto Sans', sans-serif;
        }
    `;
    document.head.appendChild(fontStyle);

    document.addEventListener('keydown', async (e) => {
        if (e.key === '`' || e.code === 'Backquote' || e.code === '·') {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;

            const text = selection.toString().trim();
            if (!text) return;

            const range = selection.getRangeAt(0);
            const element = range.commonAncestorContainer;
            const parentElement = element.nodeType === 3 ? element.parentElement : element;

            if (parentElement.classList.contains('inline-translation') || 
                parentElement.closest('.inline-translation')) {
                return;
            }

            await handleTranslation(text, parentElement, apiKey, modelName, true, text.length > 50);
        }
    });
}

async function handleTranslation(text, element, apiKey, modelName, isInline, isInlineTranslation) {
    try {
        const translatedText = await translateText(text, apiKey, modelName);
        if (!translatedText) return;

        const container = document.createElement('div');
        container.className = 'translation-container';

        const originalContent = element.innerHTML;
        const originalDiv = document.createElement('div');
        originalDiv.className = 'original-text';
        originalDiv.innerHTML = originalContent;
        container.appendChild(originalDiv);

        const translationElement = document.createElement('div');
        translationElement.className = 'inline-translation';
        translationElement.textContent = translatedText;
        
        translationElement.addEventListener('dblclick', function() {
            this.style.display = 'none';
        });

        container.appendChild(translationElement);

        element.innerHTML = '';
        element.appendChild(container);

    } catch (error) {
        console.error('Translation error:', error);
    }
}

function showTranslation(translatedText, element, isInline) {
    if (isInline) {
        const translationDiv = createInlineTranslation(element);
        translationDiv.textContent = translatedText;
        element.insertAdjacentElement('afterend', translationDiv);
    } else {
        try {
            const selection = window.getSelection();
            let rect;
            
            if (selection.rangeCount > 0) {
                rect = selection.getRangeAt(0).getBoundingClientRect();
            } else {
                rect = element.getBoundingClientRect();
            }
            
            const card = document.createElement('div');
            card.className = 'translation-card';
            card.style.cssText = `
                position: fixed;
                left: ${rect.left + window.scrollX}px;
                top: ${rect.bottom + window.scrollY + 5}px;
                min-width: 200px;
                max-width: 300px;
                padding: 12px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                z-index: 999999;
                font-size: 14px;
                line-height: 1.5;
                cursor: pointer;
                opacity: 1;
                visibility: visible;
                display: block;
            `;

            card.textContent = translatedText;
            card.addEventListener('click', () => card.remove());
            document.body.appendChild(card);

            const cardRect = card.getBoundingClientRect();
            if (cardRect.right > window.innerWidth) {
                card.style.left = `${Math.max(0, window.innerWidth - cardRect.width - 20)}px`;
            }
            if (cardRect.bottom > window.innerHeight) {
                card.style.top = `${rect.top - cardRect.height - 5}px`;
            }
        } catch (error) {
            console.error('Error showing translation card:', error);
        }
    }
}

function createInlineTranslation(element) {
    const translationDiv = document.createElement(element.tagName);
    
    translationDiv.className = element.className;
    Array.from(element.attributes).forEach(attr => {
        if (attr.name !== 'class') {
            translationDiv.setAttribute(attr.name, attr.value);
        }
    });
    
    translationDiv.classList.add('inline-translation');
    
    const computedStyle = window.getComputedStyle(element);
    for (let style of computedStyle) {
        try {
            translationDiv.style[style] = computedStyle[style];
        } catch (e) {
            console.error('Failed to set style:', style);
        }
    }

    translationDiv.style.cssText += `
        border-left: 2px solid #4CAF50;
        padding-left: 8px;
        margin-top: 4px;
        min-height: 0;
        height: auto;
        box-sizing: content-box;
    `;

    // double click to hide translation
    translationDiv.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        translationDiv.style.display = 'none';
    });

    return translationDiv;
}

async function getCurrentLanguage() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['targetLanguage'], function(result) {
            resolve(result.targetLanguage || 'Chinese');
        });
    });
}
// Add this new function
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background-color: #333;
        color: white;
        border-radius: 4px;
        font-family: 'Noto Sans', sans-serif;
        font-size: 14px;
        z-index: 999999;
        opacity: 0;
        transition: opacity 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Fade in
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}


// translate text
async function translateText(text, apiKey, modelName) {
    try {
        const targetLanguage = await getCurrentLanguage();
        console.log('Current translation language:', targetLanguage);

        // Simple language detection based on first few characters
        const isChineseText = /[\u4e00-\u9fa5]/.test(text.substring(0, 10));
        const isEnglishText = text.substring(0, 50).split('')
            .filter(char => /[a-zA-Z]/.test(char)).length > 
            text.substring(0, 50).split('')
            .filter(char => /[^\s\.,!?'";\-]/.test(char)).length * 0.5;
        const isJapaneseText = /[\u3040-\u309F\u30A0-\u30FF\u31F0-\u31FF]/.test(text.substring(0, 10));
        const isKoreanText = /[\uAC00-\uD7AF\u1100-\u11FF]/.test(text.substring(0, 10));

        // Skip translation if language matches target, but show notification
        if ((targetLanguage.toLowerCase() === 'chinese' && isChineseText) ||
            (targetLanguage.toLowerCase() === 'english' && isEnglishText) ||
            (targetLanguage.toLowerCase() === 'japanese' && isJapaneseText) ||
            (targetLanguage.toLowerCase() === 'korean' && isKoreanText)) {
            console.log('Source and target languages are the same, skipping translation');
            
            // Show notification
            showNotification(`Selected text is already in ${targetLanguage}, no translation needed.`);
            return null;
        }

        // Proceed with translation
        const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    {
                        "role": "system",
                        "content": `Translate the following text into ${targetLanguage} while ensuring it remains natural and fluent. Please avoid using any non-standard characters or formats.`
                    },
                    {
                        "role": "user",
                        "content": text
                    }
                ]
            })
        });

        const data = await response.json();
        if (data.choices?.[0]?.message?.content) {
            return data.choices[0].message.content;
        }
        return null;
    } catch (error) {
        console.error('Translation API error:', error);
        throw error;
    }
}

async function translateFullPage(apiKey, modelName) {
    if (document.body.getAttribute('data-translated')) return;
    document.body.setAttribute('data-translated', 'true');
    
    // Get the main content elements
    const elements = Array.from(document.querySelectorAll('p, article p, .content p, main p, .post-content p, .article-content p'))
        .filter(element => {
            if (element.closest('.translation-card, .inline-translation, script, style, header, nav, code, pre')) {
                return false;
            }
            const text = element.textContent.trim();
            return text.length > 10;
        });

    // Create progress bar
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 4px;
        background: #f0f0f0;
        z-index: 999999;
    `;

    const progress = document.createElement('div');
    progress.style.cssText = `
        width: 0%;
        height: 100%;
        background: #4CAF50;
        transition: width 0.3s ease;
    `;

    progressBar.appendChild(progress);
    document.body.appendChild(progressBar);

    // Parallel translation, process multiple paragraphs at a time
    const BATCH_SIZE = 4;  // Number of paragraphs to translate at once
    const DELAY = 500;     // Delay time reduced to 500ms
    let currentIndex = 0;
    const total = elements.length;

    async function translateBatch() {
        if (currentIndex >= total) {
            progressBar.remove();
            return;
        }

        // Create a batch of translation tasks
        const batch = [];
        for (let i = 0; i < BATCH_SIZE && currentIndex + i < total; i++) {
            const element = elements[currentIndex + i];
            const text = element.textContent.trim();
            
            batch.push({
                element,
                text,
                promise: translateText(text, apiKey, modelName)
            });
        }

        try {
            // Parallel execution of all translations
            const results = await Promise.allSettled(batch.map(item => item.promise));
            
            // Process translation results
            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    const { element } = batch[index];
                    const translationDiv = createInlineTranslation(element);
                    translationDiv.textContent = result.value;
                    element.insertAdjacentElement('afterend', translationDiv);
                }
            });

            // Update progress
            currentIndex += batch.length;
            const percentage = (currentIndex / total) * 100;
            progress.style.width = `${percentage}%`;

            // Continue to translate the next batch
            setTimeout(translateBatch, DELAY);
        } catch (error) {
            console.error('Translation error:', error);
            currentIndex += batch.length;
            setTimeout(translateBatch, DELAY);
        }
    }

    // Start translation
    translateBatch();
}

