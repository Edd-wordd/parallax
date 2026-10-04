export class DataAccessError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "DataAccessError";
  }
}

export function assertNoError(
  error: { message: string } | null,
  context: string,
): void {
  if (error) {
    throw new DataAccessError(`${context}: ${error.message}`, error);
  }
}
