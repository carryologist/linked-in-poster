// Options page script for Newsletter Generator

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

async function loadSettings() {
  try {
    // Load API keys
    const result = await chrome.storage.sync.get([
      'openaiApiKey',
      'openaiModel',
      'notionApiKey', 
      'notionDatabaseId',
      'categories'
    ]);
    
    // Populate form fields (but don't show actual API keys for security)
    if (result.openaiApiKey) {
      document.getElementById('openaiApiKey').placeholder = '••••••••••••••••';
      updateConnectionStatus('openai', true);
    }
    
    if (result.openaiModel) {
      document.getElementById('openaiModel').value = result.openaiModel;
    }
    
    if (result.notionApiKey) {
      document.getElementById('notionApiKey').placeholder = '••••••••••••••••';
    }
    
    if (result.notionDatabaseId) {
      document.getElementById('notionDatabaseId').value = result.notionDatabaseId;
    }
    
    if (result.notionApiKey && result.notionDatabaseId) {
      updateConnectionStatus('notion', true);
    }
    
    // Load categories
    const categories = result.categories || [];
    displayCategories(categories);
    
  } catch (error) {
    console.error('Error loading settings:', error);
    showStatusMessage('Error loading settings', 'error');
  }
}

function setupEventListeners() {
  // Save button
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  
  // Test connections button
  document.getElementById('testBtn').addEventListener('click', testConnections);
  
  // Add category
  document.getElementById('addCategoryBtn').addEventListener('click', addCategory);
  document.getElementById('newCategory').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addCategory();
    }
  });
}

async function saveSettings() {
  const saveBtn = document.getElementById('saveBtn');
  
  try {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    const settings = {};
    
    // Get API keys (only save if they're not placeholder values)
    const openaiKey = document.getElementById('openaiApiKey').value;
    const openaiModel = document.getElementById('openaiModel').value;
    const notionKey = document.getElementById('notionApiKey').value;
    const notionDbId = document.getElementById('notionDatabaseId').value;
    
    console.log('Attempting to save settings...');
    console.log('OpenAI Key present:', openaiKey ? 'Yes' : 'No');
    console.log('Has placeholder dots:', openaiKey && openaiKey.includes('•') ? 'Yes' : 'No');
    
    if (openaiKey && !openaiKey.includes('•')) {
      settings.openaiApiKey = openaiKey;
      console.log('OpenAI API key will be saved');
    } else if (openaiKey && openaiKey.includes('•')) {
      console.log('OpenAI API key NOT saved - contains placeholder dots');
    } else {
      console.log('OpenAI API key NOT saved - field is empty');
    }
    
    settings.openaiModel = openaiModel; // Always save the selected model
    console.log('Model selected:', openaiModel);
    
    if (notionKey && !notionKey.includes('•')) {
      settings.notionApiKey = notionKey;
    }
    
    if (notionDbId) {
      settings.notionDatabaseId = notionDbId;
    }
    
    // Save to storage
    await chrome.storage.sync.set(settings);
    
    showStatusMessage('Settings saved successfully!', 'success');
    
    // Update connection status
    if (settings.openaiApiKey) {
      updateConnectionStatus('openai', true);
      document.getElementById('openaiApiKey').placeholder = '••••••••••••••••';
      document.getElementById('openaiApiKey').value = '';
    }
    
    if (settings.notionApiKey) {
      updateConnectionStatus('notion', settings.notionDatabaseId ? true : false);
      document.getElementById('notionApiKey').placeholder = '••••••••••••••••';
      document.getElementById('notionApiKey').value = '';
    }
    
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatusMessage('Error saving settings: ' + error.message, 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Settings';
  }
}

async function testConnections() {
  const testBtn = document.getElementById('testBtn');
  
  try {
    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';
    
    const result = await chrome.storage.sync.get(['openaiApiKey', 'notionApiKey', 'notionDatabaseId']);
    
    // Test OpenAI connection
    if (result.openaiApiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${result.openaiApiKey}`
          }
        });
        
        if (response.ok) {
          updateConnectionStatus('openai', true);
        } else {
          updateConnectionStatus('openai', false);
        }
      } catch (error) {
        updateConnectionStatus('openai', false);
      }
    }
    
    // Test Notion connection
    if (result.notionApiKey && result.notionDatabaseId) {
      try {
        const response = await fetch(`https://api.notion.com/v1/databases/${result.notionDatabaseId}`, {
          headers: {
            'Authorization': `Bearer ${result.notionApiKey}`,
            'Notion-Version': '2022-06-28'
          }
        });
        
        if (response.ok) {
          updateConnectionStatus('notion', true);
        } else {
          updateConnectionStatus('notion', false);
        }
      } catch (error) {
        updateConnectionStatus('notion', false);
      }
    }
    
    showStatusMessage('Connection tests completed', 'success');
    
  } catch (error) {
    console.error('Error testing connections:', error);
    showStatusMessage('Error testing connections: ' + error.message, 'error');
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = 'Test Connections';
  }
}

function updateConnectionStatus(service, connected) {
  const statusElement = document.getElementById(`${service}Status`);
  const dot = statusElement.querySelector('.status-dot');
  
  if (connected) {
    statusElement.className = 'connection-status connected';
    dot.className = 'status-dot connected';
    statusElement.innerHTML = `
      <div class="status-dot connected"></div>
      Connected
    `;
  } else {
    statusElement.className = 'connection-status disconnected';
    dot.className = 'status-dot disconnected';
    statusElement.innerHTML = `
      <div class="status-dot disconnected"></div>
      ${service === 'openai' ? 'Invalid API key' : 'Connection failed'}
    `;
  }
}

async function displayCategories(categories) {
  const container = document.getElementById('categoriesList');
  container.innerHTML = '';
  
  categories.forEach(category => {
    const tag = document.createElement('div');
    tag.className = 'category-tag';
    tag.innerHTML = `
      ${category}
      <span class="remove" data-category="${category}">×</span>
    `;
    
    // Add remove event listener
    tag.querySelector('.remove').addEventListener('click', () => {
      removeCategory(category);
    });
    
    container.appendChild(tag);
  });
}

async function addCategory() {
  const input = document.getElementById('newCategory');
  const newCategory = input.value.trim();
  
  if (!newCategory) return;
  
  try {
    const result = await chrome.storage.sync.get(['categories']);
    const categories = result.categories || [];
    
    if (!categories.includes(newCategory)) {
      categories.push(newCategory);
      await chrome.storage.sync.set({ categories });
      displayCategories(categories);
      input.value = '';
      showStatusMessage(`Category "${newCategory}" added`, 'success');
    } else {
      showStatusMessage('Category already exists', 'error');
    }
  } catch (error) {
    console.error('Error adding category:', error);
    showStatusMessage('Error adding category', 'error');
  }
}

async function removeCategory(categoryToRemove) {
  try {
    const result = await chrome.storage.sync.get(['categories']);
    const categories = result.categories || [];
    
    const updatedCategories = categories.filter(cat => cat !== categoryToRemove);
    await chrome.storage.sync.set({ categories: updatedCategories });
    
    displayCategories(updatedCategories);
    showStatusMessage(`Category "${categoryToRemove}" removed`, 'success');
  } catch (error) {
    console.error('Error removing category:', error);
    showStatusMessage('Error removing category', 'error');
  }
}

function showStatusMessage(message, type) {
  const statusDiv = document.getElementById('statusMessage');
  statusDiv.className = `status-message ${type}`;
  statusDiv.textContent = message;
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    statusDiv.textContent = '';
    statusDiv.className = '';
  }, 5000);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  
  // Add save button listener
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  
  // Add reset categories button listener
  const resetBtn = document.getElementById('resetCategoriesBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('This will replace all your current categories with the default LinkedIn categories. Continue?')) {
        const defaultCategories = [
          '🚀 Developer Productivity',
          '🤖 AI/ML Engineering',
          '🏗️ Tech Infrastructure',
          '💡 Industry Insights',
          '🛠️ Product Innovation',
          '🎯 Leadership & Culture',
          '📊 Tech Strategy',
          '🔮 Future of Development',
          '📚 Lessons Learned',
          '🤝 Community & Open Source'
        ];
        
        await chrome.storage.sync.set({ categories: defaultCategories });
        displayCategories(defaultCategories);
        showStatusMessage('Categories reset to LinkedIn defaults', 'success');
      }
    });
  }
  
  // Add debug button listener
  const debugBtn = document.getElementById('debugBtn');
  if (debugBtn) {
    debugBtn.addEventListener('click', async () => {
      const stored = await chrome.storage.sync.get(null);
      const output = document.getElementById('debugOutput');
      
      // Mask sensitive values for display
      const displayData = { ...stored };
      if (displayData.openaiApiKey) {
        displayData.openaiApiKey = displayData.openaiApiKey.substring(0, 10) + '...' + 
                                    displayData.openaiApiKey.substring(displayData.openaiApiKey.length - 4);
      }
      if (displayData.notionApiKey) {
        displayData.notionApiKey = displayData.notionApiKey.substring(0, 10) + '...' + 
                                    displayData.notionApiKey.substring(displayData.notionApiKey.length - 4);
      }
      
      output.textContent = JSON.stringify(displayData, null, 2);
      output.style.display = 'block';
    });
  }
  
  // Add category form listener
  // ... existing code ...
});