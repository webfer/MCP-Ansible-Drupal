# 🚀 MCP Ansible Drupal

> **A Model Context Protocol (MCP) server that automates Drupal deployment workflows using Ansible**

[![npm version](https://img.shields.io/npm/v/@webfer/mcp-ansible-drupal.svg)](https://www.npmjs.com/package/@webfer/mcp-ansible-drupal)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**MCP-Ansible-Drupal** is an intelligent automation server that bridges AI assistants with Ansible-powered Drupal deployments. It provides a comprehensive set of tools for managing the complete deployment lifecycle—from initial setup to production releases—through natural language interactions.

> 🔗 **Works seamlessly with [DrupAnsible](https://github.com/webfer/drupansible)** - the Ansible-based deployment framework for Drupal. This MCP server provides the intelligent interface to control DrupAnsible playbooks through AI assistants, making DevOps workflows conversational and accessible.

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🎯 What is MCP?](#-what-is-mcp)
- [🏗️ Architecture](#️-architecture)
- [📦 Installation](#-installation)
- [🔧 Configuration](#-configuration)
- [🎮 Available Tools](#-available-tools)
- [📚 Usage Examples](#-usage-examples)
- [🔐 Security](#-security)
- [🛠️ Development](#️-development)
- [📄 License](#-license)

---

## ✨ Features

### 🔄 **Deployment Management**

- **Install/Update Deployments**: Execute initial installations or incremental updates to staging/production
- **Zero-Downtime Releases**: Leverages Ansistrano for seamless deployment with rollback capabilities
- **Asset Synchronization**: Optional asset deployment for themes, images, and static files
- **Database Operations**: Automated database imports, backups, and updates

### 🔐 **Vault Security**

- **Encrypted Configuration**: Ansible Vault integration for secure credential management
- **Encrypt/Decrypt Tools**: Secure vault file management directly from your AI assistant
- **Environment Isolation**: Separate vault files for staging and production environments

### 📊 **Monitoring & Logs**

- **Live Deployment Streaming**: Real-time progress updates during deployment execution
- **Log Management**: Automated log rotation (keeps last 3 deployments)
- **Deployment History**: Query recent deployment logs for troubleshooting

### 🎛️ **Workflow Automation**

- **Repository Cloning**: Automated DrupAnsible repository setup
- **Configuration Transfer**: Intelligent movement of Ansible files to project root
- **Cleanup Operations**: Automatic removal of temporary files and directories

### 🤖 **AI-Native Design**

- **Natural Language Control**: Execute complex deployment workflows through conversation
- **Interactive Confirmations**: Safety prompts for destructive operations
- **Context-Aware Responses**: Detailed feedback at every step

---

## 🎯 What is MCP?

The **Model Context Protocol (MCP)** is an open standard that enables AI assistants (like Claude, ChatGPT) to securely interact with external tools and data sources. Think of it as a universal adapter that lets AI models:

- 🔧 Execute system operations
- 📁 Access file systems
- 🌐 Interact with APIs
- 🚀 Trigger deployment pipelines

This project implements an MCP server specifically designed for Drupal/Ansible workflows, making DevOps tasks conversational and accessible.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Assistant (Claude)                    │
│                  Natural Language Interface                  │
└────────────────────────┬────────────────────────────────────┘
                         │ MCP Protocol
┌────────────────────────▼────────────────────────────────────┐
│               MCP-Ansible-Drupal Server                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Tools Layer                                          │   │
│  │  • cloneRepository    • validateDeploy               │   │
│  │  • ansibleSetup       • executeDeployment            │   │
│  │  • decryptVaultFile   • encryptVaultFile             │   │
│  │  • getDeploymentLogs  • ansibleCleanup               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Helpers Layer                                        │   │
│  │  • confirmFirstDeployment  • runAnsible               │   │
│  │  • generateSkipTags        • resolveProjectPaths      │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ Shell Commands
┌────────────────────────▼────────────────────────────────────┐
│                    Ansible Playbooks                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • stage-deploy.yml   • live-deploy.yml               │   │
│  │  • rollback.yml       • Ansistrano tasks              │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ SSH/rsync
┌────────────────────────▼────────────────────────────────────┐
│                 Drupal Application Server                    │
│              (Staging / Production Environment)              │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

#### **1. Server Layer** (`src/server.ts`)

- MCP protocol handler
- Tool registration and routing
- Request/response management
- Interactive confirmation flows

#### **2. Tools Layer** (`src/tools/`)

- **Deployment Tools**: `executeDeployment.ts`, `validateDeployTool.ts`
- **Vault Tools**: `decryptVaultTool.ts`, `encryptVaultTool.ts`
- **Setup Tools**: `cloneRepositoryTool.ts`, `ansibleSetupTool.ts`
- **Utility Tools**: `getDeploymentLogs.ts`, `generateSkipTags.ts`

#### **3. Helpers Layer** (`src/helpers/`)

- Deployment confirmation workflows
- Ansible command execution
- Path resolution and validation

#### **4. Ansible Integration**

- **Playbooks**: Located in `ansible/core/` directory
- **Inventories**: Environment-specific configurations in `ansible/core/inventories/`
- **Vault Files**: Encrypted credentials per environment

---

## 📦 Installation

### Prerequisites

- **Node.js** 18+
- **TypeScript** 5.2+
- **Ansible** 2.x
- **Git**

### Quick Start

> ⭐ **Recommended**: Install via NPM from [npmjs.com/package/@webfer/mcp-ansible-drupal](https://www.npmjs.com/package/@webfer/mcp-ansible-drupal) for the best experience and automatic updates.

```bash
# 1. Install the package (RECOMMENDED)
npm install @webfer/mcp-ansible-drupal

# 2. Alternative: Build from source (for development only)
git clone https://github.com/webfer/MCP-Ansible-Drupal.git
cd MCP-Ansible-Drupal
npm install
npm run build

# 3. Configure your MCP client
# Add to your MCP settings (e.g., Claude Desktop config):
```

**Claude Desktop Configuration** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mcp-ansible-drupal": {
      "command": "node",
      "args": ["/path/to/MCP-Ansible-Drupal/dist/server.js"],
      "cwd": "/path/to/your/drupal-project"
    }
  }
}
```

---

## 🔧 Configuration

### Project Structure Requirements

Your Drupal project should have this structure:

```
your-drupal-project/
├── ansible/
│   ├── core/
│   │   ├── stage-deploy.yml
│   │   ├── live-deploy.yml
│   │   └── inventories/
│   │       ├── stage/
│   │       │   ├── inventory.yml
│   │       │   └── group_vars/
│   │       │       ├── server.yml (encrypted)
│   │       │       └── deploy_vars.yml
│   │       └── live/
│   └── tmp/
│       └── logs/
├── vault_pass.txt (git-ignored!)
├── composer.json
└── web/ (Drupal root)
```

### Vault Password File

Create `vault_pass.txt` in your project root:

```bash
echo "your-secure-password" > vault_pass.txt
chmod 600 vault_pass.txt
```

**⚠️ Important**: Add to `.gitignore`!

### Ansible Vault Files

Encrypt sensitive data:

```bash
ansible-vault encrypt ansible/core/inventories/stage/group_vars/server.yml \
  --vault-password-file vault_pass.txt
```

---

## 🎮 Available Tools

### 1️⃣ **Repository Setup**

#### `cloneRepository`

Clones the DrupAnsible base repository to bootstrap your project.

**Parameters:**

- `repoUrl` (string): Repository URL (default: `https://github.com/webfer/drupansible.git`)

**Prompt example (to work properly):**

```
Clone the DrupAnsible repository to get started with the setup.
```

---

#### `ansibleSetup`

Moves Ansible configuration files from temporary directory to project root.

**Parameters:** None

**Prompt example (to work properly):**

```
Run ansible setup to configure the project files.
```

---

#### `ansibleCleanup`

Removes temporary files and directories after setup.

**Parameters:** None

**Prompt example (to work properly):**

```
Clean up the temporary deployment files.
```

---

### 2️⃣ **Deployment Operations**

#### `validateDeploy`

Validates deployment configuration before execution.

**Parameters:**

- `environment` (string): `stage` | `live`
- `action` (string): `install` | `update`
- `withAssets` (boolean): Include asset synchronization

**Prompt example (to work properly):**

```
Validate the deployment configuration for staging environment with install action.
```

---

#### `executeDeployment`

Executes the Ansible deployment playbook.

**Parameters:**

- `environment` (string): `stage` | `live` | `production`
- `action` (string): `install` | `update`
- `withAssets` (boolean): Deploy assets (default: `false`)
- `confirmAnswer` (string): `yes` | `no` (for install confirmation)

**Prompt examples (to work properly):**

```
Run initial deployment to staging environment.
```

```
Execute update deployment to production with assets included.
```

**Install Flow:**

```
User: "Deploy fresh install to stage"
MCP:  "⚠️ This will overwrite existing code. Continue? (yes/no)"
User: "yes"
MCP:  "✅ Proceeding with deployment..."
      [Live deployment logs stream here]
```

---

### 3️⃣ **Vault Management**

#### `decryptVaultFile`

Decrypts Ansible Vault files for viewing/editing.

**Parameters:**

- `environment` (string): `stage` | `live`

**Prompt example (to work properly):**

```
Decrypt the stage server vault file so I can review the configuration.
```

---

#### `encryptVaultFile`

Re-encrypts Ansible Vault files after modifications.

**Parameters:**

- `environment` (string): `stage` | `live`

**Prompt example (to work properly):**

```
Encrypt the stage vault file after my changes.
```

---

### 4️⃣ **Monitoring**

#### `getDeploymentLogs`

Retrieves recent deployment logs.

**Parameters:**

- `lines` (number): Number of lines to return (default: 50)

**Prompt example (to work properly):**

```
Show me the last 100 lines of the deployment logs.
```

---

## 📚 Usage Examples

### Complete Workflow Example

```
User: "Set up a new Drupal deployment environment"

1. MCP clones DrupAnsible repository
2. MCP moves configuration files to project root
3. MCP cleans up temporary directories

User: "Configure staging credentials"

4. MCP decrypts stage vault file
5. [User edits file with credentials]
6. MCP encrypts vault file

User: "Deploy to staging"

7. MCP validates configuration
8. MCP asks for confirmation
9. User confirms "yes"
10. MCP executes deployment with live streaming
11. Deployment completes successfully

User: "Show deployment logs"

12. MCP displays recent deployment logs
```

### Update Deployment

```
User: "Update staging with latest code changes"

MCP: "✅ Executing update deployment..."
     [Streaming logs]:
     🔸 TASK [Rsync code to server]
     🟡 changed: [stage]
     🔸 TASK [Import configuration]
     🟡 changed: [stage]
     🔸 TASK [Run database updates]
     🟡 changed: [stage]
     🔸 TASK [Clear cache]
     🟡 changed: [stage]
     ✅ Deployment completed: 45 tasks, 18 changes
```

---

## 🔐 Security

### Best Practices

1. **Never commit vault passwords**

   ```bash
   echo "vault_pass.txt" >> .gitignore
   ```

2. **Use strong vault passwords**

   ```bash
   openssl rand -base64 32 > vault_pass.txt
   ```

3. **Rotate vault passwords regularly**

   ```bash
   ansible-vault rekey group_vars/server.yml
   ```

4. **Limit MCP server permissions**

   - Run with minimal user privileges
   - Restrict file system access
   - Use SSH key authentication for deployments

5. **Audit deployment logs**
   - Logs stored in `ansible/tmp/logs/`
   - Review for security events
   - Automatic rotation (keeps last 3)

---

## 🛠️ Development

### Project Structure

```
MCP-Ansible-Drupal/
├── src/
│   ├── server.ts              # MCP server entry point
│   ├── tools/                 # MCP tool implementations
│   │   ├── executeDeployment.ts
│   │   ├── validateDeployTool.ts
│   │   ├── decryptVaultTool.ts
│   │   ├── encryptVaultTool.ts
│   │   └── ...
│   ├── helpers/               # Utility functions
│   │   ├── confirmFirstDeployment.ts
│   │   ├── runAnsible.ts
│   │   └── ...
│   ├── prompts/               # User interaction prompts
│   └── types/                 # TypeScript type definitions
├── ansible/                   # Ansible playbooks & config
│   └── core/
│       ├── stage-deploy.yml
│       ├── live-deploy.yml
│       ├── inventories/
│       └── tasks/
├── dist/                      # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

### Building

```bash
# Compile TypeScript
npm run build

# Watch mode for development
npm run watch

# Run the server
npm start
```

### Adding New Tools

1. Create tool file in `src/tools/`:

```typescript
export class MyCustomTool {
  name = 'myCustomTool';
  description = 'Does something useful';

  async run(args: any) {
    // Tool implementation
    return { content: [{ type: 'text', text: 'Result' }] };
  }
}
```

2. Register in `src/server.ts`:

```typescript
import { MyCustomTool } from './tools/myCustomTool.js';

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'myCustomTool',
      description: 'Does something useful',
      inputSchema: {
        /* JSON Schema */
      },
    },
  ],
}));
```

### Testing

```bash
# Run tests (when available)
npm test

# Manual testing with Claude Desktop
# Check logs in:
# - macOS: ~/Library/Logs/Claude/mcp*.log
# - Windows: %APPDATA%\Claude\logs\mcp*.log
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow existing TypeScript conventions
- Add JSDoc comments for public APIs
- Include error handling
- Update README for new features

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

**Developed by [Fernando A Castro (Webfer)](https://www.linkedin.com/in/webfer/)**

---

## 🔗 Links

- 📦 [npm Package](https://www.npmjs.com/package/@webfer/mcp-ansible-drupal)
- 🐙 [GitHub Repository](https://github.com/webfer/MCP-Ansible-Drupal)
- 📖 [Model Context Protocol Docs](https://modelcontextprotocol.io)
- 🌐 [Drupal](https://www.drupal.org)
- 🔧 [Ansible](https://www.ansible.com)
- 🚀 [Ansistrano](https://ansistrano.com)

---

## 💬 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/webfer/MCP-Ansible-Drupal/issues)
- 💡 **Discussions**: [GitHub Discussions](https://github.com/webfer/MCP-Ansible-Drupal/discussions)
- 📧 **Contact**: [LinkedIn](https://www.linkedin.com/in/webfer/)

---

<div align="center">

**⭐ Star this project if you find it useful!**

Made with ❤️ for the Drupal & DevOps community

</div>
