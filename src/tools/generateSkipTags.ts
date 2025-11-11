/**
 * generateSkipTags.ts
 * -------------------
 * Generates the appropriate list of Ansible tags to skip based on:
 * - environment ("stage" | "live")
 * - action ("install" | "update")
 * - whether assets should be deployed (withAssets)
 *
 * This logic mirrors the conditions from the Bash `ansible-deploy` function.
 */

export interface GenerateSkipTagsInput {
  environment: 'stage' | 'live';
  action: 'install' | 'update';
  withAssets?: boolean;
}

export interface GenerateSkipTagsResult {
  valid: boolean;
  skipTags: string[];
  description: string;
}

/**
 * Generate skip-tags list according to environment and action.
 */
export function generateSkipTags(
  input: GenerateSkipTagsInput
): GenerateSkipTagsResult {
  const { environment, action, withAssets } = input;
  let skipTags: string[] = [];
  let description = '';

  // Build skip tags logic
  if (environment === 'stage') {
    if (action === 'install') {
      description = 'Stage install deployment';
      skipTags = withAssets
        ? ['import_config', 'clean_up', 'auth_cleanup', 's_live']
        : [
            'import_config',
            'deploy_assets',
            'clean_up',
            'auth_cleanup',
            's_live',
          ];
    } else if (action === 'update') {
      description = 'Stage update deployment';
      skipTags = [
        'deploy',
        'unarchive_db',
        'db_update',
        'deploy_assets',
        'auth_cleanup',
        's_live',
      ];
    }
  } else if (environment === 'live') {
    if (action === 'install') {
      description = 'Live install deployment';
      skipTags = withAssets
        ? ['import_config', 'clean_up', 'auth', 's_stage']
        : ['import_config', 'deploy_assets', 'clean_up', 'auth', 's_stage'];
    } else if (action === 'update') {
      description = 'Live update deployment';
      skipTags = [
        'deploy',
        'unarchive_db',
        'db_update',
        'deploy_assets',
        'auth',
        's_stage',
      ];
    }
  }

  // Validate combination
  if (skipTags.length === 0) {
    return {
      valid: false,
      skipTags: [],
      description: `Invalid combination: environment=${environment}, action=${action}`,
    };
  }

  return {
    valid: true,
    skipTags,
    description,
  };
}
