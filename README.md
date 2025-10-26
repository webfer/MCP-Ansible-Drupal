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

## 📁 File Structure

```bash
MCP-Ansible-Drupal/
├── LICENSE
├── package.json
├── tsconfig.json
├── src/
│   ├── server.ts
│   └── prompts/
│       ├── ansibleSetupPrompt.ts
│       ├── cloneRepositoryPrompt.ts
│       └── index.ts
├── tools/
│   ├── ansibleCleanUpTool.ts
│   ├── ansibleSetupTool.ts
│   ├── cloneRepositoryTool.ts
│   └── index.ts
└── README.md
```

---

## ✅ Requirements

- Node.js 18 or higher
- TypeScript
- Ansible (for target Drupal projects)

---

## 🛠️ Installation

1. Clone this repository into your project directory.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the project:

   ```bash
   npm run build
   ```

---

## 🎯 Behavior

- **Clone Repository:** Uses the `cloneRepositoryTool` and `cloneRepositoryPrompt` to fetch the Ansible-Drupal repository into a temporary directory (`/temporal`).
- **Ansible Setup:** Moves `ansible.cfg` and `vault_pass.txt` from the temporary directory to the project root using `ansibleSetupTool` and `ansibleSetupPrompt`.
- **Cleanup:** Removes `/temporal` and `/temporal/ansible-drupal` directories after setup with `ansibleCleanUpTool`.
- **Prompts:** Each tool is paired with a prompt for user interaction or automation.
- **Server:** The `server.ts` file can be used to expose these functionalities as part of an MCP server or CLI.

---

## 🧩 Developer Notes

- Tools and prompts are modular and can be extended for additional Ansible or Drupal automation tasks.
- Designed for integration with larger MCP-based automation or orchestration systems.
- Ensure Ansible is installed and configured on the target environment for full functionality.

---

## 🙋 Support

For bug reports or feature suggestions, please create an issue in the [GitHub repository](https://github.com/webfer/MCP-Ansible-Drupal) or contact the maintainer.

---

## 📜 License

MIT License. Developed by [Webfer](https://www.linkedin.com/in/webfer/).

---

_Maintained by [Webfer](https://www.linkedin.com/in/webfer/)_