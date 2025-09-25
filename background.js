// Background service worker for Newsletter Generator

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Post Generator extension installed');
  
  // Initialize or migrate categories
  chrome.storage.sync.get(['categories'], (result) => {
    const oldCategories = [
      'Employee Milestones',
      'Customer Wins',
      'Product Announcements',
      'Company News',
      'Industry Updates',
      'Team Updates'
    ];
    
    const newCategories = [
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
    
    // Check if we have old categories or no categories
    if (!result.categories || 
        result.categories.length === 0 || 
        result.categories.some(cat => oldCategories.includes(cat))) {
      // Migrate to new categories
      chrome.storage.sync.set({ categories: newCategories }, () => {
        console.log('Migrated to LinkedIn-focused categories');
      });
    }
  });
});

// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  // Remove existing menu items first to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'capture-for-linkedin',
      title: 'Generate LinkedIn Post',
      contexts: ['selection']
    });
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'capture-for-linkedin' && info.selectionText) {
    // First try to send message to existing content script
    chrome.tabs.sendMessage(tab.id, { action: 'captureContent' }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script not loaded, inject it
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        }, () => {
          // After injection, send the message
          setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, { action: 'captureContent' });
          }, 100);
        });
      }
    });
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'capture-content') {
    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // First try to send message to existing content script
        chrome.tabs.sendMessage(tabs[0].id, { action: 'captureContent' }, (response) => {
          if (chrome.runtime.lastError) {
            // Content script not loaded, inject it
            chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              files: ['content.js']
            }, () => {
              // After injection, send the message
              setTimeout(() => {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'captureContent' });
              }, 100);
            });
          }
        });
      }
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processContent') {
    processContentWithAI(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

// Process content with OpenAI API
async function processContentWithAI(contentData) {
  try {
    // Load settings from storage
    const { openaiApiKey, openaiModel } = await chrome.storage.sync.get(['openaiApiKey', 'openaiModel']);
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured. Please set it in the extension options.');
    }
    
    const selectedModel = openaiModel || 'gpt-4o-mini'; // Default to gpt-4o-mini - actual OpenAI API model
    
    // Get current categories
    const { categories } = await chrome.storage.sync.get(['categories']);
    
    const prompt = `
You are helping the CEO of Coder, a software startup that makes AI development infrastructure. Your job is to transform the selected text into an engaging LinkedIn post that builds awareness for Coder and establishes thought leadership.

Content to transform: "${contentData.selectedText}"
Source URL: ${contentData.sourceUrl}
Page Title: "${contentData.pageTitle}"
${contentData.author ? `Original Author: ${contentData.author}` : ''}

Create a LinkedIn post following these guidelines:

1. OPENING HOOK (choose the most impactful approach):
   - A counterintuitive insight or surprising fact from the content
   - A bold prediction or claim that challenges conventional thinking
   - A specific metric or data point that tells a story
   - A provocative statement that reframes the discussion
   - A brief anecdote or scenario that illustrates the key point
   - Occasionally a rhetorical question (but avoid overusing this)
   
   The opening must be punchy, specific, and immediately valuable - not generic.

2. Write in a conversational tone that's engaging and approachable

3. Keep the post between 1,000-2,000 characters (aim for the sweet spot around 1,500)

4. Include relevant emojis to make it visually appealing (but don't overdo it)

5. Connect to developer experience, AI infrastructure, or productivity challenges when relevant - but naturally, not forced

6. Include attribution to the original author/source naturally within the post

7. End with ONE of these:
   - A thought-provoking question to spark discussion
   - An actionable takeaway or call-to-action
   - A forward-looking insight about what this means for the industry

8. NO hashtags needed

The post should feel authentic, actionable, and position me as someone who deeply understands developer challenges and the future of AI-powered development.

Respond in JSON format:
{
  "linkedinPost": "[The complete LinkedIn post with emojis]",
  "characterCount": [number of characters],
  "category": "${categories.join(', ')} or suggest new",
  "isNewCategory": true/false
}
`;
    
    console.log('Using model:', selectedModel); // Debug logging
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: selectedModel, // Use the selected model from settings
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.3,
        max_tokens: 500  // Increased for LinkedIn posts (was 300 for summaries)
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error response:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }
    
    const data = await response.json();
    const aiResult = JSON.parse(data.choices[0].message.content);
    
    return {
      ...aiResult,
      originalText: contentData.selectedText,
      sourceUrl: contentData.sourceUrl,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error processing content:', error);
    throw error;
  }
}

// Save to Notion
async function saveToNotion(summaryData) {
  try {
    const { notionApiKey, notionDatabaseId } = await chrome.storage.sync.get(['notionApiKey', 'notionDatabaseId']);
    
    if (!notionApiKey || !notionDatabaseId) {
      throw new Error('Notion API credentials not configured');
    }
    
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { database_id: notionDatabaseId },
        properties: {
          'Title': {
            title: [{
              text: {
                content: `${summaryData.category} - ${new Date().toLocaleDateString()}`
              }
            }]
          },
          'Category': {
            select: {
              name: summaryData.category
            }
          },
          'LinkedIn Post': {  // Changed from 'Summary' to 'LinkedIn Post'
            rich_text: [{
              text: {
                content: summaryData.linkedinPost || summaryData.summary
              }
            }]
          },
          'Source URL': {
            url: summaryData.sourceUrl
          },
          'Date Added': {
            date: {
              start: new Date().toISOString()
            }
          },
          // Add Contributor if we have author information
          ...(summaryData.author ? {
            'Contributor': {
              rich_text: [{
                text: {
                  content: summaryData.author
                }
              }]
            }
          } : {})
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Notion API error:', errorData);
      throw new Error(`Notion API error: ${response.status} - ${errorData.message || JSON.stringify(errorData)}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Error saving to Notion:', error);
    throw error;
  }
}

// Expose saveToNotion for popup and handle openPopup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveToNotion') {
    saveToNotion(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'openPopup') {
    // Try to open the popup automatically
    chrome.action.openPopup().catch(error => {
      console.log('Could not open popup automatically:', error);
      // Fallback: The user will need to click the extension icon
    });
  }
});