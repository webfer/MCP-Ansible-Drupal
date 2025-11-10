import fs from 'fs';
import path from 'path';

/**
 * getDeploymentLogs Tool
 * Reads the latest Ansible deployment logs from tools/tmp/logs.
 * Keeps only the last 3 deploy logs to avoid buildup.
 */
export const GetDeploymentLogsTool = {
  name: 'getDeploymentLogs',
  description:
    'Returns the most recent Ansible deployment log or a portion of it. Keeps logs for the last 3 deploys.',
  inputSchema: {
    type: 'object',
    properties: {
      lines: {
        type: 'number',
        description:
          'Number of lines from the end of the log file to return (default: 50)',
      },
    },
    required: [],
  },

  async run(args: { lines?: number }) {
    const logDir = path.resolve('./tools/tmp/logs');

    // Ensure directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
      console.error(
        JSON.stringify({
          type: 'info',
          message: '✅ Created logs directory at tools/tmp/logs',
        })
      );
      return {
        content: [
          {
            type: 'text',
            text: '⚠️ No existing logs found. A new log directory was created. Please run a deployment first.',
          },
        ],
      };
    }

    // Look for Ansible logs
    const files = fs
      .readdirSync(logDir)
      .filter((f) => f.startsWith('ansible') && f.endsWith('.log'))
      .sort(
        (a, b) =>
          fs.statSync(path.join(logDir, b)).mtimeMs -
          fs.statSync(path.join(logDir, a)).mtimeMs
      );

    // Rotate to keep only last 3 logs
    if (files.length > 3) {
      const oldFiles = files.slice(3);
      for (const old of oldFiles) {
        fs.unlinkSync(path.join(logDir, old));
        console.error(
          JSON.stringify({
            type: 'info',
            message: `🧹 Removed old log file: ${old}`,
          })
        );
      }
    }

    // If no logs exist
    if (files.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '⚠️ No Ansible deployment logs found yet. Please run a deployment first.',
          },
        ],
      };
    }

    // Get latest log
    const latestFile = path.join(logDir, files[0]);
    const logContent = fs.readFileSync(latestFile, 'utf-8');
    const lines = args.lines ?? 50;
    const logLines = logContent.trim().split('\n');
    const tail = logLines.slice(-lines).join('\n');

    // Debug info
    console.error(
      JSON.stringify({
        type: 'info',
        message: `✅ Returning last ${lines} lines from ${files[0]}`,
      })
    );

    return {
      content: [
        {
          type: 'text',
          text: `📜 Showing last ${lines} lines from ${files[0]}:\n\n${tail}`,
        },
      ],
    };
  },
};
