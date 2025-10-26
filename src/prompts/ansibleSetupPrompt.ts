/**
 * MCP prompt: Ansible Set Up
 * Guides the user before moving Ansible files from temporal to project root.
 */

export async function GetAnsibleSetupPrompt(): Promise<{
  messages: { content: { type: string; text: string } }[];
}> {
  const basePrompt = `This tool will move the Ansible configuration files
(tools, ansible.cfg, vault_pass.txt) from /temporal/ansible-drupal to the project root.

If the files already exist, the tool will ask you to confirm before overwriting them.
To proceed, call the "ansibleSetup" tool.`;

  return {
    messages: [
      {
        content: {
          type: 'text',
          text: basePrompt,
        },
      },
    ],
  };
}
