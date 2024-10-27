function createInlineTranslation(text, isLongText = false) {
    const card = document.createElement('div');
    card.className = 'translation-card';
    
    let baseStyles = `
        position: absolute;
        padding: 10px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 14px;
        line-height: 1.4;
        cursor: pointer;
    `;

    if (isLongText) {
        baseStyles += `
            max-width: 600px;
            max-height: 400px;
            overflow-y: auto;
        `;
    } else {
        baseStyles += `
            max-width: 300px;
        `;
    }

    card.style.cssText = baseStyles;
    
    const textContent = document.createElement('div');
    textContent.textContent = text;
    card.appendChild(textContent);
    
    card.addEventListener('click', () => card.remove());
    
    return card;
}

function updateCardPosition(card, element) {
    let x, y;
    
    if (element instanceof Element) {
        const rect = element.getBoundingClientRect();
        x = rect.left;
        y = rect.bottom;
    } else {
        x = element.x;
        y = element.y;
    }

    const rect = card.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = x;
    let top = y + 10;
    
    if (left + rect.width > viewportWidth) {
        left = viewportWidth - rect.width - 10;
    }
    
    if (top + rect.height > viewportHeight) {
        top = y - rect.height - 10; 
    }

    if (left < 0) {
        left = 10;
    }
    
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
}


function isLongText(text) {
    return text.length > 20; 
}
