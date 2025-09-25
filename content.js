// Content script for Newsletter Generator

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureContent' || request.action === 'captureSelection') {
    captureContent();
    sendResponse({ success: true }); // Acknowledge the message
  }
  return true; // Keep the message channel open for async response
});

// Capture selected text and process it
function captureContent() {
  const selectedText = window.getSelection().toString().trim();
  
  if (!selectedText) {
    // No text selected - offer to summarize entire page
    showFullPageDialog();
    return;
  }
  
  if (selectedText.length < 10) {
    showNotification('Please select more substantial content', 'warning');
    return;
  }
  
  // Check for existing unsaved content
  chrome.storage.local.get(['pendingContent'], (result) => {
    if (result.pendingContent) {
      showUnsavedContentDialog(selectedText);
    } else {
      processNewContent(selectedText);
    }
  });
}

// Show dialog asking if user wants to create a LinkedIn post from the entire page
function showFullPageDialog() {
  const dialog = document.createElement('div');
  dialog.id = 'newsletter-generator-fullpage-dialog';
  dialog.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10001;
    background: white;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    padding: 24px;
    width: 480px;
    max-width: 90vw;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #333;
  `;
  
  // Create elements programmatically
  const title = document.createElement('h3');
  title.textContent = 'No Text Selected';
  title.style.cssText = 'margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #333;';
  
  const message = document.createElement('p');
  message.textContent = 'No text is currently selected. Would you like to create a LinkedIn post from the entire page instead?';
  message.style.cssText = 'margin: 0 0 20px 0; line-height: 1.5; color: #666;';
  
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
  
  // Create buttons with consistent styling matching the unsaved content dialog
  const summarizeBtn = document.createElement('button');
  summarizeBtn.textContent = 'Create Post';
  summarizeBtn.innerHTML = 'Create Post'; // Backup method
  summarizeBtn.style.setProperty('padding', '12px 20px', 'important');
  summarizeBtn.style.setProperty('border', 'none', 'important');
  summarizeBtn.style.setProperty('background', '#28a745', 'important');
  summarizeBtn.style.setProperty('color', 'white', 'important');
  summarizeBtn.style.setProperty('border-radius', '6px', 'important');
  summarizeBtn.style.setProperty('cursor', 'pointer', 'important');
  summarizeBtn.style.setProperty('font-size', '14px', 'important');
  summarizeBtn.style.setProperty('font-family', '-apple-system, BlinkMacSystemFont, sans-serif', 'important');
  summarizeBtn.style.setProperty('font-weight', '500', 'important');
  summarizeBtn.style.setProperty('display', 'inline-block', 'important');
  summarizeBtn.style.setProperty('box-sizing', 'border-box', 'important');
  summarizeBtn.style.setProperty('line-height', '1.4', 'important');
  summarizeBtn.style.setProperty('text-decoration', 'none', 'important');
  summarizeBtn.style.setProperty('width', '120px', 'important');
  summarizeBtn.style.setProperty('white-space', 'nowrap', 'important');
  summarizeBtn.style.setProperty('text-align', 'center', 'important');
  summarizeBtn.style.setProperty('transition', 'all 0.2s ease', 'important');
  summarizeBtn.style.setProperty('opacity', '1', 'important');
  summarizeBtn.style.setProperty('visibility', 'visible', 'important');
  
  const selectTextBtn = document.createElement('button');
  selectTextBtn.textContent = 'Select Text';
  selectTextBtn.innerHTML = 'Select Text'; // Backup method
  selectTextBtn.style.setProperty('padding', '12px 20px', 'important');
  selectTextBtn.style.setProperty('border', 'none', 'important');
  selectTextBtn.style.setProperty('background', '#dc3545', 'important');
  selectTextBtn.style.setProperty('color', 'white', 'important');
  selectTextBtn.style.setProperty('border', 'none', 'important');
  selectTextBtn.style.setProperty('border-radius', '6px', 'important');
  selectTextBtn.style.setProperty('cursor', 'pointer', 'important');
  selectTextBtn.style.setProperty('font-size', '14px', 'important');
  selectTextBtn.style.setProperty('font-family', '-apple-system, BlinkMacSystemFont, sans-serif', 'important');
  selectTextBtn.style.setProperty('font-weight', '500', 'important');
  selectTextBtn.style.setProperty('display', 'inline-block', 'important');
  selectTextBtn.style.setProperty('box-sizing', 'border-box', 'important');
  selectTextBtn.style.setProperty('line-height', '1.4', 'important');
  selectTextBtn.style.setProperty('text-decoration', 'none', 'important');
  selectTextBtn.style.setProperty('width', '120px', 'important');
  selectTextBtn.style.setProperty('white-space', 'nowrap', 'important');
  selectTextBtn.style.setProperty('text-align', 'center', 'important');
  selectTextBtn.style.setProperty('transition', 'all 0.2s ease', 'important');
  selectTextBtn.style.setProperty('opacity', '1', 'important');
  selectTextBtn.style.setProperty('visibility', 'visible', 'important');
  
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.innerHTML = 'Cancel'; // Backup method
  cancelBtn.style.setProperty('padding', '12px 20px', 'important');
  cancelBtn.style.setProperty('border', 'none', 'important');
  cancelBtn.style.setProperty('background', '#007bff', 'important');
  cancelBtn.style.setProperty('color', 'white', 'important');
  cancelBtn.style.setProperty('border-radius', '6px', 'important');
  cancelBtn.style.setProperty('cursor', 'pointer', 'important');
  cancelBtn.style.setProperty('font-size', '14px', 'important');
  cancelBtn.style.setProperty('font-family', '-apple-system, BlinkMacSystemFont, sans-serif', 'important');
  cancelBtn.style.setProperty('font-weight', '500', 'important');
  cancelBtn.style.setProperty('display', 'inline-block', 'important');
  cancelBtn.style.setProperty('box-sizing', 'border-box', 'important');
  cancelBtn.style.setProperty('line-height', '1.4', 'important');
  cancelBtn.style.setProperty('text-decoration', 'none', 'important');
  cancelBtn.style.setProperty('width', '90px', 'important');
  cancelBtn.style.setProperty('white-space', 'nowrap', 'important');
  cancelBtn.style.setProperty('text-align', 'center', 'important');
  cancelBtn.style.setProperty('transition', 'all 0.2s ease', 'important');
  cancelBtn.style.setProperty('opacity', '1', 'important');
  cancelBtn.style.setProperty('visibility', 'visible', 'important');
  
  // Add hover effects with animations matching the unsaved content dialog
  summarizeBtn.addEventListener('mouseenter', () => {
    summarizeBtn.style.setProperty('background', '#218838', 'important');
    summarizeBtn.style.setProperty('transform', 'translateY(-1px)', 'important');
    summarizeBtn.style.setProperty('box-shadow', '0 4px 8px rgba(40, 167, 69, 0.3)', 'important');
  });
  summarizeBtn.addEventListener('mouseleave', () => {
    summarizeBtn.style.setProperty('background', '#28a745', 'important');
    summarizeBtn.style.setProperty('transform', 'translateY(0)', 'important');
    summarizeBtn.style.setProperty('box-shadow', 'none', 'important');
  });
  
  selectTextBtn.addEventListener('mouseenter', () => {
    selectTextBtn.style.setProperty('background', '#c82333', 'important');
    selectTextBtn.style.setProperty('transform', 'translateY(-1px)', 'important');
    selectTextBtn.style.setProperty('box-shadow', '0 4px 8px rgba(220, 53, 69, 0.3)', 'important');
  });
  selectTextBtn.addEventListener('mouseleave', () => {
    selectTextBtn.style.setProperty('background', '#dc3545', 'important');
    selectTextBtn.style.setProperty('transform', 'translateY(0)', 'important');
    selectTextBtn.style.setProperty('box-shadow', 'none', 'important');
  });
  
  cancelBtn.addEventListener('mouseenter', () => {
    cancelBtn.style.setProperty('background', '#0056b3', 'important');
    cancelBtn.style.setProperty('transform', 'translateY(-1px)', 'important');
    cancelBtn.style.setProperty('box-shadow', '0 4px 8px rgba(0, 123, 255, 0.3)', 'important');
  });
  cancelBtn.addEventListener('mouseleave', () => {
    cancelBtn.style.setProperty('background', '#007bff', 'important');
    cancelBtn.style.setProperty('transform', 'translateY(0)', 'important');
    cancelBtn.style.setProperty('box-shadow', 'none', 'important');
  });
  
  // Assemble dialog
  buttonContainer.appendChild(summarizeBtn);
  buttonContainer.appendChild(selectTextBtn);
  buttonContainer.appendChild(cancelBtn);
  
  dialog.appendChild(title);
  dialog.appendChild(message);
  dialog.appendChild(buttonContainer);
  
  // Add backdrop
  const backdrop = document.createElement('div');
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10000;
  `;
  
  document.body.appendChild(backdrop);
  document.body.appendChild(dialog);
  
  // Handle button clicks
  summarizeBtn.addEventListener('click', () => {
    removeDialog();
    processFullPageContent();
  });
  
  selectTextBtn.addEventListener('click', () => {
    removeDialog();
    showNotification('Please select text on the page and try again', 'info');
  });
  
  cancelBtn.addEventListener('click', () => {
    removeDialog();
  });
  
  function removeDialog() {
    backdrop.remove();
    dialog.remove();
  }
}

// Show dialog for unsaved content
function showUnsavedContentDialog(newSelectedText) {
  const dialog = document.createElement('div');
  dialog.id = 'newsletter-generator-dialog';
  dialog.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10001;
    background: white;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    padding: 24px;
    width: 480px;
    max-width: 90vw;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #333;
  `;
  
  // Create elements programmatically for better reliability
  const title = document.createElement('h3');
  title.textContent = 'Unsaved Content';
  title.style.cssText = 'margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #333;';
  
  const message = document.createElement('p');
  message.textContent = 'You have unsaved content in the extension popup. What would you like to do?';
  message.style.cssText = 'margin: 0 0 20px 0; line-height: 1.5; color: #666;';
  
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
  
  // Create buttons with aggressive styling to override website CSS
  const saveBtn = document.createElement('button');
  saveBtn.id = 'ng-save-existing';
  saveBtn.textContent = 'Save Existing';
  saveBtn.innerHTML = 'Save Existing'; // Backup method
  // Set individual properties to be more forceful
  saveBtn.style.setProperty('padding', '12px 20px', 'important');
  saveBtn.style.setProperty('border', 'none', 'important');
  saveBtn.style.setProperty('background', '#28a745', 'important');
  saveBtn.style.setProperty('border-radius', '6px', 'important');
  saveBtn.style.setProperty('cursor', 'pointer', 'important');
  saveBtn.style.setProperty('font-size', '14px', 'important');
  saveBtn.style.setProperty('font-family', '-apple-system, BlinkMacSystemFont, sans-serif', 'important');
  saveBtn.style.setProperty('color', 'white', 'important');
  saveBtn.style.setProperty('display', 'inline-block', 'important');
  saveBtn.style.setProperty('box-sizing', 'border-box', 'important');
  saveBtn.style.setProperty('line-height', '1.4', 'important');
  saveBtn.style.setProperty('font-weight', '500', 'important');
  saveBtn.style.setProperty('text-decoration', 'none', 'important');
  saveBtn.style.setProperty('opacity', '1', 'important');
  saveBtn.style.setProperty('visibility', 'visible', 'important');
  saveBtn.style.setProperty('white-space', 'nowrap', 'important');
  saveBtn.style.setProperty('text-align', 'center', 'important');
  saveBtn.style.setProperty('width', '120px', 'important');
  saveBtn.style.setProperty('transition', 'all 0.2s ease', 'important');
  
  const discardBtn = document.createElement('button');
  discardBtn.id = 'ng-discard-existing';
  discardBtn.textContent = 'Discard & Continue';
  discardBtn.innerHTML = 'Discard & Continue'; // Backup method
  // Set individual properties to be more forceful
  discardBtn.style.setProperty('padding', '12px 20px', 'important');
  discardBtn.style.setProperty('border', 'none', 'important');
  discardBtn.style.setProperty('background', '#dc3545', 'important');
  discardBtn.style.setProperty('border-radius', '6px', 'important');
  discardBtn.style.setProperty('cursor', 'pointer', 'important');
  discardBtn.style.setProperty('font-size', '14px', 'important');
  discardBtn.style.setProperty('font-family', '-apple-system, BlinkMacSystemFont, sans-serif', 'important');
  discardBtn.style.setProperty('color', 'white', 'important');
  discardBtn.style.setProperty('display', 'inline-block', 'important');
  discardBtn.style.setProperty('box-sizing', 'border-box', 'important');
  discardBtn.style.setProperty('line-height', '1.4', 'important');
  discardBtn.style.setProperty('font-weight', '500', 'important');
  discardBtn.style.setProperty('text-decoration', 'none', 'important');
  discardBtn.style.setProperty('opacity', '1', 'important');
  discardBtn.style.setProperty('visibility', 'visible', 'important');
  discardBtn.style.setProperty('white-space', 'nowrap', 'important');
  discardBtn.style.setProperty('text-align', 'center', 'important');
  discardBtn.style.setProperty('width', '160px', 'important');
  discardBtn.style.setProperty('transition', 'all 0.2s ease', 'important');
  
  const cancelBtn = document.createElement('button');
  cancelBtn.id = 'ng-cancel';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.innerHTML = 'Cancel'; // Backup method
  // Set individual properties to be more forceful
  cancelBtn.style.setProperty('padding', '12px 20px', 'important');
  cancelBtn.style.setProperty('border', 'none', 'important');
  cancelBtn.style.setProperty('background', '#007bff', 'important');
  cancelBtn.style.setProperty('border-radius', '6px', 'important');
  cancelBtn.style.setProperty('cursor', 'pointer', 'important');
  cancelBtn.style.setProperty('font-size', '14px', 'important');
  cancelBtn.style.setProperty('font-family', '-apple-system, BlinkMacSystemFont, sans-serif', 'important');
  cancelBtn.style.setProperty('color', 'white', 'important');
  cancelBtn.style.setProperty('display', 'inline-block', 'important');
  cancelBtn.style.setProperty('box-sizing', 'border-box', 'important');
  cancelBtn.style.setProperty('line-height', '1.4', 'important');
  cancelBtn.style.setProperty('font-weight', '500', 'important');
  cancelBtn.style.setProperty('text-decoration', 'none', 'important');
  cancelBtn.style.setProperty('opacity', '1', 'important');
  cancelBtn.style.setProperty('visibility', 'visible', 'important');
  cancelBtn.style.setProperty('white-space', 'nowrap', 'important');
  cancelBtn.style.setProperty('text-align', 'center', 'important');
  cancelBtn.style.setProperty('width', '90px', 'important');
  cancelBtn.style.setProperty('transition', 'all 0.2s ease', 'important');
  
  // Add hover effects with animations
  saveBtn.addEventListener('mouseenter', () => {
    saveBtn.style.setProperty('background', '#218838', 'important');
    saveBtn.style.setProperty('transform', 'translateY(-1px)', 'important');
    saveBtn.style.setProperty('box-shadow', '0 4px 8px rgba(40, 167, 69, 0.3)', 'important');
  });
  saveBtn.addEventListener('mouseleave', () => {
    saveBtn.style.setProperty('background', '#28a745', 'important');
    saveBtn.style.setProperty('transform', 'translateY(0)', 'important');
    saveBtn.style.setProperty('box-shadow', 'none', 'important');
  });
  
  discardBtn.addEventListener('mouseenter', () => {
    discardBtn.style.setProperty('background', '#c82333', 'important');
    discardBtn.style.setProperty('transform', 'translateY(-1px)', 'important');
    discardBtn.style.setProperty('box-shadow', '0 4px 8px rgba(220, 53, 69, 0.3)', 'important');
  });
  discardBtn.addEventListener('mouseleave', () => {
    discardBtn.style.setProperty('background', '#dc3545', 'important');
    discardBtn.style.setProperty('transform', 'translateY(0)', 'important');
    discardBtn.style.setProperty('box-shadow', 'none', 'important');
  });
  
  cancelBtn.addEventListener('mouseenter', () => {
    cancelBtn.style.setProperty('background', '#0056b3', 'important');
    cancelBtn.style.setProperty('transform', 'translateY(-1px)', 'important');
    cancelBtn.style.setProperty('box-shadow', '0 4px 8px rgba(0, 123, 255, 0.3)', 'important');
  });
  cancelBtn.addEventListener('mouseleave', () => {
    cancelBtn.style.setProperty('background', '#007bff', 'important');
    cancelBtn.style.setProperty('transform', 'translateY(0)', 'important');
    cancelBtn.style.setProperty('box-shadow', 'none', 'important');
  });
  
  // Assemble dialog
  buttonContainer.appendChild(saveBtn);
  buttonContainer.appendChild(discardBtn);
  buttonContainer.appendChild(cancelBtn);
  
  dialog.appendChild(title);
  dialog.appendChild(message);
  dialog.appendChild(buttonContainer);
  
  // Add backdrop
  const backdrop = document.createElement('div');
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10000;
  `;
  
  document.body.appendChild(backdrop);
  document.body.appendChild(dialog);
  
  // Handle button clicks
  saveBtn.addEventListener('click', () => {
    // Open popup to save existing content
    chrome.runtime.sendMessage({ action: 'openPopup' });
    removeDialog();
    showNotification('Please save your existing content first', 'info');
  });
  
  discardBtn.addEventListener('click', () => {
    // Clear existing content and process new
    chrome.storage.local.remove(['pendingContent'], () => {
      removeDialog();
      processNewContent(newSelectedText);
    });
  });
  
  cancelBtn.addEventListener('click', () => {
    removeDialog();
  });
  
  function removeDialog() {
    backdrop.remove();
    dialog.remove();
  }
}

// Extract author information from page metadata and common elements
function extractAuthorFromPage() {
  // Try various methods to find author information
  
  // 1. Check meta tags
  const authorMeta = document.querySelector('meta[name="author"]');
  if (authorMeta && authorMeta.content) {
    return authorMeta.content.trim();
  }
  
  // 2. Check article author meta
  const articleAuthor = document.querySelector('meta[property="article:author"]');
  if (articleAuthor && articleAuthor.content) {
    return articleAuthor.content.trim();
  }
  
  // 3. Check Twitter card author
  const twitterCreator = document.querySelector('meta[name="twitter:creator"]');
  if (twitterCreator && twitterCreator.content) {
    return twitterCreator.content.replace('@', '').trim();
  }
  
  // 4. Look for common author class names and elements
  const authorSelectors = [
    '.author-name',
    '.byline-author',
    '.post-author',
    '.article-author',
    '[rel="author"]',
    '.author',
    '.by-author',
    '.writer-name'
  ];
  
  for (const selector of authorSelectors) {
    const authorElement = document.querySelector(selector);
    if (authorElement && authorElement.textContent) {
      const authorText = authorElement.textContent.trim();
      // Clean up common prefixes
      return authorText.replace(/^(by|author:?|written by)\s*/i, '').trim();
    }
  }
  
  // 5. Look for JSON-LD structured data
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent);
      if (data.author) {
        if (typeof data.author === 'string') {
          return data.author.trim();
        } else if (data.author.name) {
          return data.author.name.trim();
        }
      }
    } catch (e) {
      // Ignore JSON parsing errors
    }
  }
  
  return null; // No author found
}

// Process full page content when no text is selected
function processFullPageContent() {
  // Extract main content from the page
  const pageContent = extractPageContent();
  
  if (!pageContent || pageContent.length < 50) {
    showNotification('Unable to extract meaningful content from this page', 'warning');
    return;
  }
  
  // Check for existing unsaved content
  chrome.storage.local.get(['pendingContent'], (result) => {
    if (result.pendingContent) {
      showUnsavedContentDialog(pageContent);
    } else {
      processNewContent(pageContent);
    }
  });
}

// Extract main content from the page
function extractPageContent() {
  // Try to find the main content area using common selectors
  const contentSelectors = [
    'article',
    'main',
    '[role="main"]',
    '.post-content',
    '.article-content',
    '.entry-content',
    '.content',
    '.post-body',
    '.article-body'
  ];
  
  let content = '';
  
  // Try each selector to find the main content
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      content = element.innerText || element.textContent;
      if (content && content.trim().length > 100) {
        break;
      }
    }
  }
  
  // Fallback: extract from body but filter out navigation, ads, etc.
  if (!content || content.trim().length < 100) {
    const body = document.body.cloneNode(true);
    
    // Remove unwanted elements
    const unwantedSelectors = [
      'nav', 'header', 'footer', 'aside',
      '.navigation', '.nav', '.menu',
      '.sidebar', '.widget', '.ad', '.advertisement',
      '.social', '.share', '.comments',
      'script', 'style', 'noscript'
    ];
    
    unwantedSelectors.forEach(selector => {
      const elements = body.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    content = body.innerText || body.textContent;
  }
  
  // Clean up the content
  content = content
    .replace(/\s+/g, ' ')  // Replace multiple whitespace with single space
    .replace(/\n\s*\n/g, '\n')  // Remove empty lines
    .trim();
  
  // Limit content length to avoid overwhelming the AI
  if (content.length > 8000) {
    content = content.substring(0, 8000) + '...';
  }
  
  return content;
}

// Process new content (extracted from original function)
function processNewContent(selectedText) {
  // Show loading indicator
  showNotification('Processing content...', 'info');
  
  // Gather additional page metadata for better AI analysis
  const pageMetadata = {
    selectedText: selectedText,
    sourceUrl: window.location.href,
    pageTitle: document.title,
    // Try to extract author from common meta tags and page elements
    author: extractAuthorFromPage()
  };
  
  // Send to background script for AI processing
  chrome.runtime.sendMessage({
    action: 'processContent',
    data: pageMetadata
  }, (response) => {
    if (response.success) {
      // Store the processed data and open popup
      chrome.storage.local.set({ 
        pendingContent: response.data 
      }, () => {
        // Open the extension popup
        chrome.runtime.sendMessage({ action: 'openPopup' });
        showNotification('Content processed! Opening review popup...', 'success');
      });
    } else {
      showNotification(`Error: ${response.error}`, 'error');
    }
  });
}

// Show notification to user
function showNotification(message, type = 'info') {
  // Remove existing notification if any
  const existing = document.getElementById('newsletter-generator-notification');
  if (existing) {
    existing.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'newsletter-generator-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    padding: 12px 16px;
    border-radius: 6px;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-width: 300px;
    word-wrap: break-word;
    transition: all 0.3s ease;
  `;
  
  // Set color based on type
  const colors = {
    info: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };
  notification.style.backgroundColor = colors[type] || colors.info;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }
  }, 4000);
}

// Add visual feedback for text selection
let selectionTimeout;
document.addEventListener('mouseup', () => {
  clearTimeout(selectionTimeout);
  selectionTimeout = setTimeout(() => {
    const selection = window.getSelection();
    if (selection.toString().trim().length > 10) {
      showSelectionHint();
    }
  }, 500);
});

function showSelectionHint() {
  // Remove existing hint
  const existing = document.getElementById('newsletter-generator-hint');
  if (existing) {
    existing.remove();
  }
  
  const hint = document.createElement('div');
  hint.id = 'newsletter-generator-hint';
  hint.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 4px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  
  hint.textContent = 'Press Ctrl+Shift+N to capture for newsletter';
  document.body.appendChild(hint);
  
  // Fade in
  setTimeout(() => hint.style.opacity = '1', 100);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    hint.style.opacity = '0';
    setTimeout(() => hint.remove(), 300);
  }, 3000);
}

// Clear hint when selection is cleared
document.addEventListener('mousedown', () => {
  const hint = document.getElementById('newsletter-generator-hint');
  if (hint) {
    hint.remove();
  }
});