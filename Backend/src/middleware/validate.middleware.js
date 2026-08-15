const { ApiError } = require("../utils/apiError");

/**
 * Usage: validate(loginSchema) as route middleware.
 * The schema should define { body, params, query } shapes as needed —
 * see src/modules/auth/auth.validation.js for real examples.
 */
function validate(schema) {
  return function (req, res, next) {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      return next(ApiError.badRequest("Validation failed", details));
    }

    // Overwrite req.body etc. with the parsed (and type-coerced) data
    req.body = result.data.body ?? req.body;
    req.params = result.data.params ?? req.params;
    req.query = result.data.query ?? req.query;

    next();
  };
}

module.exports = { validate };