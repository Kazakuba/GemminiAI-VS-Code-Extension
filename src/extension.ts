import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ChatSidebarProvider } from "./providers/chatSidebarProvider";
import { ChangesViewProvider } from "./providers/changesViewProvider";

const HISTORY_DIR = ".aichanges";

export function activate(context: vscode.ExtensionContext) {
  const changesProvider = new ChangesViewProvider(context);
  vscode.window.registerTreeDataProvider("gemminiChanges", changesProvider);

  const chatProvider = new ChatSidebarProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatSidebarProvider.viewType, chatProvider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(doc => {
      try {
        const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!root) return;
        const rel = path.relative(root, doc.fileName);
        const historyDir = path.join(root, HISTORY_DIR);
        fs.mkdirSync(historyDir, { recursive: true });
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        const fname = `${rel.replace(/[\\/]/g, "__")}__${ts}.bak`;
        fs.copyFileSync(doc.fileName, path.join(historyDir, fname));
        changesProvider.refresh();
      } catch { }
    })
  );
}

export function deactivate() { }
