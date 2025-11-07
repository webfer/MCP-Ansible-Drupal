/**
 * verifyVaultFile.ts
 * ------------------
 * Validates the existence and encryption status of an Ansible Vault file
 * for the given deployment environment (stage/live).
 */
import * as fs from 'fs';
import * as path from 'path';
/**
 * Determine the correct vault file path for a given environment.
 */
function resolveVaultPath(projectRoot, environment) {
    const inventoryDir = environment === 'stage'
        ? 'tools/ansible/inventories/stage/group_vars'
        : 'tools/ansible/inventories/production/group_vars';
    return path.join(projectRoot, inventoryDir, 'server.yml');
}
/**
 * Checks that the vault file exists and is properly encrypted.
 */
export function verifyVaultFile(input) {
    const errors = [];
    const vaultPath = resolveVaultPath(input.projectRoot, input.environment);
    // Check existence
    if (!fs.existsSync(vaultPath)) {
        errors.push(`Vault file not found: ${vaultPath}`);
        return { valid: false, vaultPath, encrypted: false, errors };
    }
    // Check encryption marker
    const firstLine = fs.readFileSync(vaultPath, 'utf-8').split('\n')[0] || '';
    const encrypted = firstLine.includes('$ANSIBLE_VAULT;');
    if (!encrypted) {
        errors.push(`Vault file is not encrypted: ${vaultPath}\n` +
            `Ensure you run: ansible-vault encrypt ${vaultPath}`);
    }
    return {
        valid: errors.length === 0,
        vaultPath,
        encrypted,
        errors: errors.length > 0 ? errors : undefined,
    };
}
