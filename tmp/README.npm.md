# MCP Ansible Drupal

**Project name:** `MCP-Ansible-Drupal`  
**Description:** Automates the setup and management of Ansible configurations for Drupal projects, including repository cloning, environment preparation, and cleanup, via a Model Context Protocol (MCP) toolset.

---

## 📦 Features

- Clones the official Ansible-Drupal repository for project bootstrapping.
- Moves and configures essential Ansible files (e.g., `ansible.cfg`, `vault_pass.txt`) into the project root.
- Cleans up temporary files and directories after setup to keep the workspace tidy.
- Provides modular tools and prompts for each step (clone, setup, cleanup).
- Designed for integration with MCP-based automation workflows.

---

## ✅ Requirements

- Node.js 18 or higher
- Ansible (for target Drupal projects)

---

## 🛠️ Installation

1. Using npm.

   ```bash
   npm i @webfer/mcp-ansible-drupal
   ```

---

2. Using yarn.

   ```bash
   yarn add @webfer/mcp-ansible-drupal
   ```

---

## 🚀 Usage

1. Configure the MCP Ansible-Drupal server:

- Add the following entry to your MCP settings file, either `.vscode/mcp.json` or `mcp.json` in your project root.
- This enables the Ansible-Drupal automation tools in your workspace.

```bash
{
  "servers": {
    "ansible-drupal": {
      "command": "npx",
      "args": ["-y", "@webfer/mcp-ansible-drupal"],
      "description": "MCP Ansible-Drupal Server"
    }
  }
}

```

---

## 🎯 Behavior

This MCP Ansible Drupal toolset includes the following functionalities:

- **Clone Repository:** Uses the `cloneRepositoryTool` and `cloneRepositoryPrompt` to fetch the Ansible-Drupal repository into a temporary directory (`/temporal`).
- **Ansible Setup:** Moves `ansible.cfg` and `vault_pass.txt` from the temporary directory to the project root using `ansibleSetupTool` and `ansibleSetupPrompt`.
- **Cleanup:** Removes `/temporal` and `/temporal/ansible-drupal` directories after setup with `ansibleCleanUpTool`.
- **Prompts:** Each tool is paired with a prompt for user interaction or automation.
- **Server:** The `server.ts` file can be used to expose these functionalities as part of an MCP server or CLI.

---

## 💡 Prompt Example

You can use the following prompt to automate the full Ansible-Drupal setup process:

```
Clone the Ansible-Drupal repository into the /temporal directory using the cloneRepository tool.
After cloning, run the ansibleSetup tool to move the Ansible configuration files and tools to the project root.
Then run the ansibleCleanup tool to completely remove the /temporal directory, even if it contains other files or folders.
```

## 🙋 Support

For bug reports or feature suggestions, please create an issue in the [GitHub repository](https://github.com/webfer/MCP-Ansible-Drupal) or contact the maintainer.

---

## 📜 License

MIT License. Developed by [Webfer](https://www.linkedin.com/in/webfer/).

---

_Maintained by [Webfer](https://www.linkedin.com/in/webfer/)_
