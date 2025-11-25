export interface RepositoryUrlArguments {
  owner: string;
  name: string;
  repoUrl: string;
}

/**
 * Returns a human-readable base prompt for guiding the MCP action.
 * This is used when invoking `/prompt clone_ansible_drupal` from VS Code.
 */
export async function GetAnsibleDrupalRepoUrl(
  args: RepositoryUrlArguments
): Promise<{
  messages: Array<{ content: { type: 'text'; text: string } }>;
}> {
  const { owner, name, repoUrl } = args;

  // 🧠 Extended base prompt
  const basePrompt = `
You are about to initialize the DrupAnsible setup tool for managing Drupal projects.

This operation will:
- Use Git to clone the **DrupAnsible automation repository** from GitHub.
- Place it in a temporary working directory inside your local workspace (/temporal).
- Prepare all necessary Ansible playbooks and configuration files.

Repository details:
- Owner: ${owner}
- Name: ${name}
- Repository URL: ${repoUrl}

Instructions:
1. Confirm that your workspace contains a valid Drupal installation (with 'vendor' and 'web' directories).
2. When ready, the tool \`cloneRepository\` will execute:
   \`\`\`bash
   git clone ${repoUrl} /temporal/drupansible
   \`\`\`
3. After cloning, you can review or customize Ansible playbooks in the /temporal/drupansible directory.

Proceed to run this operation if you wish to initialize DrupAnsible locally.
  `.trim();

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
