import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';
/**
 * Tool class to clone (or re-clone) the Ansible Drupal repository.
 * Usage: new CloneRepositoryTool().run({ repoUrl? })
 */
export class CloneRepositoryTool {
    git;
    constructor() {
        this.git = simpleGit();
    }
    async run(args) {
        // Default repository URL
        const repoUrl = args?.repoUrl ?? 'https://github.com/webfer/ansible-drupal.git';
        const tempDir = path.join(process.cwd(), 'temporal');
        const targetDir = path.join(tempDir, 'ansible-drupal');
        try {
            // Ensure temporal directory exists
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            // If the directory already exists, remove it before cloning
            if (fs.existsSync(targetDir)) {
                fs.rmSync(targetDir, { recursive: true, force: true });
            }
            // Clone repository
            await this.git.clone(repoUrl, targetDir);
            const message = `✅ Repository successfully cloned (or updated)!\n\n- Source: ${repoUrl}\n- Destination: ${targetDir}`;
            return {
                content: [{ type: 'text', text: message }],
            };
        }
        catch (error) {
            const errorMsg = `❌ Failed to clone repository: ${error.message}`;
            return {
                content: [{ type: 'text', text: errorMsg }],
            };
        }
    }
}
