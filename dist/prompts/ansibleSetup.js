/**
 * MCP prompt: Ansible Set Up
 * Guides the user before moving Ansible files from temporal to project root.
 */
export async function GetAnsibleSetupPrompt() {
    const text = `
🚀 You are about to set up the Ansible environment for your Drupal project.

This operation will move the following items from the temporary Ansible-Drupal repository (/temporal/ansible-drupal) into your project root (${process.cwd()}):

- tools (directory)
- ansible.cfg (file)
- vault_pass.txt (file)

⚠️ Important Notes:
- Any existing files/directories in the project root with the same names will trigger a confirmation prompt before being overwritten.
- Ensure your Drupal project is ready and the /temporal/ansible-drupal directory exists.
- After moving, the Ansible environment will be ready to execute playbooks and manage the site.

You can trigger this operation via the 'ansibleSetup' tool after reviewing this prompt.
  `.trim();
    return { messages: [{ content: { type: 'text', text } }] };
}
