/**
 * executeDeployment.ts
 * --------------------
 * Executes the Ansible deployment playbook for the given environment.
 * It uses validated configuration, verified vault file, resolved paths,
 * generated skip-tags, and streams logs using runAnsible helper.
 */
import path from 'path';
import fs from 'fs';
import { resolveProjectPaths } from './resolveProjectPaths.js';
import { generateSkipTags } from './generateSkipTags.js';
import { validateDeployConfig } from './validateDeployConfig.js';
import { verifyVaultFile } from './verifyVaultFile.js';
import { runAnsible } from '../helpers/index.js';
/**
 * Executes an Ansible deployment for the given environment and action.
 */
export async function ExecuteDeployment(options) {
    const messages = [];
    const projectRoot = options.projectRoot || process.cwd();
    const action = options.action || 'install';
    // Step 0: Normalize environment
    let normalizedEnv;
    if (options.environment === 'stage') {
        normalizedEnv = 'stage';
    }
    else if (options.environment === 'live' ||
        options.environment === 'production') {
        normalizedEnv = 'live';
    }
    else {
        const errMsg = `Invalid environment: "${options.environment}". Expected "stage" or "live".`;
        messages.push({ type: 'text', text: `❌ ${errMsg}` });
        const error = new Error(errMsg);
        error.messages = messages;
        throw error;
    }
    messages.push({
        type: 'text',
        text: `✅ Normalized environment: ${options.environment} → ${normalizedEnv}`,
    });
    messages.push({ type: 'text', text: `✅ Action: ${action}` });
    messages.push({ type: 'text', text: `✅ Project root: ${projectRoot}` });
    // Step 1: Validate configuration
    const validation = validateDeployConfig({
        ...options,
        environment: normalizedEnv,
        action,
    });
    if (!validation.valid) {
        const errMsg = `Invalid deploy configuration: ${validation.errors?.join(', ')}`;
        messages.push({ type: 'text', text: `❌ ${errMsg}` });
        const error = new Error(errMsg);
        error.messages = messages;
        throw error;
    }
    messages.push({
        type: 'text',
        text: '✅ Deployment configuration validated.',
    });
    // Step 2: Resolve paths
    const paths = resolveProjectPaths({
        projectRoot,
        environment: normalizedEnv,
    });
    if (!paths.valid) {
        const errMsg = `Failed to resolve project paths: ${paths.errors?.join(', ')}`;
        messages.push({ type: 'text', text: `❌ ${errMsg}` });
        const error = new Error(errMsg);
        error.messages = messages;
        throw error;
    }
    messages.push({
        type: 'text',
        text: `✅ Inventory file: ${paths.inventoryFile}`,
    });
    messages.push({
        type: 'text',
        text: `✅ Playbook file: ${paths.playbookFile}`,
    });
    // Step 3: Verify vault file
    const vaultCheck = verifyVaultFile({
        projectRoot,
        environment: normalizedEnv,
    });
    if (!vaultCheck.valid) {
        const errMsg = `Vault file invalid: ${vaultCheck.errors?.join(', ')}`;
        messages.push({ type: 'text', text: `❌ ${errMsg}` });
        const error = new Error(errMsg);
        error.messages = messages;
        throw error;
    }
    messages.push({ type: 'text', text: '✅ Vault file verified.' });
    // Step 4: Generate skip-tags
    const skipTagsData = generateSkipTags({
        environment: normalizedEnv,
        action,
        withAssets: options.withAssets,
    });
    if (!skipTagsData.valid) {
        const errMsg = `Failed to generate skip-tags: ${skipTagsData.description}`;
        messages.push({ type: 'text', text: `❌ ${errMsg}` });
        const error = new Error(errMsg);
        error.messages = messages;
        throw error;
    }
    messages.push({
        type: 'text',
        text: `✅ Skip-tags generated: ${skipTagsData.skipTags.join(', ')}`,
    });
    messages.push({
        type: 'text',
        text: `⚠️ Deploying with assets: ${options.withAssets ? 'YES' : 'NO'}`,
    });
    // Step 5: Resolve vault password file
    const vaultPassPath = options.ansibleVaultPassFile || path.join(projectRoot, 'vault_pass.txt');
    messages.push({
        type: 'text',
        text: `⚠️ Using vault password file: ${vaultPassPath}`,
    });
    if (!fs.existsSync(vaultPassPath)) {
        const errMsg = `Vault password file not found at path: ${vaultPassPath}`;
        messages.push({ type: 'text', text: `❌ ${errMsg}` });
        const error = new Error(errMsg);
        error.messages = messages;
        throw error;
    }
    // Step 6: Construct Ansible command
    const ansibleCmd = [
        'ansible-playbook',
        '-i',
        paths.inventoryFile,
        paths.playbookFile,
        '--vault-password-file',
        vaultPassPath,
        '--skip-tags',
        skipTagsData.skipTags.join(','),
    ];
    if (options.extraVars && Object.keys(options.extraVars).length > 0) {
        for (const [key, value] of Object.entries(options.extraVars)) {
            ansibleCmd.push('--extra-vars', `${key}=${value}`);
        }
    }
    messages.push({
        type: 'text',
        text: `[DEBUG] Full command: ${ansibleCmd.join(' ')}`,
    });
    messages.push({
        type: 'text',
        text: `🚀 Executing deployment: ${skipTagsData.description}`,
    });
    // Step 7: Execute deployment with streaming logs
    const ansibleResult = await runAnsible(ansibleCmd, projectRoot, (line) => {
        // Display each log line live in the MCP chat pane
        messages.push({ type: 'text', text: line });
        console.error(`${normalizedEnv} ${line}`);
    });
    // Return MCP-compatible result
    return {
        success: ansibleResult.success,
        command: ansibleCmd.join(' '),
        output: ansibleResult.stdout || '',
        errorOutput: ansibleResult.stderr || '',
        exitCode: ansibleResult.exitCode,
        messages,
    };
}
// Tool wrapper for MCP
export class ExecuteDeploymentTool {
    name = 'executeDeployment';
    description = 'Executes the initial or update Ansible deployment for the given environment.';
    async run(options) {
        const result = await ExecuteDeployment(options);
        const combined = [
            {
                type: 'text',
                text: result.success
                    ? '✅ Deployment executed successfully.'
                    : '❌ Deployment failed.',
            },
            { type: 'text', text: `Command: ${result.command}` },
            ...(result.messages ?? []).map((m) => ({ type: 'text', text: m.text })),
        ];
        return { content: combined };
    }
}
