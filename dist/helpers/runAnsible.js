import { spawn } from 'child_process';
/**
 * Executes an Ansible command with live stdout/stderr streaming.
 *
 * @param ansibleCmd Array of command and arguments, e.g. ['ansible-playbook', 'site.yml', ...]
 * @param cwd Current working directory for the command
 * @param onLine Optional callback for each output line
 */
export async function runAnsible(ansibleCmd, cwd, onLine, environment, env) {
    const envLabel = environment?.toUpperCase() || '';
    const messages = [];
    let stdout = '';
    let stderr = '';
    /**
     * Cleans raw Ansible lines by removing color codes and normalizing whitespace.
     */
    const cleanAnsi = (input) => input
        .replace(/\x1B\[[0-9;]*[A-Za-z]/g, '') // remove ANSI codes
        .replace(/^\[ANSIBLE\]\s*/g, '') // strip custom prefixes
        .replace(/\r/g, '')
        .trim();
    /**
     * Formats lines for better human readability.
     * Adds emoji and spacing for key Ansible phases.
     */
    const formatLine = (line) => {
        if (!line.trim())
            return '';
        if (line.startsWith('PLAY ['))
            return `🟦 ${line}`;
        if (line.startsWith('TASK ['))
            return `🔸 ${line}`;
        if (line.startsWith('changed:'))
            return `🟡 ${line}`;
        if (line.startsWith('ok:'))
            return `✅ ${line}`;
        if (line.startsWith('skipping:'))
            return `⚪ ${line}`;
        if (line.startsWith('failed:'))
            return `❌ ${line}`;
        if (line.startsWith('included:'))
            return `📄 ${line}`;
        if (line.startsWith('PLAY RECAP'))
            return `📘 ${line}`;
        if (line.startsWith('fatal:'))
            return `🚨 ${line}`;
        if (line.startsWith('error:'))
            return `🚫 ${line}`;
        return line; // fallback
    };
    messages.push({
        type: 'text',
        text: `🚀 Executing: ${ansibleCmd.join(' ')}`,
    });
    return new Promise((resolve) => {
        const proc = spawn(ansibleCmd[0], ansibleCmd.slice(1), {
            cwd,
            shell: true,
        });
        const handleLine = (line, isError = false) => {
            let cleaned = cleanAnsi(line).replace(/[\r\n]+$/g, '');
            if (!cleaned)
                return;
            const formatted = formatLine(cleaned);
            const output = envLabel
                ? `[${envLabel}] ${isError ? '❗ ' : ''}${formatted}`
                : `${isError ? '❗ ' : ''}${formatted}`;
            messages.push({ type: 'text', text: output });
            if (onLine)
                onLine(output);
        };
        proc.stdout.on('data', (data) => {
            const chunk = data.toString();
            stdout += chunk;
            chunk.split('\n').forEach((line) => handleLine(line));
        });
        proc.stderr.on('data', (data) => {
            const chunk = data.toString();
            stderr += chunk;
            chunk.split('\n').forEach((line) => handleLine(line, true));
        });
        proc.on('close', (exitCode) => {
            resolve({
                success: exitCode === 0,
                command: ansibleCmd.join(' '),
                exitCode: exitCode ?? 1,
                messages,
                stdout,
                stderr,
            });
        });
    });
}
