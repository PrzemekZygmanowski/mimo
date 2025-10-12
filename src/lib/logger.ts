export function logError(message: string, error: unknown): void {
  // This is a simple logger. In production, integrate with a logging service.
  process.stderr.write(`${message} ${JSON.stringify(error)}\n`);
}
