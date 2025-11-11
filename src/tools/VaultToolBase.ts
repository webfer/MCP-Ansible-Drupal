import path from 'path';
import fs from 'fs';

export interface VaultToolArgs {
  environment?: 'stage' | 'live' | 'production';
  projectRoot?: string;
  arguments?: any;
}

export abstract class VaultToolBase {
  abstract name: string;
  abstract description: string;

  /**
   * Normalize environment aliases and projectRoot.
   * Accepts "stage", "live", or "production" and maps to internal paths.
   */
  protected normalizeArgs(args?: VaultToolArgs) {
    const rawEnv =
      args?.environment ||
      args?.arguments?.environment ||
      args?.arguments?.[0]?.environment ||
      args?.arguments?.[0] ||
      null;

    const environment = this.normalizeEnvironment(rawEnv);

    const projectRoot =
      args?.projectRoot ||
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
  protected normalizeEnvironment(
    env: string | undefined
  ): 'stage' | 'production' | null {
    if (!env) return null;
    env = env.toLowerCase();

    if (env === 'stage') return 'stage';
    if (env === 'live' || env === 'production') return 'production';

    return null;
  }

  /**
   * Resolve the vault file path based on environment and project root.
   */
  protected resolveVaultPath(
    projectRoot: string,
    environment: 'stage' | 'production'
  ) {
    const folder = environment === 'stage' ? 'stage' : 'production';

    return path.join(
      projectRoot,
      `tools/ansible/inventories/${folder}/group_vars/server.yml`
    );
  }

  /**
   * Ensure the vault file exists, otherwise throw.
   */
  protected ensureFileExists(filePath: string) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Vault file not found: ${filePath}`);
    }
  }

  /**
   * Standardized debug message object for MCP responses.
   */
  protected createDebugMessage(content: string) {
    return { type: 'text' as const, text: `[DEBUG] ${content}` };
  }
}
