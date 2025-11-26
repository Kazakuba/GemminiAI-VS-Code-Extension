import * as vscode from "vscode";

export function getHtmlForWebview(chatHistory: string[]): string {
    const historyJson = JSON.stringify(chatHistory);
    const workspaceName = vscode.workspace.workspaceFolders?.[0]?.name || "No Workspace";
    return `
      <html>
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy"
              content="default-src 'none';
                       img-src https: data:;
                       style-src 'unsafe-inline' https:;
                       script-src 'unsafe-inline' https:;
                       font-src https: data:;">
        <script src="https://cdn.jsdelivr.net/npm/markdown-it@13.0.1/dist/markdown-it.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/lib/common.min.js"></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github-dark.min.css">
        <style>
          :root {
            --gap: 8px;
            --radius: 6px;
            --user-bg: var(--vscode-button-secondaryBackground);
            --ai-bg: var(--vscode-editor-inactiveSelectionBackground);
            --border: var(--vscode-editorWidget-border);
          }
          html, body {
            height: 100%; margin: 0; padding: 0;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            display: flex; flex-direction: column;
            font-size: 13px;
            line-height: 1.5;
          }
          #container { flex: 1; display: flex; flex-direction: column; padding: 12px; max-width: 100%; box-sizing: border-box; }
          
          #header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border);
          }
          #title {
            font-weight: 600;
            font-size: 1.1em;
            color: var(--vscode-editor-foreground);
            display: flex; align-items: center; gap: 6px;
          }
          #title::before { content: "✨"; }

          #history {
            flex: 1; overflow-y: auto;
            display: flex; flex-direction: column; gap: 12px;
            padding-right: 4px;
          }
          /* Custom Scrollbar */
          #history::-webkit-scrollbar { width: 6px; }
          #history::-webkit-scrollbar-track { background: transparent; }
          #history::-webkit-scrollbar-thumb { background-color: var(--vscode-scrollbarSlider-background); border-radius: 3px; }
          #history::-webkit-scrollbar-thumb:hover { background-color: var(--vscode-scrollbarSlider-hoverBackground); }

          .message {
            padding: 10px 12px;
            border-radius: var(--radius);
            max-width: 90%;
            word-wrap: break-word;
            animation: fadeIn 0.2s ease-out;
          }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

          .user {
            align-self: flex-end;
            background: var(--user-bg);
            border-bottom-right-radius: 2px;
          }
          .ai {
            align-self: flex-start;
            background: var(--ai-bg);
            border-bottom-left-radius: 2px;
          }
          
          .role-label {
            font-size: 0.85em;
            opacity: 0.7;
            margin-bottom: 4px;
            font-weight: 600;
          }

          pre, code {
            background-color: var(--vscode-textBlockQuote-background);
            color: var(--vscode-textBlockQuote-border);
            border-radius: 4px;
            font-family: var(--vscode-editor-font-family);
            font-size: 0.9em;
          }
          pre { padding: 8px; overflow-x: auto; margin: 8px 0; border: 1px solid var(--border); }
          code { padding: 2px 4px; }
          pre code { padding: 0; border: none; background: transparent; color: inherit; }

          #inputRow {
            display: flex;
            flex-direction: row;
            align-items: flex-end;
            gap: 8px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid var(--border);
          }

          #prompt {
            flex: 1;
            padding: 8px 10px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 6px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: inherit;
            resize: none;
            min-height: 36px;
            box-sizing: border-box;
          }
          #prompt:focus { outline: 1px solid var(--vscode-focusBorder); border-color: var(--vscode-focusBorder); }

          .actions {
            display: flex;
            align-items: center;
            flex-shrink: 0;
          }

          
          button {
            padding: 6px 14px;
            border: none; border-radius: 4px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            cursor: pointer;
            font-weight: 500;
            transition: opacity 0.2s;
          }
          button:hover { opacity: 0.9; }
          button.secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
          }
          
          .buttonRow { margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap; }
        </style>
      </head>
      <body>
        <div id="container">
          <div id="header">
            <span id="title">Gemmini Chat - ${workspaceName}</span>
            <div style="display: flex; gap: 8px;">
              <button id="changeFolderBtn" class="secondary" title="Change workspace folder">📁 Change Folder</button>
              <button id="newChatBtn" class="secondary" title="Clear conversation">New Chat</button>
            </div>
          </div>

          <div id="history"></div>

          <div id="inputRow">
          <textarea id="prompt" rows="1" placeholder="Ask Gemmini..."></textarea>
          <div class="actions">
            <button id="sendBtn">Send</button>
          </div>
        </div>
        </div>

        <script>
          const vscode = acquireVsCodeApi();
          const md = window.markdownit({ breaks: true });
          const history = ${historyJson};
          const historyDiv = document.getElementById('history');
          const input = document.getElementById('prompt');

          // Auto-resize textarea
          input.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            if(this.value === '') this.style.height = 'auto';
          });

          function renderMessage(role, content) {
            const isUser = role === "user";
            const div = document.createElement('div');
            div.className = 'message ' + (isUser ? 'user' : 'ai');
            
            const roleLabel = document.createElement('div');
            roleLabel.className = 'role-label';
            roleLabel.textContent = isUser ? "You" : "Gemmini";
            
            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = md.render(content);
            
            div.appendChild(roleLabel);
            div.appendChild(contentDiv);
            historyDiv.appendChild(div);
            historyDiv.scrollTop = historyDiv.scrollHeight;
          }

          history.forEach(raw => {
            try {
              const item = JSON.parse(raw);
              renderMessage(item.role, item.content);
            } catch {}
          });

          if (window.hljs) hljs.highlightAll();

          const sendBtn = document.getElementById('sendBtn');
          const newChatBtn = document.getElementById('newChatBtn');
          const changeFolderBtn = document.getElementById('changeFolderBtn');

          function send() {
            const text = input.value.trim();
            if (text) {
              renderMessage("user", text); // Optimistic update
              vscode.postMessage({ command: 'send', text });
              input.value = '';
              input.style.height = 'auto';
            }
          }

          sendBtn.addEventListener('click', send);
          input.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
          });
          newChatBtn.addEventListener('click', () => {
             historyDiv.innerHTML = '';
             vscode.postMessage({ command: 'newChat' });
          });
          changeFolderBtn.addEventListener('click', () => {
             vscode.postMessage({ command: 'changeFolder' });
          });

          // Handle inline preview/accept/reject UI
          window.addEventListener('message', event => {
            const msg = event.data;
            if (msg.command === 'showActions') {
              const wrapper = document.createElement('div');
              wrapper.className = 'message ai';
              wrapper.innerHTML = \`
                <div class="role-label">Gemmini Suggestion</div>
                <pre><code>\${msg.code}</code></pre>
                <div class="buttonRow">
                  <button id="previewBtn" class="secondary">Preview</button>
                  <button id="acceptBtn">Accept</button>
                  <button id="rejectBtn" class="secondary">Reject</button>
                </div>
              \`;
              historyDiv.appendChild(wrapper);
              historyDiv.scrollTop = historyDiv.scrollHeight;

              wrapper.querySelector('#previewBtn').onclick = () =>
                vscode.postMessage({ command: 'previewInline', code: msg.code });

              wrapper.querySelector('#acceptBtn').onclick = () => {
                vscode.postMessage({ command: 'acceptInline', code: msg.code });
                wrapper.remove();
              };

              wrapper.querySelector('#rejectBtn').onclick = () => {
                wrapper.remove();
              };

              if (window.hljs) hljs.highlightAll();
            } else if (msg.command === 'reviewWrite') {
              const wrapper = document.createElement('div');
              wrapper.className = 'message ai';
              wrapper.style.border = '1px solid var(--vscode-charts-orange)';
              wrapper.innerHTML = \`
                <div class="role-label">⚠️ Review File Write: \${msg.path}</div>
                <pre><code>\${msg.content}</code></pre>
                <div class="buttonRow">
                  <button id="approveBtn" style="background: var(--vscode-charts-green); color: white;">Approve Write</button>
                  <button id="rejectWriteBtn" class="secondary">Reject</button>
                </div>
              \`;
              historyDiv.appendChild(wrapper);
              historyDiv.scrollTop = historyDiv.scrollHeight;

              wrapper.querySelector('#approveBtn').onclick = () => {
                vscode.postMessage({ command: 'approveWrite', path: msg.path, content: msg.content });
                wrapper.remove();
                renderMessage("ai", "✅ File written: " + msg.path);
              };

              wrapper.querySelector('#rejectWriteBtn').onclick = () => {
                wrapper.remove();
                renderMessage("ai", "❌ Write rejected for: " + msg.path);
              };

              if (window.hljs) hljs.highlightAll();
            }
          });
        </script>
      </body>
      </html>`;
}
