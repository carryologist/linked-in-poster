# Newsletter Generator Chrome Extension

AI-powered Chrome extension for capturing and summarizing web content for internal newsletters.

## Features

- **Smart Content Capture**: Select text on any webpage and press `Ctrl+Shift+N` to capture
- **AI Summarization**: Automatically generates concise, newsletter-ready summaries using OpenAI GPT-4
- **Intelligent Categorization**: Categorizes content or suggests new categories
- **Notion Integration**: Saves summaries directly to your Notion database
- **Team Collaboration**: Shared category taxonomy and centralized content collection

## Setup Instructions

### 1. Install the Extension

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

### 2. Configure API Keys

1. Click the extension icon and select "Options" or right-click the extension icon → "Options"
2. Configure the following:

#### OpenAI API Key
- Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- Paste it in the "OpenAI API Key" field

#### Notion Integration
- Create a new integration at [Notion Integrations](https://www.notion.so/my-integrations)
- Copy the "Internal Integration Token" and paste it in the "Notion Integration Token" field
- Create a new database in Notion with the following properties:
  - **Title**: Title (required)
  - **Category**: Select
  - **Summary**: Rich text
  - **Source URL**: URL
  - **Date Added**: Date
  - **Contributor**: Person (optional)
- Share the database with your integration
- Copy the database ID from the URL and paste it in the "Database ID" field

### 3. Set Up Categories

The extension comes with default categories:
- Employee Milestones
- Customer Wins
- Product Announcements
- Company News
- Industry Updates
- Team Updates

You can add, remove, or modify categories in the Options page.

## Usage

1. **Select Content**: Highlight text on any webpage that you want to include in your newsletter
2. **Capture**: Press `Ctrl+Shift+N` (or `Cmd+Shift+N` on Mac)
3. **Review**: The extension popup will show:
   - Original selected text
   - AI-generated summary
   - Suggested category
4. **Edit**: Modify the summary or category as needed
5. **Save**: Click "Save to Newsletter" to add it to your Notion database

## How It Works

1. **Content Selection**: User selects relevant text on any webpage
2. **AI Processing**: OpenAI GPT-4 analyzes the content and generates a concise summary
3. **Categorization**: AI suggests the most appropriate category or proposes a new one
4. **Review Interface**: User can edit the summary and category before saving
5. **Notion Storage**: Content is saved to a structured Notion database for newsletter compilation

## Privacy & Security

- API keys are stored locally in Chrome's secure storage
- Content is only processed when explicitly triggered by the user
- No data is stored on external servers (except OpenAI for processing and Notion for storage)
- All communication uses HTTPS

## Development

### File Structure
```
newsletter-generator/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for API calls
├── content.js            # Content script for text selection
├── popup.html/js         # Review interface
├── options.html/js       # Settings page
└── icons/               # Extension icons
```

### Key Technologies
- Chrome Extension Manifest V3
- OpenAI GPT-4 API
- Notion API
- Chrome Storage API
- Chrome Scripting API

## Troubleshooting

### Extension Not Working
- Ensure all API keys are correctly configured in Options
- Check that the Notion database is shared with your integration
- Verify the database ID is correct (32-character string from Notion URL)

### AI Processing Fails
- Check your OpenAI API key and account credits
- Ensure selected text is substantial (more than 10 characters)
- Try refreshing the page and selecting text again

### Notion Saving Fails
- Verify Notion integration token and database ID
- Ensure the database has the required properties
- Check that the integration has write access to the database

## Contributing

This extension is designed for internal use but can be extended for other use cases:

1. **Additional AI Providers**: Add support for other AI APIs
2. **More Storage Options**: Integrate with Google Docs, Airtable, etc.
3. **Advanced Categorization**: Machine learning-based category suggestions
4. **Team Features**: User attribution, approval workflows

## License

Private use only. Not for redistribution.
