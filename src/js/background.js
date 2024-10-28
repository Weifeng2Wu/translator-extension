chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        if (isInjectablePage(tab.url)) {
            chrome.storage.sync.get(['apiKey'], function(result) {
                if (result.apiKey) {
                    chrome.tabs.sendMessage(tabId, {
                        action: "setupTranslation",
                        apiKey: result.apiKey,
                        modelName: result.modelName 
                    }).catch(err => console.log('Tab not ready yet:', err));
                }
            });
        }
    }
});

// Create Menu
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "translateSelection",
        title: "Translate Selected",
        contexts: ["selection"]
    });
    chrome.contextMenus.create({
        id: "translatePage",
        title: "Translate Whole Page",
        contexts: ["page"]
    });
});


chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab || typeof tab.id !== 'number' || tab.id < 0) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'Error',
            message: 'Failed to retrieve information for the current tab.'
        });
        return;
    }

    chrome.storage.sync.get(['apiKey', 'modelName'], function(result) {
        if (!result.apiKey) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon.png',
                title: 'Error ',
                message: 'Please Setting API Key'
            });
            return;
        }

        if (info.menuItemId === "translateSelection") {
            chrome.tabs.sendMessage(tab.id, {
                action: "translateSelection",
                text: info.selectionText,
                apiKey: result.apiKey,
                modelName: result.modelName
            }).catch(err => console.log('Failed to send message:', err));
        } else if (info.menuItemId === "translatePage") {
            chrome.tabs.sendMessage(tab.id, {
                action: "translatePage",
                apiKey: result.apiKey,
                modelName: result.modelName
            }).catch(err => console.log('Failed to send message:', err));
        }
    });
});

function isInjectablePage(url) {
    try {
        const urlObj = new URL(url);
        return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
        return false;
    }
}