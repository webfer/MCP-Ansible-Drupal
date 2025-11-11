import { ExecuteDeploymentTool } from '../tools/index.js';
let pendingFirstDeployment = {
    awaitingConfirmation: false,
    awaitingType: false,
};
/**
 * Resets the pending deployment state and clears any timeout.
 */
function resetPendingDeployment() {
    if (pendingFirstDeployment.timeoutId) {
        clearTimeout(pendingFirstDeployment.timeoutId);
    }
    pendingFirstDeployment = { awaitingConfirmation: false, awaitingType: false };
    console.log(JSON.stringify({
        type: 'info',
        message: '✅ Pending deployment state reset',
    }));
}
/**
 * Sets a timeout to auto-reset the pending state after 2 minutes.
 */
function setPendingTimeout() {
    if (pendingFirstDeployment.timeoutId) {
        clearTimeout(pendingFirstDeployment.timeoutId);
    }
    pendingFirstDeployment.timeoutId = setTimeout(() => {
        resetPendingDeployment();
        console.log(JSON.stringify({
            type: 'info',
            message: '⚠️ Pending deployment timed out after 2 minutes',
        }));
    }, 2 * 60 * 1000); // 2 minutes
}
/**
 * Handles prompting and confirmation for deployment actions.
 */
export async function handleFirstDeploymentConfirmation(args) {
    console.log(JSON.stringify({
        type: 'info',
        message: `✅ handleFirstDeploymentConfirmation called with args: ${JSON.stringify(args)}`,
    }));
    const tool = new ExecuteDeploymentTool();
    const safeArgs = args ?? {};
    // STEP 1: If awaiting deploy type (install/update)
    if (pendingFirstDeployment.awaitingType) {
        console.log(JSON.stringify({
            type: 'info',
            message: '✅ Pending deployment awaitingType = true',
        }));
        const response = safeArgs.action || safeArgs.text || safeArgs.response || '';
        const normalized = String(response).toLowerCase().trim();
        if (['install', 'initial', 'first'].includes(normalized)) {
            pendingFirstDeployment = {
                awaitingType: false,
                awaitingConfirmation: true,
                args: { ...pendingFirstDeployment.args, action: 'install' },
            };
            setPendingTimeout();
            console.log(JSON.stringify({
                type: 'info',
                message: '⚠️ User selected INSTALL, awaiting confirmation',
            }));
            return {
                content: [
                    {
                        type: 'text',
                        text: '⚠️ This will overwrite existing code on the server. Do you want to continue? (yes/no)',
                    },
                ],
            };
        }
        if (normalized === 'update') {
            const confirmedArgs = {
                ...pendingFirstDeployment.args,
                action: 'update',
            };
            resetPendingDeployment();
            console.log(JSON.stringify({
                type: 'info',
                message: '✅ User selected UPDATE, running deployment immediately',
            }));
            return await tool.run(confirmedArgs);
        }
        console.log(JSON.stringify({
            type: 'info',
            message: '⚠️ User response not recognized, asking for "install" or "update"',
        }));
        return {
            content: [
                {
                    type: 'text',
                    text: '⚠️ Please specify either "install" or "update".',
                },
            ],
        };
    }
    // STEP 2: If awaiting confirmation for install
    if (pendingFirstDeployment.awaitingConfirmation) {
        console.log(JSON.stringify({
            type: 'info',
            message: '✅ Pending deployment awaitingConfirmation = true',
        }));
        const response = safeArgs.confirmAnswer || safeArgs.text || safeArgs.response || '';
        const normalized = String(response).toLowerCase().trim();
        if (normalized === 'yes') {
            const confirmedArgs = pendingFirstDeployment.args;
            resetPendingDeployment();
            console.log(JSON.stringify({
                type: 'info',
                message: '✅ User confirmed INSTALL, proceeding with deployment',
            }));
            const result = await tool.run(confirmedArgs);
            return {
                content: [
                    { type: 'text', text: '✅ Proceeding with initial deployment...' },
                    ...result.content,
                ],
            };
        }
        if (normalized === 'no') {
            resetPendingDeployment();
            console.log(JSON.stringify({
                type: 'info',
                message: '❌ User cancelled initial deployment',
            }));
            return {
                content: [
                    { type: 'text', text: '❌ Initial deployment cancelled by user.' },
                ],
            };
        }
        return {
            content: [{ type: 'text', text: '⚠️ Please reply with "yes" or "no".' }],
        };
    }
    // STEP 3: First time request, missing action
    if (!safeArgs.action) {
        pendingFirstDeployment = {
            awaitingType: true,
            awaitingConfirmation: false,
            args: {
                ...safeArgs,
                environment: safeArgs.environment || 'stage',
            },
        };
        setPendingTimeout();
        console.log(JSON.stringify({
            type: 'info',
            message: '🤔 User did not specify action, asking for install/update',
        }));
        return {
            content: [
                {
                    type: 'text',
                    text: '🤔 Is this an initial installation or an update? (install/update)',
                },
            ],
        };
    }
    // STEP 4: Require confirmation for install
    if (safeArgs.action === 'install') {
        pendingFirstDeployment = {
            awaitingType: false,
            awaitingConfirmation: true,
            args: {
                ...safeArgs,
                environment: safeArgs.environment || 'stage',
            },
        };
        setPendingTimeout();
        console.log(JSON.stringify({
            type: 'info',
            message: '⚠️ Action = install, awaiting user confirmation',
        }));
        return {
            content: [
                {
                    type: 'text',
                    text: '⚠️ This will overwrite existing code on the server. Do you want to continue? (yes/no)',
                },
            ],
        };
    }
    // STEP 5: For updates, run immediately
    console.log(JSON.stringify({
        type: 'info',
        message: '✅ Action = update, running deployment immediately',
    }));
    return await tool.run(safeArgs);
}
