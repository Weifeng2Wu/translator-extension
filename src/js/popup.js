document.addEventListener('DOMContentLoaded', function() {
  // Get browser language
  const browserLang = navigator.language || navigator.userLanguage;
  const langElement = document.getElementById('browser-lang');
  
  // Set the language of the target language label
  if (browserLang === 'zh-CN') {
    langElement.textContent = '目标语言:';
  } else if (browserLang === 'ja') {
    langElement.textContent = '対象言語:';
  } else if (browserLang === 'ko') {
    langElement.textContent = '대상 言語:';
  } else {
    langElement.textContent = 'Target Language:';
  }

  // Get the target language select element
  const targetLanguageSelect = document.getElementById('targetLanguage');
  
  // Set the default option based on the browser language
  if (browserLang.startsWith('zh')) {
    targetLanguageSelect.value = 'Chinese';
  } else if (browserLang.startsWith('ja')) {
    targetLanguageSelect.value = 'Japanese';
  } else if (browserLang.startsWith('ko')) {
    targetLanguageSelect.value = 'Korean';
  } else {
    targetLanguageSelect.value = 'English';
  }

  // Save the user's selected language
  targetLanguageSelect.addEventListener('change', function(e) {
    const selectedLanguage = e.target.value;
    // If you need to save the selected language, you can use chrome.storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({
        targetLanguage: selectedLanguage
      }, function() {
        console.log('Language preference saved:', selectedLanguage);
      });
    }
  });

  // Load the previously saved language selection (if any)
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(['targetLanguage'], function(result) {
      if (result.targetLanguage) {
        targetLanguageSelect.value = result.targetLanguage;
      }
    });
  }
});
