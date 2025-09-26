// Example: Using OpenAI Assistants API instead of Chat Completions
// This would replace the current prompt-based approach

// STEP 1: Create an Assistant (do this once, via OpenAI Playground or API)
const createLinkedInAssistant = async () => {
  const response = await fetch('https://api.openai.com/v1/assistants', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({
      name: "LinkedIn Post Generator",
      instructions: `You are helping the CEO of Coder, a software startup that makes AI development infrastructure. 
      Your job is to transform selected text into engaging LinkedIn posts...
      [Your full prompt here]
      Always respond in JSON format with linkedinPost, characterCount, and category fields.`,
      model: "gpt-4o",
      tools: [],
      temperature: 0.7
    })
  });
  
  const assistant = await response.json();
  console.log('Assistant created:', assistant.id);
  // Save this ID - you'll use it for all future requests
  return assistant.id;
};

// STEP 2: Use the Assistant in your extension
const generateLinkedInPost = async (contentData) => {
  const ASSISTANT_ID = 'asst_xxx'; // Your assistant ID from step 1
  
  // Create a thread
  const threadResponse = await fetch('https://api.openai.com/v1/threads', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    }
  });
  const thread = await threadResponse.json();
  
  // Add a message to the thread
  await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({
      role: 'user',
      content: `Content to transform: "${contentData.selectedText}"
                Source URL: ${contentData.sourceUrl}
                Page Title: "${contentData.pageTitle}"
                ${contentData.author ? `Original Author: ${contentData.author}` : ''}`
    })
  });
  
  // Run the assistant
  const runResponse = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2'
    },
    body: JSON.stringify({
      assistant_id: ASSISTANT_ID
    })
  });
  const run = await runResponse.json();
  
  // Poll for completion
  let runStatus = run;
  while (runStatus.status !== 'completed') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const statusResponse = await fetch(
      `https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`,
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      }
    );
    runStatus = await statusResponse.json();
    
    if (runStatus.status === 'failed') {
      throw new Error('Assistant run failed');
    }
  }
  
  // Get the assistant's response
  const messagesResponse = await fetch(
    `https://api.openai.com/v1/threads/${thread.id}/messages`,
    {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    }
  );
  const messages = await messagesResponse.json();
  
  // Parse the assistant's response
  const assistantMessage = messages.data[0].content[0].text.value;
  const result = JSON.parse(assistantMessage);
  
  return result;
};

// BENEFITS of using Assistants API:
// 1. Centralized prompt management - update in OpenAI Playground, not code
// 2. Can upload knowledge files (your best LinkedIn posts, style guides)
// 3. Persistent threads for context
// 4. Better handling of complex instructions
// 5. Can add tools like web browsing or code interpreter

// DRAWBACKS:
// 1. More complex API calls (threads, runs, polling)
// 2. Slightly higher latency due to polling
// 3. Different pricing model
// 4. Still requires API key management