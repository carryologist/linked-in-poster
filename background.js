// Background service worker for Newsletter Generator

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Newsletter Generator extension installed');
  
  // Initialize default categories
  chrome.storage.sync.get(['categories'], (result) => {
    if (!result.categories) {
      const defaultCategories = [
        'Employee Milestones',
        'Customer Wins',
        'Product Announcements',
        'Company News',
        'Industry Updates',
        'Team Updates'
      ];
      chrome.storage.sync.set({ categories: defaultCategories });
    }
  });
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command) => {
  if (command === 'capture-content') {
    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // Send message to content script to capture selected text
        chrome.tabs.sendMessage(tabs[0].id, { action: 'captureSelection' }, (response) => {
          // Handle potential connection errors
          if (chrome.runtime.lastError) {
            console.log('Content script not available on this page:', chrome.runtime.lastError.message);
            // Could show a notification or badge here if needed
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
    
    const selectedModel = openaiModel || 'gpt-5-mini'; // Default to gpt-5-mini - latest OpenAI model
    
    // Get current categories
    const { categories } = await chrome.storage.sync.get(['categories']);
    
    const prompt = `
You are helping the CEO of Coder, a software startup that makes AI development infrastructure. Your job is to transform the selected text into an engaging LinkedIn post that builds awareness for Coder and establishes thought leadership.

Content to transform: "${contentData.selectedText}"
Source URL: ${contentData.sourceUrl}
Page Title: "${contentData.pageTitle}"
${contentData.author ? `Original Author: ${contentData.author}` : ''}

Create a LinkedIn post following these guidelines:
1. Start with a short, punchy opening sentence or rhetorical question that hooks readers
2. Write in a conversational tone that's engaging and approachable
3. Keep the post between 1,000-2,000 characters (aim for the sweet spot around 1,500)
4. Include relevant emojis to make it visually appealing (but don't overdo it)
5. Weave in how this relates to AI development, developer experience, or infrastructure when relevant
6. Include attribution to the original author/source naturally within the post
7. End with a thought-provoking question or insight to encourage engagement
8. NO hashtags needed

The post should feel authentic and position me as someone who deeply understands developer challenges and the future of AI-powered development.

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
          'LinkedIn Post': {
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
              start: summaryData.timestamp.split('T')[0]
            }
          }
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status}`);
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