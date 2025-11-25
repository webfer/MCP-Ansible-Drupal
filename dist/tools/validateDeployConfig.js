/**
 * validateDeployConfig.ts
 * -----------------------
 * Validates deployment configuration options for the MCP-Ansible-Drupal deployment system.
 *
 * It ensures that a valid environment (stage/live) and action (install/update)
 * are provided unless the cleanup-auth flag is set.
 */
/**
 * Validates and normalizes a deployment configuration.
 */
export function validateDeployConfig(input) {
    const errors = [];
    const validEnvironments = ['stage', 'live'];
    const validActions = ['install', 'update'];
    const environment = input.environment?.toLowerCase();
    const action = input.action?.toLowerCase();
    const withAssets = Boolean(input.withAssets);
    const cleanupAuth = Boolean(input.cleanupAuth);
    // Case 1: Cleanup-auth path (no env/action required)
    if (cleanupAuth) {
        return {
            valid: true,
            normalized: {
                environment: undefined,
                action: undefined,
                withAssets: false,
                cleanupAuth: true,
            },
        };
    }
    // Case 2: Standard deploy path (both env + action required)
    if (!environment || !validEnvironments.includes(environment)) {
        errors.push(`Invalid or missing environment. Expected one of: ${validEnvironments.join(', ')}.`);
    }
    if (!action || !validActions.includes(action)) {
        errors.push(`Invalid or missing action. Expected one of: ${validActions.join(', ')}.`);
    }
    if (errors.length > 0) {
        return { valid: false, errors };
    }
    return {
        valid: true,
        normalized: {
            environment,
            action,
            withAssets,
            cleanupAuth,
        },
    };
}
