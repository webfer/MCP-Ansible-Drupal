import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export class EncryptVaultTool {
  name = 'encryptVaultFile';
  description = 'Encrypts the Ansible Vault file for the selected environment.';

  async run(args?: any) {
    // 🧠 Normalize all possible argument shapes (MCP, VSCode, or CLI)
    const environment =
      args?.environment ||
      args?.arguments?.environment ||
      args?.arguments?.[0]?.environment ||
      args?.arguments?.[0] ||
      null;

    const projectRoot =
      args?.projectRoot ||
      args?.arguments?.projectRoot ||
      args?.arguments?.[0]?.projectRoot ||
      process.cwd();

    console.error('[DEBUG] Resolved args for encryptVaultTool:', {
      environment,
      projectRoot,
      rawArgs: args,
    });

    const messages = [
      {
        type: 'text',
        text: `[DEBUG] encryptVaultTool invoked with environment=${environment}, projectRoot=${projectRoot}`,
      },
    ];

    // 🚨 Guard against missing environment
    if (!environment) {
      messages.push({
        type: 'text',
        text: '❌ Missing required environment parameter. Please specify "stage" or "live".',
      });
      return { content: messages };
    }

    // 🗺️ Construct the vault path
    const vaultPath = path.resolve(
      projectRoot,
      `tools/ansible/inventories/${environment}/group_vars/server.yml`
    );

    if (!fs.existsSync(vaultPath)) {
      messages.push({
        type: 'text',
        text: `❌ Vault file not found at: ${vaultPath}`,
      });
      return { content: messages };
    }

    // 🧩 Check if already encrypted (avoid double encryption)
    const fileContent = fs.readFileSync(vaultPath, 'utf8');
    if (fileContent.startsWith('$ANSIBLE_VAULT;')) {
      messages.push({
        type: 'text',
        text: `✅ Vault file is already encrypted: ${vaultPath}`,
      });
      return { content: messages };
    }

    try {
      console.error(`[DEBUG] Encrypting vault file at: ${vaultPath}`);
      execSync(`ansible-vault encrypt ${vaultPath}`, { stdio: 'inherit' });
      messages.push({
        type: 'text',
        text: `🔐 Vault file encrypted successfully: ${vaultPath}`,
      });
    } catch (error: any) {
      console.error('[DEBUG] EncryptVaultTool failed:', error);
      messages.push({
        type: 'text',
        text: `❌ Failed to encrypt vault: ${error.message}`,
      });
    }

    return { content: messages };
  }
}
