import fs from 'fs';
import path from 'path';
export class AnsibleSetUpTool {
    pendingOverwriteItems = null;
    async run(args) {
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
        const existingItems = [];
        for (const item of itemsToMove) {
            if (fs.existsSync(path.join(workspaceFolder, item)))
                existingItems.push(item);
        }
        // If files exist and user has not confirmed, prompt first
        if (existingItems.length > 0 && !args?.confirm) {
            this.pendingOverwriteItems = existingItems;
            return {
                content: [
                    {
                        type: 'text',
                        text: `⚠️ These items already exist: ${existingItems.join(', ')}. Reply with "yes" to overwrite or "no" to cancel.`,
                    },
                ],
            };
        }
        // If user confirmed or no conflicts
        const movedItems = [];
        const errors = [];
        for (const item of itemsToMove) {
            const srcPath = path.join(sourceDir, item);
            const destPath = path.join(workspaceFolder, item);
            try {
                if (fs.existsSync(destPath))
                    fs.rmSync(destPath, { recursive: true, force: true });
                if (fs.existsSync(srcPath))
                    fs.renameSync(srcPath, destPath);
                movedItems.push(item);
            }
            catch (err) {
                errors.push(`${item} -> ${err.message}`);
            }
        }
        this.pendingOverwriteItems = null;
        const messages = [];
        if (movedItems.length)
            messages.push(`✅ Moved: ${movedItems.join(', ')}`);
        if (errors.length)
            messages.push(`⚠️ Errors: ${errors.join(', ')}`);
        return { content: [{ type: 'text', text: messages.join('\n') }] };
    }
    isAwaitingConfirmation() {
        return !!this.pendingOverwriteItems;
    }
}
