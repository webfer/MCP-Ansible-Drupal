/**
 * resolveProjectPaths.ts
 * ----------------------
 * Determines the correct Ansible file paths (inventory, vault, playbook)
 * for the given deployment environment.
 */
import * as path from 'path';
import * as fs from 'fs';
/**
 * Resolves the paths for the given environment.
 */
export function resolveProjectPaths(input) {
    const { projectRoot, environment } = input;
    const errors = [];
    let inventoryFile = '';
    let playbookFile = '';
    let vaultFile = '';
    if (environment === 'stage') {
        inventoryFile = path.join(projectRoot, 'tools/ansible/inventories/stage/inventory.yml');
        playbookFile = path.join(projectRoot, 'tools/ansible/stage-deploy.yml');
        vaultFile = path.join(projectRoot, 'tools/ansible/inventories/stage/group_vars/server.yml');
    }
    else if (environment === 'live') {
        inventoryFile = path.join(projectRoot, 'tools/ansible/inventories/production/inventory.yml');
        playbookFile = path.join(projectRoot, 'tools/ansible/live-deploy.yml');
        vaultFile = path.join(projectRoot, 'tools/ansible/inventories/production/group_vars/server.yml');
    }
    else {
        errors.push(`Unsupported environment: ${environment}`);
    }
    // Sanity check for file existence (optional, helps catch missing Ansible files early)
    const checkFiles = [inventoryFile, playbookFile];
    checkFiles.forEach((file) => {
        if (!fs.existsSync(file)) {
            errors.push(`Missing required file: ${file}`);
        }
    });
    return {
        valid: errors.length === 0,
        environment,
        inventoryFile,
        playbookFile,
        vaultFile,
        errors: errors.length > 0 ? errors : undefined,
    };
}
