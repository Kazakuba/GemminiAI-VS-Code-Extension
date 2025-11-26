# Gemmini AI - VS Code Extension

My take on Cursor/Windsurf/Antigravity, but better because it's an extension leveraging Google's Gemini language model to provide code suggestions, file operations, and context-aware assistance.

## ✨ Features

### 🤖 Agentic Capabilities
- **Smart File Reading**: AI can autonomously read files in your workspace to understand context
- **Safe File Writing**: AI can propose file creations and edits with mandatory user approval
- **Context-Aware**: Automatically includes workspace structure in every request
- **Tool-Based Architecture**: Extensible system for adding new AI capabilities

### 🛡️ Safety Features
- **Approval Required**: All file write operations require explicit user confirmation
- **Sandbox Security**: File operations limited to workspace directory
- **Review UI**: Visual review interface for proposed changes

## 📦 Installation

### From VSIX (Recommended)
1. Download the latest `.vsix` file from releases
2. Open VS Code
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
4. Type "Extensions: Install from VSIX"
5. Select the downloaded `.vsix` file

### From Source
```bash
# Clone the repository
git clone https://github.com/yourusername/vscode-gemmini-ai.git
cd vscode-gemmini-ai

# Install dependencies
npm install

# Compile the extension
npm run compile

# Package the extension (optional)
npm run package
```

## ⚙️ Configuration

### 1. Get a Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key

### 2. Configure the Extension
1. Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "Gemmini AI"
3. Paste your API key in `Gemmini AI: Api Key`

## 🚀 Usage

### Opening the Chat
1. Click the **Gemmini AI** icon in the Activity Bar (left sidebar)
2. Or press `Ctrl+Shift+P` and run "Gemmini: Open Chat"

### Basic Interaction
Simply type your question or request in the chat input and press Enter.

**Examples:**
```
"Explain this code"
"Refactor this function to use async/await"
"Add error handling to the selected code"
```

### Using Agentic Features

#### Reading Files
The AI can read files to understand context:
```
"What's in package.json?"
"Read the authentication logic in src/auth.ts and explain it"
```

The AI will automatically use the `READ_FILE` tool to access the file content.

#### Writing Files
The AI can create or modify files:
```
"Create a new utility file src/utils/logger.ts with basic logging functions"
"Update the README with installation instructions"
```

**Approval Flow:**
1. AI proposes the file change
2. You see a "⚠️ Review File Write" block in the chat
3. Click "Approve Write" to apply, or "Reject" to cancel

### Workspace Management

#### Change Folder
Click the "📁 Change Folder" button to:
- Open a different workspace
- Start a fresh chat with new context
- Clear previous conversation history

#### New Chat
Click "New Chat" to clear the conversation while keeping the same workspace.

## 🏗️ Architecture

### Core Components

```
src/
├── extension.ts        # Main extension logic & UI
├── aiClient.ts         # Gemini API integration
├── toolHandler.ts      # Agentic tool system
└── contextProvider.ts  # Workspace context gathering
```

### Tool System
The extension uses a tool-based architecture where the AI can request actions:

- **READ_FILE**: Read file content from workspace
- **WRITE_FILE**: Propose file creation/modification
- **RUN_COMMAND**: Execute terminal commands

Each tool follows a request → review → execute pattern for safety.

### Context Flow
1. User sends a message
2. Extension gathers workspace file tree
3. Context + message sent to Gemini
4. AI responds with text or tool requests
5. Tool requests are processed and may loop back to AI

## 🔐 Security & Privacy

### Data Handling
- **API Key**: Stored securely in VS Code settings
- **No Telemetry**: No analytics or tracking

### Safety Measures
- **Workspace Boundary**: Cannot access files outside your workspace
- **User Approval**: Required for all file modifications
- **Review Before Execute**: All changes shown before application

## 🛠️ Development

### Prerequisites
- Node.js 16+
- VS Code 1.80+
- TypeScript 5.0+

### Setup
```bash
npm install
npm run compile
```

### Testing
```bash
# Watch mode for development
npm run watch

# Run the extension
# Press F5 in VS Code to launch Extension Development Host
```

### Building
```bash
# Create VSIX package
npm run package

# Output: gemmini-ai-0.0.4.vsix
```

## 📝 Configuration Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `gemminiAi.apiKey` | string | `""` | Your Gemini API key |
| `gemminiAi.model` | string | `"gemini-pro"` | Gemini model to use |
| `gemminiAi.maxTokens` | number | `2048` | Maximum response tokens |
| `gemminiAi.temperature` | number | `0.7` | Response creativity (0-1) |