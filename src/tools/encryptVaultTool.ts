import { execSync } from 'child_process';
import { VaultToolBase, VaultToolArgs } from './VaultToolBase.js';
import { verifyVaultFile } from './verifyVaultFile.js';

export class EncryptVaultTool extends VaultToolBase {
  name = 'encryptVaultFile';
  description = 'Encrypts the Ansible Vault file for the selected environment.';

  async run(args?: VaultToolArgs) {
    const {
      environment: userEnv,
      projectRoot,
      rawArgs,
    } = this.normalizeArgs(args);

    const messages = [
      this.createDebugMessage(
        `encryptVaultTool invoked with environment=${userEnv}, projectRoot=${projectRoot}`
      ),
    ];

    if (!userEnv) {
      messages.push({
        type: 'text',
        text: '❌ Missing required environment parameter. Please specify "stage" or "production".',
      });
      return { content: messages };
    }

    // Map user input to verifyVaultFile expected type
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

      const result = verifyVaultFile({
        projectRoot,
        environment: normalizedEnv,
      });
      if (result.encrypted) {
        messages.push({
          type: 'text',
          text: `⚠️ Vault file is already encrypted: ${vaultPath}`,
        });
        return { content: messages };
      }

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
