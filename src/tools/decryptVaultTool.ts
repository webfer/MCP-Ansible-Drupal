import { decryptVaultFile } from './verifyVaultFile.js';

export class DecryptVaultTool {
  name = 'decryptVaultFile';
  description = 'Decrypts the Ansible Vault file for the selected environment.';

  async run(args?: any) {
    // 🧠 Normalize all possible argument shapes (from MCP, VSCode, or CLI)
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
      '/';

    console.error('[DEBUG] Resolved args for decryptVaultTool:', {
      environment,
      projectRoot,
      rawArgs: args,
    });

    const messages = [
      {
        type: 'text',
        text: `[DEBUG] decryptVaultTool invoked with environment=${environment}, projectRoot=${projectRoot}`,
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

    try {
      // 🔓 Perform decryption
      const vaultPath = decryptVaultFile(projectRoot, environment);
      messages.push({
        type: 'text',
        text: `🔓 Vault file decrypted successfully: ${vaultPath}`,
      });
    } catch (error: any) {
      console.error('[DEBUG] DecryptVaultTool failed:', error);
      messages.push({
        type: 'text',
        text: `❌ Failed to decrypt vault: ${error.message}`,
      });
    }

    return { content: messages };
  }
}
