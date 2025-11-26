import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export async function getWorkspaceFileTree(): Promise<string> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) return "";

    const rootPath = folders[0].uri.fsPath;
    const ignoreList = [
        "node_modules",
        ".git",
        "out",
        "dist",
        ".vscode",
        ".DS_Store",
        "package-lock.json",
        "yarn.lock"
    ];

    let tree = "Current Workspace Files:\n";

    const walk = (dir: string, depth: number) => {
        if (depth > 5) return;
        try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                if (ignoreList.includes(file)) continue;

                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                const indent = "  ".repeat(depth);

                if (stat.isDirectory()) {
                    tree += `${indent}📂 ${file}/\n`;
                    walk(fullPath, depth + 1);
                } else {
                    tree += `${indent}📄 ${file}\n`;
                }
            }
        } catch (e) {
        }
    };

    walk(rootPath, 0);
    return tree;
}
