export function sendSuccess(res, data, message, statusCode = 200, pagination) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(pagination && { pagination }),
  });
}

export function sendError(res, message, statusCode = 500, errors) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
}
