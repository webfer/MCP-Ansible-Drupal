/**
 * executeDeployment.ts
 * --------------------
 * Executes the Ansible deployment playbook for the given environment.
 * It uses validated configuration, verified vault file, resolved paths,
 * and generated skip-tags from previous tasks.
 */
import { spawnSync } from 'child_process';
import { resolveProjectPaths } from './resolveProjectPaths.js';
import { generateSkipTags } from './generateSkipTags.js';
import { validateDeployConfig } from './validateDeployConfig.js';
import { verifyVaultFile } from './verifyVaultFile.js';
export async function executeDeployment(options) {
    const projectRoot = options.projectRoot || process.cwd();
    // ✅ Step 1: Validate configuration
    const validation = validateDeployConfig(options);
    if (!validation.valid) {
        throw new Error(`Invalid deploy configuration: ${validation.errors?.join(', ')}`);
    }
    // ✅ Use the original options directly (since validateDeployConfig only validates)
    const { environment, action, withAssets } = options;
    // ✅ Step 2: Resolve paths (inventory, playbook, vault)
    const paths = resolveProjectPaths({ projectRoot, environment });
    if (!paths.valid) {
        throw new Error(`Failed to resolve project paths: ${paths.errors?.join(', ')}`);
    }
    // ✅ Step 3: Verify vault file (use the selected environment and projectRoot)
    const vaultCheck = verifyVaultFile({
        projectRoot,
        environment,
    });
    if (!vaultCheck.valid) {
        throw new Error(`Vault file invalid: ${vaultCheck.errors?.join(', ')}`);
    }
    // ✅ Step 4: Generate skip-tags
    const skipTagsData = generateSkipTags({ environment, action, withAssets });
    if (!skipTagsData.valid) {
        throw new Error(`Failed to generate skip-tags: ${skipTagsData.description}`);
    }
    // ✅ Step 5: Construct ansible-playbook command
    const ansibleCmd = [
        'ansible-playbook',
        '-i',
        paths.inventoryFile,
        paths.playbookFile,
        '--vault-password-file',
        options.ansibleVaultPassFile || '/home/ansible/.vault_pass.txt',
        '--skip-tags',
        skipTagsData.skipTags.join(','),
    ];
    // Add extra vars if provided
    if (options.extraVars && Object.keys(options.extraVars).length > 0) {
        for (const [key, value] of Object.entries(options.extraVars)) {
            ansibleCmd.push('--extra-vars', `${key}=${value}`);
        }
    }
    // ✅ Step 6: Execute the command
    console.log(`\n🚀 Executing deployment: ${skipTagsData.description}`);
    console.log(`> ${ansibleCmd.join(' ')}\n`);
    const result = spawnSync(ansibleCmd[0], ansibleCmd.slice(1), {
        cwd: projectRoot,
        stdio: 'pipe',
        encoding: 'utf-8',
    });
    const success = result.status === 0;
    return {
        success,
        command: ansibleCmd.join(' '),
        output: result.stdout,
        errorOutput: result.stderr,
        exitCode: result.status ?? 1,
    };
}
