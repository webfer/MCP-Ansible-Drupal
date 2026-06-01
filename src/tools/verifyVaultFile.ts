/**
 * verifyVaultFile.ts
 * ------------------
 * Validates the existence and encryption status of an Ansible Vault file
 * for the given deployment environment (stage/live).
 *
 * If not encrypted, it will automatically encrypt the file.
 *
 * NOTE:
 * This function performs automatic encryption if a vault is found unencrypted.
 * For manual encryption/decryption, see:
 *   - encryptVaultTool.ts
 *   - decryptVaultTool.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { execFileSync } from 'child_process';

export interface VerifyVaultInput {
  projectRoot: string;
  environment: 'stage' | 'live';
}

export interface VerifyVaultResult {
  valid: boolean;
  vaultPath: string;
  encrypted: boolean;
  message: string;
  errors?: string[];
}

/**
 * Resolve the vault file path for the given environment.
 */
function resolveVaultPath(
  projectRoot: string,
  environment: 'stage' | 'live'
): string {
  const inventoryDir =
    environment === 'stage'
      ? 'ansible/core/inventories/stage/group_vars'
      : 'ansible/core/inventories/production/group_vars';

  return path.join(projectRoot, inventoryDir, 'server.yml');
}

/**
 * Checks that the vault file exists, ensures it is encrypted, and
 * encrypts it automatically if needed.
 */
export function verifyVaultFile(input: VerifyVaultInput): VerifyVaultResult {
  const { projectRoot, environment } = input;
  const errors: string[] = [];
  const vaultPath = resolveVaultPath(projectRoot, environment);

  if (!fs.existsSync(vaultPath)) {
    const msg = `❌ Vault file not found: ${vaultPath}`;
    return {
      valid: false,
      vaultPath,
      encrypted: false,
      message: msg,
      errors: [msg],
    };
  }

  const firstLine = fs.readFileSync(vaultPath, 'utf-8').split('\n')[0] || '';
  const isEncrypted = firstLine.trim().startsWith('$ANSIBLE_VAULT;');

  if (!isEncrypted) {
    console.log(`⚠️  Vault file not encrypted. Encrypting now: ${vaultPath}`);
    try {
      execFileSync('ansible-vault', ['encrypt', vaultPath], { stdio: 'inherit' });
      return {
        valid: true,
        vaultPath,
        encrypted: true,
        message: `✅ Vault file encrypted successfully: ${vaultPath}`,
      };
    } catch (err: any) {
      const msg = `❌ Failed to encrypt vault file: ${vaultPath}\n${err.message}`;
      errors.push(msg);
      return {
        valid: false,
        vaultPath,
        encrypted: false,
        message: msg,
        errors,
      };
    }
  }

  return {
    valid: true,
    vaultPath,
    encrypted: true,
    message: `✅ Vault file verified and encrypted: ${vaultPath}`,
  };
}

/**
 * Decrypt helper — tolerant version
 * If the file is already unencrypted, this does NOT throw an error.
 */
export function decryptVaultFile(
  projectRoot: string,
  environment: 'stage' | 'live'
): string {
  const vaultPath = resolveVaultPath(projectRoot, environment);
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found: ${vaultPath}`);
  }

  const firstLine = fs.readFileSync(vaultPath, 'utf-8').split('\n')[0] || '';
  const isEncrypted = firstLine.trim().startsWith('$ANSIBLE_VAULT;');

  if (!isEncrypted) {
    console.log(
      JSON.stringify({
        type: 'info',
        message: `✅ Vault file is already decrypted: ${vaultPath}`,
      })
    );

    return vaultPath;
  }

  console.log(`🔓 Decrypting vault file: ${vaultPath}`);
  execFileSync(
    'ansible-vault',
    ['decrypt', vaultPath, '--vault-password-file', 'vault_pass.txt'],
    { stdio: 'inherit' }
  );

  console.log(
    JSON.stringify({
      type: 'info',
      message: `✅ Vault file decrypted successfully: ${vaultPath}`,
    })
  );

  return vaultPath;
}
