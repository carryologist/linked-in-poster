// Popup script for Newsletter Generator

document.addEventListener('DOMContentLoaded', async () => {
  await loadContent();
});

async function loadContent() {
  const contentDiv = document.getElementById('content');
  
  try {
    // Check if there's pending content to review
    const result = await chrome.storage.local.get(['pendingContent']);
    
    if (result.pendingContent) {
      showReviewInterface(result.pendingContent);
    } else {
      showEmptyState();
    }
  } catch (error) {
    console.error('Error loading content:', error);
    showError('Failed to load content');
  }
}

function showEmptyState() {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">📝</div>
      <div class="empty-state-title">No content captured</div>
      <div class="empty-state-text">
        Select text on any webpage and press <strong>Ctrl+Shift+N</strong> to capture content for your newsletter.
      </div>
    </div>
  `;
}

function showReviewInterface(data) {
  const contentDiv = document.getElementById('content');
  
  contentDiv.innerHTML = `
    <div class="content-section">
      <div class="section-title">Source</div>
      <div class="source-url">${data.sourceUrl}</div>
      
      <div class="section-title">Original Text</div>
      <div class="original-text">${data.originalText}</div>
      
      <div class="section-title">Summary</div>
      <textarea class="summary-input" id="summaryText" placeholder="AI-generated summary...">${data.summary}</textarea>
      
      <div class="section-title">Category</div>
      <div class="category-section">
        <select class="category-select" id="categorySelect">
          <!-- Options will be populated by loadCategories() -->
        </select>
        ${data.isNewCategory ? '<span class="new-category-badge">New Category</span>' : ''}
      </div>
    </div>
    
    <div class="actions">
      <button class="btn btn-secondary" id="discardBtn">Discard</button>
      <button class="btn btn-primary" id="saveBtn">Save to Newsletter</button>
    </div>
  `;
  
  // Load categories and set up event listeners
  loadCategories(data.category);
  setupEventListeners(data);
}

async function loadCategories(selectedCategory) {
  try {
    const result = await chrome.storage.sync.get(['categories']);
    const categories = result.categories || [];
    
    const select = document.getElementById('categorySelect');
    select.innerHTML = '';
    
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      if (category === selectedCategory) {
        option.selected = true;
      }
      select.appendChild(option);
    });
    
    // If it's a new category, add it to the list
    if (selectedCategory && !categories.includes(selectedCategory)) {
      const option = document.createElement('option');
      option.value = selectedCategory;
      option.textContent = selectedCategory;
      option.selected = true;
      select.appendChild(option);
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
}

function setupEventListeners(data) {
  const saveBtn = document.getElementById('saveBtn');
  const discardBtn = document.getElementById('discardBtn');
  const summaryText = document.getElementById('summaryText');
  const categorySelect = document.getElementById('categorySelect');
  
  saveBtn.addEventListener('click', async () => {
    await saveContent({
      ...data,
      summary: summaryText.value,
      category: categorySelect.value
    });
  });
  
  discardBtn.addEventListener('click', () => {
    discardContent();
  });
}

async function saveContent(data) {
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');
  
  try {
    // Update UI to show saving state
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    status.textContent = 'Saving';
    status.className = 'status processing';
    
    // Check if this is a new category and needs to be added
    if (data.isNewCategory) {
      const result = await chrome.storage.sync.get(['categories']);
      const categories = result.categories || [];
      if (!categories.includes(data.category)) {
        categories.push(data.category);
        await chrome.storage.sync.set({ categories });
      }
    }
    
    // Save to Notion
    const response = await chrome.runtime.sendMessage({
      action: 'saveToNotion',
      data: data
    });
    
    if (response.success) {
      // Clear pending content
      await chrome.storage.local.remove(['pendingContent']);
      
      // Show success state
      showSuccessState();
    } else {
      throw new Error(response.error);
    }
    
  } catch (error) {
    console.error('Error saving content:', error);
    showError(`Failed to save: ${error.message}`);
    
    // Reset button state
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save to Newsletter';
    status.textContent = 'Error';
    status.className = 'status error';
  }
}

function discardContent() {
  chrome.storage.local.remove(['pendingContent'], () => {
    showEmptyState();
  });
}

function showSuccessState() {
  const contentDiv = document.getElementById('content');
  const status = document.getElementById('status');
  
  status.textContent = 'Saved';
  status.className = 'status ready';
  
  contentDiv.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">✅</div>
      <div class="empty-state-title">Content saved!</div>
      <div class="empty-state-text">
        Your content has been added to the newsletter database.
      </div>
    </div>
  `;
  
  // Auto-close popup after 2 seconds
  setTimeout(() => {
    window.close();
  }, 2000);
}

function showError(message) {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">❌</div>
      <div class="empty-state-title">Error</div>
      <div class="empty-state-text">${message}</div>
    </div>
  `;
}

function showLoading() {
  const contentDiv = document.getElementById('content');
  contentDiv.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      Processing content...
    </div>
  `;
}