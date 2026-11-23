export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const error = Object.assign(new Error('Validation failed'), {
        statusCode: 422,
        errors: result.error.errors,
      });
      return next(error);
    }
    req.body = result.data;
    next();
  };
}
