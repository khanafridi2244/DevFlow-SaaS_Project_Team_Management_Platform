const { ApiError } = require("../utils/apiError");
const { env } = require("../config/env");

// Handles Prisma's known error codes so DB errors don't leak as raw 500s
function handlePrismaError(err) {
  if (err.code === "P2002") {
    const field = err.meta?.target?.join(", ") || "field";
    return ApiError.conflict(`A record with this ${field} already exists`);
  }
  if (err.code === "P2025") {
    return ApiError.notFound("Record not found");
  }
  if (err.code === "P2003") {
    return ApiError.badRequest("Invalid reference to a related record");
  }
  return null;
}

// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  let error = err;

  // Normalize known Prisma errors into ApiError before responding
  if (err.code && err.code.startsWith("P")) {
    error = handlePrismaError(err) || error;
  }

  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational === true;

  if (!isOperational) {
    // Unexpected bug — log full detail server-side regardless of env
    console.error("UNEXPECTED ERROR:", err);
  }

  res.status(statusCode).json({
    success: false,
    message: isOperational ? error.message : "Something went wrong",
    ...(error.details ? { details: error.details } : {}),
    ...(!env.isProduction && !isOperational ? { stack: err.stack } : {}),
  });
}

module.exports = { errorMiddleware };