import * as fs from 'fs';
import * as path from 'path';
import simpleGit from 'simple-git';
/**
 * Clone the ansible-drupal repository into <workspace>/temporal/ansible-drupal
 * Returns a textual result describing the outcome.
 */
export async function cloneRepository() {
    const workspace = process.cwd(); // MCP filesystem workspace
    const temporalDir = path.join(workspace, 'temporal');
    const targetDir = path.join(temporalDir, 'ansible-drupal');
    const gitUrl = 'https://github.com/webfer/ansible-drupal.git';
    const git = simpleGit();
    // Ensure temporal directory exists
    try {
        if (!fs.existsSync(temporalDir)) {
            fs.mkdirSync(temporalDir, { recursive: true });
        }
    }
    catch (err) {
        throw new Error(`Failed to create temporal directory: ${err.message}`);
    }
    // If already cloned, return an informative message
    if (fs.existsSync(targetDir)) {
        return `Repository already exists at ${targetDir}`;
    }
    // Perform clone
    try {
        await git.clone(gitUrl, targetDir);
        return `Repository successfully cloned to ${targetDir}`;
    }
    catch (err) {
        throw new Error(`Failed to clone repository: ${err.message}`);
    }
}
