#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import path from 'path';
import { ListToolsRequestSchema, CallToolRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { CloneRepositoryTool, AnsibleSetUpTool, AnsibleCleanUpTool, ValidateDeployTool, DecryptVaultTool, EncryptVaultTool, } from './tools/index.js';
import { GetAnsibleDrupalRepoUrl, GetAnsibleSetupPrompt, } from './prompts/index.js';
import { ExecuteDeploymentTool } from './tools/executeDeployment.js';
const ansibleTool = new AnsibleSetUpTool();
const cleanupTool = new AnsibleCleanUpTool();
const server = new Server({
    name: 'mcp-ansible-drupal',
    version: '1.0.0',
    description: 'MCP Server for cloning and initializing the Ansible-Drupal repository.',
}, {
    capabilities: {
        tools: {},
        resources: {},
        prompts: {},
    },
});
// 🛠️ Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'cloneRepository',
            description: 'Clones the Ansible-Drupal repository into the /temporal directory.',
            inputSchema: {
                type: 'object',
                properties: {
                    repoUrl: {
                        type: 'string',
                        description: 'The URL of the repository to clone',
                        default: 'https://github.com/webfer/ansible-drupal.git',
                    },
                },
                required: ['repoUrl'],
            },
        },
        {
            name: 'ansibleSetup',
            description: 'Moves tools, ansible.cfg, and vault_pass.txt from temporal to project root',
            inputSchema: { type: 'object', properties: {}, required: [] },
        },
        {
            name: 'ansibleCleanup',
            description: 'Cleans up the /temporal and /temporal/ansible-drupal directories after setup.',
            inputSchema: { type: 'object', properties: {}, required: [] },
        },
        {
            name: 'validateDeploy',
            description: 'Validates configuration and executes the Drupal deployment (stage/live, install/update).',
            inputSchema: {
                type: 'object',
                properties: {
                    environment: {
                        type: 'string',
                        enum: ['stage', 'live'],
                        description: 'Deployment environment',
                    },
                    action: {
                        type: 'string',
                        enum: ['install', 'update'],
                        description: 'Deployment action type',
                    },
                    withAssets: {
                        type: 'boolean',
                        description: 'Whether to include asset synchronization during deployment',
                        default: false,
                    },
                    ansibleVaultPassFile: {
                        type: 'string',
                        description: 'Optional path to the vault password file used by Ansible.',
                    },
                },
                required: ['environment', 'action'],
            },
        },
        {
            name: 'decryptVaultFile',
            description: 'Decrypts the Ansible Vault file for a given environment.',
            inputSchema: {
                type: 'object',
                properties: {
                    environment: {
                        type: 'string',
                        enum: ['stage', 'live'],
                        description: 'Deployment environment for the vault file.',
                    },
                },
                required: ['environment'],
            },
        },
        {
            name: 'encryptVaultFile',
            description: 'Encrypts the Ansible Vault file for a given environment.',
            inputSchema: {
                type: 'object',
                properties: {
                    environment: {
                        type: 'string',
                        enum: ['stage', 'live'],
                        description: 'The environment whose vault file will be encrypted.',
                    },
                },
                required: ['environment'],
            },
        },
        {
            name: 'executeDeployment',
            description: 'Runs a stage or live deployment using Ansible.',
            inputSchema: {
                type: 'object',
                properties: {
                    environment: {
                        type: 'string',
                        enum: ['stage', 'live', 'production'],
                        description: 'Deployment environment.',
                    },
                    action: {
                        type: 'string',
                        enum: ['install', 'update'],
                        description: 'Deployment action (install/update).',
                        default: 'install',
                    },
                    withAssets: {
                        type: 'boolean',
                        description: 'Include asset synchronization during deployment.',
                        default: false,
                    },
                },
                required: ['environment'],
            },
        },
    ],
}));
// 🧠 Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const { name, arguments: args } = request.params;
    switch (name) {
        case 'cloneRepository': {
            // Safely normalize arguments to avoid "undefined" errors
            const safeArgs = args && typeof args === 'object' ? args : {};
            const tool = new CloneRepositoryTool();
            return await tool.run(safeArgs);
        }
        case 'ansibleSetup': {
            if (ansibleTool.isAwaitingConfirmation()) {
                const reply = args?.confirmAnswer ||
                    args?.text ||
                    args?.response;
                const normalized = typeof reply === 'string' ? reply.toLowerCase().trim() : null;
                if (normalized === 'yes') {
                    ansibleTool.resetPending();
                    const setupResult = await ansibleTool.run({ confirm: true });
                    const cleanupResult = await cleanupTool.run(); // 🔹 Auto-cleanup after setup
                    return {
                        content: [...setupResult.content, ...cleanupResult.content],
                    };
                }
                else if (normalized === 'no') {
                    ansibleTool.resetPending();
                    return {
                        content: [
                            { type: 'text', text: '❌ Operation cancelled by user.' },
                        ],
                    };
                }
                else {
                    return {
                        content: [
                            { type: 'text', text: '⚠️ Please reply with "yes" or "no".' },
                        ],
                    };
                }
            }
            // First setup call
            return await ansibleTool.run();
        }
        case 'ansibleCleanup': {
            const cleanup = new AnsibleCleanUpTool();
            return await cleanup.run();
        }
        case 'validateDeploy': {
            const tool = new ValidateDeployTool();
            // Extract tool arguments correctly
            const safeArgs = (request.params.arguments && typeof request.params.arguments === 'object'
                ? request.params.arguments
                : {});
            console.error('[DEBUG] validateDeploy safeArgs:', safeArgs);
            return await tool.run(safeArgs);
        }
        case 'decryptVaultFile': {
            const tool = new DecryptVaultTool();
            const safeArgs = {
                projectRoot: path.resolve(process.cwd()),
                ...(request.params.args ?? request.params),
            };
            const serverDebug = {
                type: 'text',
                text: `[SERVER DEBUG] Invoking decryptVaultFile with safeArgs: ${JSON.stringify(safeArgs)}`,
            };
            const result = await tool.run(safeArgs);
            const content = Array.isArray(result?.content) ? result.content : [];
            return { content: [serverDebug, ...content] };
        }
        case 'encryptVaultFile': {
            const tool = new EncryptVaultTool();
            const safeArgs = {
                projectRoot: path.resolve(process.cwd()),
                ...(request.params.args ?? request.params),
            };
            const serverDebug = {
                type: 'text',
                text: `[SERVER DEBUG] Invoking encryptVaultFile with safeArgs: ${JSON.stringify(safeArgs)}`,
            };
            const result = await tool.run(safeArgs);
            const content = Array.isArray(result?.content) ? result.content : [];
            return { content: [serverDebug, ...content] };
        }
        case 'executeDeployment': {
            const tool = new ExecuteDeploymentTool();
            const safeArgs = (request.params.args ?? {});
            return await tool.run(safeArgs);
        }
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
});
// 💬 Register prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [
        {
            name: 'clone_ansible_drupal',
            description: 'Provides information and guidance before cloning the Ansible-Drupal repository.',
            arguments: [
                {
                    name: 'owner',
                    description: 'Owner of the GitHub repository',
                    type: 'string',
                    required: true,
                },
                {
                    name: 'name',
                    description: 'Repository name',
                    type: 'string',
                    required: true,
                },
                {
                    name: 'repoUrl',
                    description: 'Repository URL',
                    type: 'string',
                    required: true,
                    default: 'https://github.com/webfer/ansible-drupal.git',
                },
                {
                    name: 'ansible_setup',
                    description: 'Provides guidance before moving Ansible configuration files to the project root.',
                    arguments: [],
                },
            ],
        },
    ],
}));
// 💬 Handle prompt requests
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (!args)
        throw new Error('Arguments are required.');
    switch (name) {
        case 'clone_ansible_drupal': {
            // Safely cast args to your known interface
            const promptArgs = args;
            return await GetAnsibleDrupalRepoUrl(promptArgs);
        }
        case 'ansible_setup':
            return await GetAnsibleSetupPrompt();
        default:
            throw new Error(`Unknown prompt: ${name}`);
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('🚀 MCP Ansible-Drupal server is running.');
}
main().catch((error) => {
    console.error('❌ Error starting server:', error);
    process.exit(1);
});
