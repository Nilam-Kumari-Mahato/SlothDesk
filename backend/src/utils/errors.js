export class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function errorHandler(error, _req, res, _next) {
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'REQUEST_TOO_LARGE', message: 'Request is too large.' } });
  }
  if (error?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' } });
  }
  const isValidationError = error?.name === 'ZodError';
  const status = isValidationError ? 400 : Number.isInteger(error.status) ? error.status : 500;
  if (isValidationError) {
    return res.status(status).json({ error: { code: 'INVALID_REQUEST', message: error.issues?.[0]?.message || 'Request validation failed.' } });
  }
  const safeMessage = status >= 500 && !(error instanceof AppError) && error.code !== 'AI_NOT_CONFIGURED'
    ? 'The service could not complete this request. Please try again.'
    : error.message;
  return res.status(status).json({ error: { code: error.code || 'INTERNAL_ERROR', message: safeMessage } });
}
