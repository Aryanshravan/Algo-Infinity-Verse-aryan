export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || err.statusCode || 500;

  const errorResponse = {
    type: err.type || 'about:blank',
    title: err.title || (status === 500 ? 'Internal Server Error' : 'Error'),
    status: status,
    detail: err.message || 'An unexpected error occurred',
    instance: req.originalUrl || req.url,
  };

  if (status === 400 && !err.title) errorResponse.title = 'Bad Request';
  if (status === 401 && !err.title) errorResponse.title = 'Unauthorized';
  if (status === 403 && !err.title) errorResponse.title = 'Forbidden';
  if (status === 404 && !err.title) errorResponse.title = 'Not Found';
  if (status === 415 && !err.title) errorResponse.title = 'Unsupported Media Type';
  if (status === 429 && !err.title) errorResponse.title = 'Too Many Requests';

  res.status(status).type('application/problem+json').json(errorResponse);
};
