document.addEventListener('DOMContentLoaded', function() {
  // Get browser language
  const browserLang = navigator.language || navigator.userLanguage;
  
  const translations = {
    'Chinese': {
      title: '翻译设置',
      label: '目标语言：'
    },
    'English': {
      title: 'Translation Settings',
      label: 'Target Language:'
    },
    'Japanese': {
      title: '翻訳設定',
      label: '対象言語：'
    },
    'Korean': {
      title: '번역 설정',
      label: '대상 언어:'
    }
  };

  // Get target language from storage
  chrome.storage.sync.get(['targetLanguage'], function(result) {
    // Use stored language or default to browser language
    const currentLang = translations[result.targetLanguage] || 
                          translations[browserLang] || 
                          translations['English'];  
    
    // Set interface text
    document.querySelector('h3').textContent = currentLang.title;
    document.querySelector('label').textContent = currentLang.label;

    // Set the value of the select box
    if (result.targetLanguage) {
      document.getElementById('targetLanguage').value = result.targetLanguage;
    }
  });

  // Listen for language selection changes
  document.getElementById('targetLanguage').addEventListener('change', function(e) {
    const newLanguage = e.target.value;
    
    // Save new language setting
    chrome.storage.sync.set({
      targetLanguage: newLanguage
    }, function() {
      console.log('Target language saved:', newLanguage);
      
      // Update interface text
      const currentLang = translations[newLanguage];
      if (currentLang) {
        document.querySelector('h3').textContent = currentLang.title;
        document.querySelector('label').textContent = currentLang.label;
      }

          });
        });
      });

