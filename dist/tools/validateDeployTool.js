/**
 * validateDeployTool.ts
 * ---------------------
 * MCP Tool for validating and executing Drupal deployments via Ansible.
 */
import { executeDeployment } from './executeDeployment.js';
export class ValidateDeployTool {
    name = 'validateDeploy';
    description = 'Validates and executes the Drupal Ansible deployment process.';
    /**
     * Executes the validation + deployment pipeline.
     */
    async run(args = {}) {
        if (!args || !args.environment || !args.action) {
            throw new Error('Missing required parameters: environment and action');
        }
        try {
            const result = await executeDeployment({
                environment: args.environment,
                action: args.action,
                withAssets: args.withAssets ?? false,
                projectRoot: args.projectRoot || process.cwd(),
                ansibleVaultPassFile: args.ansibleVaultPassFile,
                extraVars: args.extraVars,
            });
            if (result.success) {
                return {
                    content: [
                        { type: 'text', text: `✅ Deployment executed successfully.` },
                        { type: 'text', text: `Command: ${result.command}` },
                        { type: 'text', text: result.output },
                    ],
                };
            }
            else {
                return {
                    content: [
                        { type: 'text', text: `❌ Deployment failed.` },
                        { type: 'text', text: `Command: ${result.command}` },
                        { type: 'text', text: result.errorOutput || 'Unknown error' },
                    ],
                };
            }
        }
        catch (error) {
            return {
                content: [
                    { type: 'text', text: `💥 Deployment error: ${error.message}` },
                ],
            };
        }
    }
}
