function saveOptions() {
  const apiKey = document.getElementById('apiKey').value;
  const modelSelect = document.getElementById('modelName');
  let modelName = modelSelect.value;
  
  // Check if the model name is custom
  if (modelName === 'custom') {
    modelName = document.getElementById('customModel').value.trim();
    if (!modelName) {
      document.getElementById('status').textContent = 'Input the Model Name ';
      return;
    }
  }

  // Print values before saving to confirm data is correct
  console.log('Saving settings:', {
    apiKey: apiKey ? '***' : undefined,
    modelName: modelName
  });

  chrome.storage.sync.set({
    apiKey: apiKey,
    modelName: modelName
  }, function() {
    // Verify if the modelName is saved successfully
    chrome.storage.sync.get(['modelName'], function(result) {
      console.log('Verified saved modelName:', result.modelName);
    });

    document.getElementById('status').textContent = 'Setting has already saved';
    setTimeout(() => {
      document.getElementById('status').textContent = '';
    }, 2000);
  });
}


document.addEventListener('DOMContentLoaded', function() {
  const modelSelect = document.getElementById('modelName');
  const customModelInput = document.getElementById('customModel');
  const statusElement = document.getElementById('status');

  modelSelect.addEventListener('change', function() {
    if (this.value === 'custom') {
      customModelInput.style.display = 'block';
      customModelInput.focus();
    } else {
      customModelInput.style.display = 'none';
    }
  });

  chrome.storage.sync.get(['apiKey', 'modelName'], function(result) {
    if (!result.modelName) {
      // Show clear error message, prompting user to set a model
      statusElement.textContent = 'Please select a model and save settings before using the extension';
      statusElement.style.color = 'red';
      return;
    }
    
    const predefinedModel = Array.from(modelSelect.options).find(option => 
      option.value === result.modelName
    );
    
    if (predefinedModel) {
      modelSelect.value = result.modelName;
    } else {
      modelSelect.value = 'custom';
      customModelInput.style.display = 'block';
      customModelInput.value = result.modelName;
    }
  });

  const saveButton = document.getElementById('save');
  if (saveButton) {
    saveButton.addEventListener('click', saveOptions);
    console.log('Save button listener added');
  } else {
    console.error('Save button not found');
  }
});
