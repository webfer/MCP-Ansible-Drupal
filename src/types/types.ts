export interface ExecuteDeploymentOptions {
  environment: 'stage' | 'live' | 'production';
  action?: 'install' | 'update';
  withAssets?: boolean;
  projectRoot?: string;
  ansibleVaultPassFile?: string;
  extraVars?: Record<string, string>;
}

export interface ExecuteDeploymentResult {
  success: boolean;
  command: string;
  output: string;
  errorOutput?: string;
  exitCode: number;
  messages?: { type: string; text: string }[];
}

export interface RunAnsibleResult {
  success: boolean;
  command: string;
  exitCode: number;
  messages: { type: 'text'; text: string }[];
  stdout?: string;
  stderr?: string;
}
