import * as vscode from "vscode";
import * as path from "path";
import { spawn } from "child_process";

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand("mcp-ansible-drupal.start", () => {
		const serverPath = path.join(context.extensionPath, "dist", "server.js");

		const mcpServer = spawn("node", [serverPath], {
			stdio: "inherit",
		});

		vscode.window.showInformationMessage("MCP Ansible-Drupal Server started!");

		context.subscriptions.push({
			dispose: () => mcpServer.kill(),
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
