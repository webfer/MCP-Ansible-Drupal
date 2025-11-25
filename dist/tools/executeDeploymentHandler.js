import { ExecuteDeploymentTool } from './executeDeployment.js';
import path from 'path';
export async function handleExecuteDeploymentRequest(args) {
    const tool = new ExecuteDeploymentTool();
    const safeArgs = {
        projectRoot: path.resolve(process.cwd()),
        environment: args.environment,
        action: args.action ?? 'install',
        withAssets: args.withAssets,
        ansibleVaultPassFile: args.ansibleVaultPassFile,
        extraVars: args.extraVars,
    };
    const messages = [
        {
            type: 'text',
            text: `[DEBUG] Running executeDeployment with args: ${JSON.stringify(safeArgs)}`,
        },
    ];
    try {
        const result = await tool.run(safeArgs);
        // Include command & output in messages
        messages.push({
            type: 'text',
            text: `✅ Command executed: ${result.command}`,
        });
        messages.push({
            type: 'text',
            text: `Output:\n${result.output}`,
        });
        if (result.errorOutput) {
            messages.push({
                type: 'text',
                text: `Error Output:\n${result.errorOutput}`,
            });
        }
        return { content: messages };
    }
    catch (error) {
        messages.push({
            type: 'text',
            text: `❌ Deployment failed: ${error.message}`,
        });
        return { content: messages };
    }
}
