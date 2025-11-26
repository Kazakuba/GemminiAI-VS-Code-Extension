export interface ToolRequest {
    type: "READ_FILE" | "WRITE_FILE" | "RUN_COMMAND";
    path?: string;
    content?: string;
    command?: string;
}

export interface GemminiResponse {
    choices?: Array<{ message?: { content?: string } }>;
    [k: string]: any;
}
