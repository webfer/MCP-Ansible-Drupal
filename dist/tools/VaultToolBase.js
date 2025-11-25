import path from 'path';
import fs from 'fs';
export class VaultToolBase {
    /**
     * Normalize environment aliases and projectRoot.
     * Accepts "stage", "live", or "production" and maps to internal paths.
     */
    normalizeArgs(args) {
        const rawEnv = args?.environment ||
            args?.arguments?.environment ||
            args?.arguments?.[0]?.environment ||
            args?.arguments?.[0] ||
            null;
        const environment = this.normalizeEnvironment(rawEnv);
        const projectRoot = args?.projectRoot ||
            args?.arguments?.projectRoot ||
            args?.arguments?.[0]?.projectRoot ||
            process.cwd();
        return { environment, projectRoot, rawArgs: args };
    }
    /**
     * Convert input environment to internal normalized value:
     * "stage" -> "stage"
     * "live" or "production" -> "production"
     */
    normalizeEnvironment(env) {
        if (!env)
            return null;
        env = env.toLowerCase();
        if (env === 'stage')
            return 'stage';
        if (env === 'live' || env === 'production')
            return 'production';
        return null;
    }
    /**
     * Resolve the vault file path based on environment and project root.
     */
    resolveVaultPath(projectRoot, environment) {
        const folder = environment === 'stage' ? 'stage' : 'production';
        return path.join(projectRoot, `ansible/core/inventories/${folder}/group_vars/server.yml`);
    }
    /**
     * Ensure the vault file exists, otherwise throw.
     */
    ensureFileExists(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Vault file not found: ${filePath}`);
        }
    }
    /**
     * Standardized debug message object for MCP responses.
     */
    createDebugMessage(content) {
        return { type: 'text', text: `[DEBUG] ${content}` };
    }
}
