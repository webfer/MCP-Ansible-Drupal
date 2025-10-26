import fs from 'fs';
import path from 'path';

/**
 * Minimal cleanup tool: removes <workspace>/temporal entirely.
 * Keeps one lightweight safety check (must be inside workspace and named "temporal").
 */
export class AnsibleCleanUpTool {
  async run(): Promise<{ content: { type: string; text: string }[] }> {
    const workspace = process.cwd();
    const temporal = path.join(workspace, 'temporal');

    // Simple safety checks
    if (!temporal.startsWith(workspace)) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Safety check failed: ${temporal} not inside ${workspace}`,
          },
        ],
      };
    }
    if (path.basename(temporal) !== 'temporal') {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Safety check failed: unexpected directory name ${path.basename(
              temporal
            )}`,
          },
        ],
      };
    }

    if (!fs.existsSync(temporal)) {
      return {
        content: [
          {
            type: 'text',
            text: `ℹ️ Nothing to clean: ${temporal} does not exist.`,
          },
        ],
      };
    }

    try {
      // One-line deletion: removes directory and everything inside
      fs.rmSync(temporal, { recursive: true, force: true });
      return { content: [{ type: 'text', text: `🧹 Removed: ${temporal}` }] };
    } catch (err: any) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to remove ${temporal}: ${
              err?.message ?? String(err)
            }`,
          },
        ],
      };
    }
  }
}
