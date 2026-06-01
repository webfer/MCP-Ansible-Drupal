import { execFileSync } from 'child_process';
import { VaultToolBase, VaultToolArgs } from './VaultToolBase.js';
import { verifyVaultFile } from './verifyVaultFile.js';

export class DecryptVaultTool extends VaultToolBase {
  name = 'decryptVaultFile';
  description = 'Decrypts the Ansible Vault file for the selected environment.';

  async run(args?: VaultToolArgs) {
    // Normalize environment and projectRoot
    const {
      environment: userEnv,
      projectRoot,
      rawArgs,
    } = this.normalizeArgs(args);

    // Start building messages to return to MCP/VSCode
    const messages = [
      this.createDebugMessage(
        `decryptVaultTool invoked with environment=${userEnv}, projectRoot=${projectRoot}`
      ),
    ];

    // Guard: Missing environment
    if (!userEnv) {
      messages.push({
        type: 'text',
        text: '❌ Missing required environment parameter. Please specify "stage" or "production".',
      });
      return { content: messages };
    }

    // Normalize environment for verifyVaultFile
    let normalizedEnv: 'stage' | 'live';

    if (userEnv === 'stage') {
      normalizedEnv = 'stage';
    } else if (userEnv === 'production') {
      normalizedEnv = 'live';
    } else {
      messages.push({
        type: 'text',
        text: '❌ Invalid environment. Please specify "stage" or "production".',
      });
      return { content: messages };
    }

    try {
      const vaultPath = this.resolveVaultPath(projectRoot, userEnv);
      this.ensureFileExists(vaultPath);

      // Verify vault file (auto-encrypt if needed)
      const result = verifyVaultFile({
        projectRoot,
        environment: normalizedEnv,
      });

      if (!result.encrypted) {
        messages.push({
          type: 'text',
          text: `⚠️ Vault file not encrypted. Encrypting now: ${vaultPath}`,
        });
      }

      execFileSync('ansible-vault', ['decrypt', vaultPath], { stdio: 'inherit' });

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
