import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ToolRequest } from "../types/interfaces";


export class ToolHandler {
    constructor() { }

    public parseResponse(response: string): ToolRequest | null {

        const writeMatch = response.match(/WRITE_FILE:\s*([^\n]+)\n```[\w-]*\n([\s\S]*?)```/);
        if (writeMatch) {
            return {
                type: "WRITE_FILE",
                path: writeMatch[1].trim(),
                content: writeMatch[2]
            };
        }

        const readMatch = response.match(/READ_FILE:\s*([^\n]+)/);
        if (readMatch) {
            return {
                type: "READ_FILE",
                path: readMatch[1].trim()
            };
        }

        const cmdMatch = response.match(/RUN_COMMAND:\s*([^\n]+)/);
        if (cmdMatch) {
            return {
                type: "RUN_COMMAND",
                command: cmdMatch[1].trim()
            };
        }

        return null;
    }

    public async handleReadFile(filePath: string): Promise<string> {
        try {
            const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (!root) return "Error: No workspace open.";

            const fullPath = path.join(root, filePath);

            if (!fullPath.startsWith(root)) {
                return "Error: Access denied. Cannot read files outside workspace.";
            }

            if (!fs.existsSync(fullPath)) {
                return `Error: File not found: ${filePath}`;
            }

            const content = fs.readFileSync(fullPath, "utf-8");
            return `\n\n[SYSTEM] Content of ${filePath}:\n\`\`\`\n${content}\n\`\`\`\n\n`;
        } catch (err: any) {
            return `Error reading file: ${err.message}`;
        }
    }

    public async executeWriteFile(filePath: string, content: string): Promise<void> {
        const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!root) throw new Error("No workspace open.");

        const fullPath = path.join(root, filePath);

        if (!fullPath.startsWith(root)) {
            throw new Error("Access denied. Cannot write files outside workspace.");
        }

        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(fullPath, content, "utf-8");
    }
}
