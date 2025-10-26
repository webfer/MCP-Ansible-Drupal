import fs from 'fs';
import path from 'path';

/**
 * Moves Ansible configuration files and tools
 * from /temporal/ansible-drupal to the project root.
 */
export class AnsibleSetUpTool {
  private pendingOverwriteItems: string[] | null = null;

  async run(args?: {
    confirm?: boolean;
  }): Promise<{ content: { type: string; text: string }[] }> {
    const workspaceFolder = process.cwd();
    const sourceDir = path.join(workspaceFolder, 'temporal', 'ansible-drupal');

    if (!fs.existsSync(sourceDir)) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Source directory does not exist: ${sourceDir}`,
          },
        ],
      };
    }

    const itemsToMove = ['tools', 'ansible.cfg', 'vault_pass.txt'];
    const existingItems: string[] = [];

    // Detect existing items in workspace
    for (const item of itemsToMove) {
      if (fs.existsSync(path.join(workspaceFolder, item)))
        existingItems.push(item);
    }

    // Ask for confirmation before overwrite
    if (existingItems.length > 0 && !args?.confirm) {
      this.pendingOverwriteItems = existingItems;
      return {
        content: [
          {
            type: 'text',
            text: `⚠️ These items already exist: ${existingItems.join(
              ', '
            )}. Reply with "yes" to overwrite or "no" to cancel.`,
          },
        ],
      };
    }

    this.pendingOverwriteItems = null;

    // Move files and folders
    const movedItems: string[] = [];
    const errors: string[] = [];

    for (const item of itemsToMove) {
      const srcPath = path.join(sourceDir, item);
      const destPath = path.join(workspaceFolder, item);

      try {
        if (fs.existsSync(destPath))
          fs.rmSync(destPath, { recursive: true, force: true });
        if (fs.existsSync(srcPath)) {
          fs.renameSync(srcPath, destPath);
          movedItems.push(item);
        }
      } catch (err: any) {
        errors.push(`${item} -> ${err.message}`);
      }
    }

    const messages: string[] = [];
    if (movedItems.length)
      messages.push(`✅ Moved successfully: ${movedItems.join(', ')}`);
    if (errors.length)
      messages.push(`⚠️ Errors encountered:\n${errors.join('\n')}`);

    return { content: [{ type: 'text', text: messages.join('\n') }] };
  }

  isAwaitingConfirmation(): boolean {
    return !!this.pendingOverwriteItems;
  }

  resetPending(): void {
    this.pendingOverwriteItems = null;
  }
}
