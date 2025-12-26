export function logError(message: string, error: unknown): void {
  // This is a simple logger. In production, integrate with a logging service.
  process.stderr.write(`${message} ${JSON.stringify(error)}\n`);
}

export function logInfo(message: string, data?: unknown): void {
  // Log informational messages
  const output = data ? `${message} ${JSON.stringify(data)}` : message;
  process.stdout.write(`${output}\n`);
}
