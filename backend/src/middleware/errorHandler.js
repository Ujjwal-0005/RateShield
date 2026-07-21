const mongoose = require("mongoose");

function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  console.error(error);

  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || "Internal server error";
  const payload = { success: false };

  if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    message = "Validation failed";
    payload.errors = Object.values(error.errors).map((item) => item.message);
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${error.path}`;
  } else if (error.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(error.keyValue || {});
    message = fields.length > 0
      ? `${fields.join(", ")} already exists`
      : "Duplicate key value already exists";
  } else if (statusCode === 500) {
    message = "Internal server error";
  }

  payload.message = message;

  response.status(statusCode).json(payload);
}

module.exports = errorHandler;