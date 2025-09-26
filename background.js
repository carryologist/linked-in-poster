// Background service worker for Newsletter Generator

// Store the last processed result
let lastProcessedResult = null;

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
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'capture-for-linkedin') {
    try {
      // Get selected text
      const selectedText = info.selectionText;
      
      if (!selectedText) {
        console.error('No text selected');
        return;
      }
      
      // Process with AI
      const result = await processContentWithAI({
        selectedText,
        sourceUrl: tab.url,
        pageTitle: tab.title
      });
      
      // Store the result for the popup
      lastProcessedResult = result;
      console.log('Stored result for popup:', lastProcessedResult);
      
      // Open the popup
      chrome.action.openPopup();
      
    } catch (error) {
      console.error('Error in context menu handler:', error);
      // Show error notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.svg',
        title: 'Error',
        message: error.message
      });
    }
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


// Message handler for popup and other communications
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processContent') {
    processContentWithAI(request.data)
      .then(result => {
        lastProcessedResult = result; // Store for popup
        sendResponse({ success: true, data: result });
      })
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'getStoredResult') {
    // Return the last processed result to the popup
    sendResponse({ success: true, data: lastProcessedResult });
    return false; // Synchronous response
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
    
    // Available models as of 2025:
    // - gpt-5 (best for coding and complex tasks)
    // - gpt-5-mini (faster, cost-efficient)
    // - gpt-5-nano (fastest, most cost-efficient)
    // - gpt-4.1 (previous generation, still very capable)
    // - gpt-4o (older multimodal model)
    // - gpt-4o-mini (older cost-efficient model)
    const selectedModel = openaiModel || 'gpt-5-mini'; // Default to gpt-5-mini for balance of quality and cost
    
    // Get current categories
    const { categories } = await chrome.storage.sync.get(['categories']);
    
    const prompt = `
You are helping the CEO of Coder, a software startup that makes AI development infrastructure. Transform the selected text into an engaging LinkedIn post.

Content to transform: "${contentData.selectedText}"
Source URL: ${contentData.sourceUrl}
Page Title: "${contentData.pageTitle}"
${contentData.author ? `Original Author: ${contentData.author}` : ''}

IMPORTANT: You MUST respond with a valid JSON object in this exact format:
{
  "linkedinPost": "[Your LinkedIn post here with emojis]",
  "characterCount": [number],
  "category": "[Choose ONE from: ${categories.join(', ')}]",
  "isNewCategory": false
}

Guidelines for the LinkedIn post:
1. Start with a hook - insight, bold claim, metric, or provocative statement
2. Conversational tone, 1000-2000 characters
3. Include relevant emojis
4. Include attribution to source
5. End with question or actionable takeaway

Generate the LinkedIn post now and return ONLY the JSON object above.`;
    
    console.log('Using model:', selectedModel); // Debug logging
    
    // Determine which token parameter to use based on model
    const isGPT5Model = selectedModel && (
      selectedModel.toLowerCase().includes('gpt-5') || 
      selectedModel.toLowerCase().includes('gpt5')
    );
    
    const apiBody = {
      model: selectedModel,
      messages: [{
        role: 'user',
        content: prompt
      }]
    };
    
    // Add the appropriate parameters based on model type
    if (isGPT5Model) {
      apiBody.max_completion_tokens = 500;
      // GPT-5 models only support default temperature (1), so we don't set it
      console.log('Using max_completion_tokens for GPT-5 model (no temperature)');
    } else {
      apiBody.max_tokens = 500;
      apiBody.temperature = 0.3; // Only set temperature for non-GPT-5 models
      console.log('Using max_tokens for non-GPT-5 model with temperature 0.3');
    }
    
    console.log('API request body:', JSON.stringify(apiBody)); // Debug logging
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify(apiBody)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error response:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }
    
    const data = await response.json();
    console.log('OpenAI API response:', JSON.stringify(data)); // Debug the raw response
    
    let aiResult;
    try {
      const messageContent = data.choices[0].message.content;
      console.log('Message content to parse:', messageContent); // Debug what we're trying to parse
      
      aiResult = JSON.parse(messageContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw content:', data.choices[0].message.content);
      
      // Fallback: If GPT-5 isn't returning JSON, create a structured response
      // This might happen with temperature=1 making the output less structured
      const rawContent = data.choices[0].message.content;
      aiResult = {
        linkedinPost: rawContent,
        summary: rawContent,
        category: categories[0] || '🚀 Developer Productivity',
        isNewCategory: false,
        characterCount: rawContent.length
      };
      console.log('Using fallback structure for non-JSON response');
    }
    
    // Ensure we only have one category (in case AI returns multiple)
    if (aiResult.category && aiResult.category.includes(',')) {
      // If multiple categories are returned, take only the first one
      aiResult.category = aiResult.category.split(',')[0].trim();
    }
    
    // Ensure we have the LinkedIn post content in the expected field
    if (!aiResult.linkedinPost && aiResult.summary) {
      aiResult.linkedinPost = aiResult.summary;
    }
    
    const finalResult = {
      ...aiResult,
      originalText: contentData.selectedText,
      sourceUrl: contentData.sourceUrl,
      timestamp: new Date().toISOString()
    };
    
    console.log('Final result to return:', finalResult);
    return finalResult;
    
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
