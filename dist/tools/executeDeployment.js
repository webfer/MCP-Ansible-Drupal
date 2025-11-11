/**
 * executeDeployment.ts
 * --------------------
 * Executes the Ansible deployment playbook for the given environment.
 * Streams logs to MCP chat and saves logs to tools/tmp/logs.
 * Keeps only the last 3 deployment logs.
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
    // Step 6: Prepare Ansible command
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
    // Step 6a: Prepare log file in tools/tmp/logs
    const logDir = path.resolve(projectRoot, 'tools/tmp/logs');
    if (!fs.existsSync(logDir))
        fs.mkdirSync(logDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15);
    const logFile = path.join(logDir, `ansible-${timestamp}.log`);
    messages.push({
        type: 'text',
        text: `📁 Deployment logs will be saved to: ${logFile}`,
    });
    messages.push({
        type: 'text',
        text: `[DEBUG] Full command: ${ansibleCmd.join(' ')}`,
    });
    messages.push({
        type: 'text',
        text: `🚀 Executing deployment: ${skipTagsData.description}`,
    });
    // Step 7: Execute deployment with live streaming
    process.env.ANSIBLE_LOG_PATH = logFile;
    const ansibleResult = await runAnsible(ansibleCmd, projectRoot, (line) => {
        messages.push({ type: 'text', text: line });
        console.error(`${normalizedEnv} ${line}`);
    });
    // Step 8: Rotate logs (keep only last 3)
    const files = fs
        .readdirSync(logDir)
        .filter((f) => f.startsWith('ansible') && f.endsWith('.log'))
        .sort((a, b) => fs.statSync(path.join(logDir, b)).mtimeMs -
        fs.statSync(path.join(logDir, a)).mtimeMs);
    if (files.length > 3) {
        const oldFiles = files.slice(3);
        for (const old of oldFiles) {
            fs.unlinkSync(path.join(logDir, old));
            console.error(JSON.stringify({
                type: 'info',
                message: `🧹 Removed old log file: ${old}`,
            }));
        }
    }
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
