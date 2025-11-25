import type { ExecuteDeploymentOptions } from '../types/index.js';
import { ExecuteDeploymentTool } from '../tools/index.js';

interface PendingDeploymentState {
  awaitingConfirmation: boolean;
  args?: ExecuteDeploymentOptions;
  timeoutId?: NodeJS.Timeout;
}

let pendingFirstDeployment: PendingDeploymentState = {
  awaitingConfirmation: false,
};

/**
 * Reset pending deployment state and clear timeout.
 */
function resetPendingDeployment() {
  if (pendingFirstDeployment.timeoutId) {
    clearTimeout(pendingFirstDeployment.timeoutId);
  }
  pendingFirstDeployment = { awaitingConfirmation: false };
  console.log(
    JSON.stringify({
      type: 'info',
      message: 'Reset pending deployment state',
    })
  );
}

/**
 * Auto-timeout after 2 minutes.
 */
function startTimeout() {
  if (pendingFirstDeployment.timeoutId) {
    clearTimeout(pendingFirstDeployment.timeoutId);
  }
  pendingFirstDeployment.timeoutId = setTimeout(() => {
    console.log(
      JSON.stringify({
        type: 'info',
        message: 'Pending deployment timed out after 2 minutes',
      })
    );
    resetPendingDeployment();
  }, 2 * 60 * 1000);
}

/**
 * MAIN HANDLER
 */
export async function handleFirstDeploymentConfirmation(
  args: Record<string, any>
): Promise<{ content: { type: string; text: string }[] }> {
  const tool = new ExecuteDeploymentTool();
  const safeArgs = args ?? {};

  console.log(
    JSON.stringify({
      type: 'info',
      message: `confirm handler received: ${JSON.stringify(safeArgs)}`,
    })
  );

  // ------------------------------------------------------------
  // 1. If awaiting "yes/no" confirmation
  // ------------------------------------------------------------
  if (pendingFirstDeployment.awaitingConfirmation) {
    const userResponse =
      safeArgs.confirmAnswer || safeArgs.text || safeArgs.response || '';
    const normalized = String(userResponse).trim().toLowerCase();

    if (normalized === 'yes') {
      // Build a **fully valid ExecuteDeploymentOptions** object
      const confirmedArgs: ExecuteDeploymentOptions = {
        action: pendingFirstDeployment.args!.action,
        environment: pendingFirstDeployment.args!.environment,
        projectRoot: pendingFirstDeployment.args!.projectRoot,
        withAssets: pendingFirstDeployment.args!.withAssets,
        ansibleVaultPassFile: pendingFirstDeployment.args!.ansibleVaultPassFile,
        extraVars: pendingFirstDeployment.args!.extraVars,
      };

      resetPendingDeployment();

      console.log(
        JSON.stringify({
          type: 'info',
          message: '✅ User confirmed INSTALL, proceeding with deployment',
        })
      );

      const result = await tool.run(confirmedArgs);

      return {
        content: [
          { type: 'text', text: '✅ Proceeding with initial deployment…' },
          ...result.content,
        ],
      };
    }

    if (normalized === 'no') {
      resetPendingDeployment();
      console.log(
        JSON.stringify({
          type: 'info',
          message: '❌ User cancelled initial deployment',
        })
      );
      return {
        content: [{ type: 'text', text: '❌ Initial deployment cancelled.' }],
      };
    }

    return {
      content: [{ type: 'text', text: '⚠️ Please reply with "yes" or "no".' }],
    };
  }

  // ------------------------------------------------------------
  // 2. User provided action directly
  // ------------------------------------------------------------
  if (safeArgs.action) {
    const action = String(safeArgs.action).toLowerCase().trim();

    if (['install', 'initial', 'first'].includes(action)) {
      // Store fully normalized args
      pendingFirstDeployment = {
        awaitingConfirmation: true,
        args: {
          action: 'install',
          environment: safeArgs.environment || 'stage',
          projectRoot: safeArgs.projectRoot,
          withAssets: safeArgs.withAssets ?? false,
          ansibleVaultPassFile: safeArgs.ansibleVaultPassFile,
          extraVars: safeArgs.extraVars,
        },
      };
      startTimeout();

      console.log(
        JSON.stringify({
          type: 'info',
          message:
            'Action = install → asking for yes/no confirmation before running',
        })
      );

      return {
        content: [
          {
            type: 'text',
            text: '⚠️ This will overwrite existing code on the server. Continue? (yes/no)',
          },
        ],
      };
    }

    if (action === 'update') {
      const updateArgs: ExecuteDeploymentOptions = {
        action: 'update',
        environment: safeArgs.environment || 'stage',
        projectRoot: safeArgs.projectRoot,
        withAssets: safeArgs.withAssets ?? false,
        ansibleVaultPassFile: safeArgs.ansibleVaultPassFile,
        extraVars: safeArgs.extraVars,
      };

      console.log(
        JSON.stringify({
          type: 'info',
          message: 'Action = update → running immediately',
        })
      );

      return await tool.run(updateArgs);
    }

    return {
      content: [
        {
          type: 'text',
          text: '⚠️ Please specify a valid action: "install" or "update".',
        },
      ],
    };
  }

  // ------------------------------------------------------------
  // 3. Action missing entirely
  // ------------------------------------------------------------
  return {
    content: [
      {
        type: 'text',
        text: '🤔 Missing action. Please specify "install" or "update".',
      },
    ],
  };
}
