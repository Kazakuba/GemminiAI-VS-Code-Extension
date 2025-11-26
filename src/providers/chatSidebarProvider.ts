import * as vscode from "vscode";
import { askGemmini } from "../services/aiClient";
import { getWorkspaceFileTree } from "../utils/contextProvider";
import { ToolHandler } from "../utils/toolHandler";
import { getHtmlForWebview } from "../views/chatWebview";

export class ChatSidebarProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = "gemminiChatSidebar";
    private _view?: vscode.WebviewView;
    public chatHistory: string[] = [];
    private toolHandler: ToolHandler;

    constructor(private context: vscode.ExtensionContext) {
        this.chatHistory = context.globalState.get<string[]>("gemminiChatHistory") ?? [];
        this.toolHandler = new ToolHandler();
    }

    private saveHistory() {
        this.context.globalState.update("gemminiChatHistory", this.chatHistory);
    }

    resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;
        webviewView.webview.options = { enableScripts: true };
        this.updateWebview();

        webviewView.webview.onDidReceiveMessage(async (msg: any) => {
            const apiKey = vscode.workspace.getConfiguration().get<string>("gemminiAi.apiKey") ?? "";
            try {
                switch (msg.command) {
                    case "send":
                        await this.sendMessage(apiKey, msg.text);
                        break;

                    case "newChat":
                        this.chatHistory = [];
                        this.saveHistory();
                        this.updateWebview();
                        break;

                    case "previewInline":
                        if (msg.code) {
                            const editor = vscode.window.activeTextEditor;
                            if (editor) {
                                const doc = await vscode.workspace.openTextDocument({
                                    content: msg.code,
                                    language: editor.document.languageId,
                                });
                                await vscode.commands.executeCommand(
                                    "vscode.diff",
                                    editor.document.uri,
                                    doc.uri,
                                    "Gemmini Suggestion"
                                );
                            }
                        }
                        break;

                    case "acceptInline":
                        if (msg.code) {
                            const editor = vscode.window.activeTextEditor;
                            if (editor) {
                                await editor.edit(editBuilder => {
                                    const fullRange = editor.selection.isEmpty
                                        ? new vscode.Range(
                                            editor.document.positionAt(0),
                                            editor.document.positionAt(editor.document.getText().length)
                                        )
                                        : editor.selection;
                                    editBuilder.replace(fullRange, msg.code);
                                });
                                vscode.window.showInformationMessage("Applied Gemmini suggestion ✅");
                            }
                        }
                        break;

                    case "approveWrite":
                        if (msg.path && msg.content) {
                            await this.toolHandler.executeWriteFile(msg.path, msg.content);
                            vscode.window.showInformationMessage(`File written: ${msg.path} ✅`);
                        }
                        break;

                    case "changeFolder":
                        const result = await vscode.window.showInformationMessage(
                            "Opening a new folder will start a fresh chat with new context/tokens. Continue?",
                            "Open Folder",
                            "Cancel"
                        );
                        if (result === "Open Folder") {
                            this.chatHistory = [];
                            this.saveHistory();
                            await vscode.commands.executeCommand("vscode.openFolder");
                        }
                        break;
                }
            } catch (err) {
                vscode.window.showErrorMessage("Gemmini message handling failed: " + (err as Error).message);
            }
        });
    }

    public async sendMessage(apiKey: string, prompt: string) {
        try {
            const editor = vscode.window.activeTextEditor;
            let contextText = "";

            if (editor) {
                const selection = editor.selection;
                contextText = selection.isEmpty
                    ? editor.document.getText()
                    : editor.document.getText(selection);
            }

            const workspaceTree = await getWorkspaceFileTree();
            console.log("[Gemmini] Workspace tree gathered, length:", workspaceTree.length);

            const chatMsgs = this.chatHistory.map(line => {
                try {
                    const parsed = JSON.parse(line);
                    return parsed;
                } catch {
                    return { role: "assistant", content: line };
                }
            });

            this.chatHistory.push(JSON.stringify({ role: "user", content: prompt }));
            this.saveHistory();
            this.updateWebview();

            const processResponse = async (currentPrompt: string, currentContext: string, isToolOutput = false) => {
                const reply = await askGemmini(
                    apiKey,
                    currentPrompt,
                    currentContext,
                    workspaceTree,
                    chatMsgs
                );

                const toolRequest = this.toolHandler.parseResponse(reply);

                if (toolRequest) {
                    if (toolRequest.type === "READ_FILE" && toolRequest.path) {
                        const content = await this.toolHandler.handleReadFile(toolRequest.path);
                        chatMsgs.push({ role: "assistant", content: reply });
                        chatMsgs.push({ role: "system", content });

                        await processResponse("Continue based on the file content.", "", true);
                        return;
                    } else if (toolRequest.type === "WRITE_FILE" && toolRequest.path && toolRequest.content) {
                        if (this._view) {
                            this._view.webview.postMessage({
                                command: "reviewWrite",
                                path: toolRequest.path,
                                content: toolRequest.content
                            });
                        }
                        return;
                    }
                }

                this.chatHistory.push(JSON.stringify({ role: "assistant", content: reply }));
                this.saveHistory();
                this.updateWebview();

                setTimeout(() => {
                    const matches = [...reply.matchAll(/```[\w-]*\n([\s\S]*?)```/g)];
                    if (!matches.length || !this._view) return;

                    if (!toolRequest) {
                        const first = matches[0][1].trim();
                        this._view.webview.postMessage({
                            command: "showActions",
                            code: first,
                        });
                    }
                }, 150);
            };

            await processResponse(prompt, contextText);

        } catch (err: any) {
            vscode.window.showErrorMessage("Gemmini request failed: " + err.message);
        }
    }

    private updateWebview() {
        if (!this._view) return;
        this._view.webview.html = getHtmlForWebview(this.chatHistory);
    }
}
