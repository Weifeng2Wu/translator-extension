document.addEventListener("DOMContentLoaded", function () {
  const translateProvide = document.getElementById("TranslateProvide");
  const apiKeyGroup = document.getElementById("apiKeyGroup");
  const modelNameGroup = document.getElementById("modelNameGroup");
  const modelSelect = document.getElementById("modelName");
  const customModelInput = document.getElementById("customModel");
  const statusElement = document.getElementById("status");
  const saveButton = document.getElementById('save');
  const resetButton = document.getElementById('reset');

  // 处理翻译提供者的变化
  translateProvide.addEventListener("change", function () {
      if (this.value === "SiliconFlow") {
          apiKeyGroup.style.display = "block";
          modelNameGroup.style.display = "block";
      } else {
          apiKeyGroup.style.display = "none";
          modelNameGroup.style.display = "none";
      }
  });

  // 初始化翻译提供者
  translateProvide.dispatchEvent(new Event("change"));

  // 处理模型选择的变化
  modelSelect.addEventListener("change", function () {
      customModelInput.style.display = this.value === "custom" ? "block" : "none";
      if (this.value !== "custom") {
          customModelInput.value = "";
      } else {
          customModelInput.focus();
      }
  });

  // 初始化模型选择
  chrome.storage.sync.get(['apiKey', 'modelName'], function (result) {
      if (!result.modelName) {
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

  // 保存设置
  function saveOptions() {
      const apiKey = document.getElementById('apiKey').value;
      let modelName = modelSelect.value;

      // 检查模��名称是否为自定义
      if (modelName === 'custom') {
          modelName = customModelInput.value.trim();
          if (!modelName) {
              statusElement.textContent = 'Input the Model Name ';
              return;
          }
      }

      chrome.storage.sync.set({
          apiKey: apiKey,
          modelName: modelName
      }, function () {
          chrome.storage.sync.get(['modelName'], function (result) {
              console.log('Verified saved modelName:', result.modelName);
          });

          statusElement.textContent = 'Setting has already saved';
          setTimeout(() => {
              statusElement.textContent = '';
          }, 2000);
      });
  }

  // 处理标签切换
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
      tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tabContents.forEach(content => content.classList.remove('active'));
          tab.classList.add('active');
          document.getElementById(tab.dataset.tab).classList.add('active');
      });
  });

  // 添加保存按钮的事件监听
  if (saveButton) {
      saveButton.addEventListener('click', saveOptions);
      console.log('Save button listener added');
  } else {
      console.error('Save button not found');
  }

  // 保存设置
  saveButton.addEventListener('click', function() {
      // 获取所有设置值
      const settings = {
          targetLanguage: document.getElementById('targetLanguage').value,
          translateProvider: document.getElementById('TranslateProvide').value,
          apiKey: document.getElementById('apiKey').value,
          modelName: document.getElementById('modelName').value === 'custom' 
              ? document.getElementById('customModel').value 
              : document.getElementById('modelName').value
      };

      // 验证必要的字段
      if (settings.translateProvider === 'SiliconFlow' && !settings.apiKey) {
          alert('Please enter your API Key');
          return;
      }

      // 使用 Chrome Storage API 保存设置
      if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.sync.set(settings, function() {
              // 显示保存成功消息
              showNotification('Settings saved successfully!');
          });
      } else {
          // 如果在非扩展环境中测试，使用 localStorage
          localStorage.setItem('translatorSettings', JSON.stringify(settings));
          showNotification('Settings saved successfully!');
      }
  });

  // 重置设置
  resetButton.addEventListener('click', function() {
      // 确认是否要重置
      if (confirm('Are you sure you want to reset all settings to default?')) {
          // 重置所有输入字段到默认值
          document.getElementById('targetLanguage').value = 'Chinese';
          document.getElementById('TranslateProvide').value = 'SiliconFlow';
          document.getElementById('apiKey').value = '';
          document.getElementById('modelName').value = 'THUDM/glm-4-9b-chat';
          document.getElementById('customModel').value = '';
          document.getElementById('customModel').style.display = 'none';

          // 触发 change 事件以更新UI
          document.getElementById('TranslateProvide').dispatchEvent(new Event('change'));
          document.getElementById('modelName').dispatchEvent(new Event('change'));

          // 清除存储的设置
          if (typeof chrome !== 'undefined' && chrome.storage) {
              chrome.storage.sync.clear(function() {
                  showNotification('Settings reset to default!');
              });
          } else {
              localStorage.removeItem('translatorSettings');
              showNotification('Settings reset to default!');
          }
      }
  });

  // 通知函数
  function showNotification(message) {
      const notification = document.createElement('div');
      notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 24px;
          background-color: #4CAF50;
          color: white;
          border-radius: 4px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          z-index: 1000;
          opacity: 0;
          transition: opacity 0.3s ease;
      `;
      notification.textContent = message;
      document.body.appendChild(notification);

      // 淡入效果
      setTimeout(() => {
          notification.style.opacity = '1';
      }, 10);

      // 3秒后淡出并移除
      setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => {
              notification.remove();
          }, 300);
      }, 3000);
  }

  // API Key 显示/隐藏功能
  const apiKeyInput = document.getElementById('apiKey');
  const apiKeyCheckbox = document.getElementById('apiKeyCheckbox');
  let realApiKey = ''; // 存储真实的 API Key

  // 函数：将文本转换为星号
  function maskApiKey(key) {
      return '*'.repeat(key.length);
  }

  // 函数：更新 API Key 显示
  function updateApiKeyDisplay() {
      if (apiKeyCheckbox.checked) {
          apiKeyInput.value = realApiKey;
      } else {
          apiKeyInput.value = maskApiKey(realApiKey);
      }
  }

  // 监听 API Key 输入
  apiKeyInput.addEventListener('input', function(e) {
      realApiKey = e.target.value;
      if (!apiKeyCheckbox.checked) {
          // 如果checkbox未选中，立即将输入转换为星号
          const cursorPosition = e.target.selectionStart;
          apiKeyInput.value = maskApiKey(realApiKey);
          // 保持光标位置
          e.target.setSelectionRange(cursorPosition, cursorPosition);
      }
  });

  // 监听 checkbox 变化
  apiKeyCheckbox.addEventListener('change', function() {
      updateApiKeyDisplay();
  });

  // 修改加载设置的函数
  function loadSavedSettings() {
      if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.sync.get(null, function(items) {
              if (items.targetLanguage) {
                  document.getElementById('targetLanguage').value = items.targetLanguage;
              }
              if (items.translateProvider) {
                  document.getElementById('TranslateProvide').value = items.translateProvider;
              }
              if (items.apiKey) {
                  realApiKey = items.apiKey;
                  apiKeyInput.value = maskApiKey(realApiKey);
              }
              if (items.modelName) {
                  if (items.modelName === 'THUDM/glm-4-9b-chat') {
                      document.getElementById('modelName').value = items.modelName;
                  } else {
                      document.getElementById('modelName').value = 'custom';
                      document.getElementById('customModel').value = items.modelName;
                      document.getElementById('customModel').style.display = 'block';
                  }
              }
              // 触发change事件以更新UI
              document.getElementById('TranslateProvide').dispatchEvent(new Event('change'));
          });
      }
  }

  // 加载保存的设置
  loadSavedSettings();

  // 修改保存设置的函数
  saveButton.addEventListener('click', function() {
      const settings = {
          targetLanguage: document.getElementById('targetLanguage').value,
          translateProvider: document.getElementById('TranslateProvide').value,
          apiKey: realApiKey,
          modelName: document.getElementById('modelName').value === 'custom' 
              ? document.getElementById('customModel').value.trim() 
              : document.getElementById('modelName').value
      };

      console.log('Saving settings:', settings); // 添加调试日志

      // 验证 modelName
      if (settings.modelName === 'custom' && !document.getElementById('customModel').value.trim()) {
          alert('Please enter a custom model name');
          return;
      }

      // 使用 Chrome Storage API 保存设置
      if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.sync.set(settings, function() {
              // 验证保存是否成功
              chrome.storage.sync.get(['modelName'], function(result) {
                  console.log('Verified saved modelName:', result.modelName);
                  showNotification('Settings saved successfully!');
              });
          });
      }
  });

  // 修改重置设置的函数
  resetButton.addEventListener('click', function() {
      if (confirm('Are you sure you want to reset all settings to default?')) {
          // 重置所有输入字段到默认值
          document.getElementById('targetLanguage').value = 'Chinese';
          document.getElementById('TranslateProvide').value = 'SiliconFlow';
          document.getElementById('apiKey').value = '';
          document.getElementById('modelName').value = 'THUDM/glm-4-9b-chat';
          document.getElementById('customModel').value = '';
          document.getElementById('customModel').style.display = 'none';

          // 触发 change 事件以更新UI
          document.getElementById('TranslateProvide').dispatchEvent(new Event('change'));
          document.getElementById('modelName').dispatchEvent(new Event('change'));

          // 清除存储的设置
          if (typeof chrome !== 'undefined' && chrome.storage) {
              chrome.storage.sync.clear(function() {
                  showNotification('Settings reset to default!');
              });
          } else {
              localStorage.removeItem('translatorSettings');
              showNotification('Settings reset to default!');
          }

          realApiKey = '';
          apiKeyInput.value = '';
          apiKeyCheckbox.checked = false;
      }
  });
});
