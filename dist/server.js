#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema, ListPromptsRequestSchema, GetPromptRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { CloneRepositoryTool, AnsibleSetUpTool, AnsibleCleanUpTool, } from './tools/index.js';
import { GetAnsibleDrupalRepoUrl, GetAnsibleSetupPrompt, } from './prompts/index.js';
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
    ],
}));
// 🧠 Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, args } = request.params;
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
    console.log('🚀 MCP Ansible-Drupal server is running.');
}
main().catch((error) => {
    console.error('❌ Error starting server:', error);
    process.exit(1);
});
