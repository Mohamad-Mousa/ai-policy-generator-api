class ResponseService {
  static success(res, message, results, statusCode) {
    res.status(statusCode).json({
      message,
      error: false,
      code: statusCode,
      results,
    });
  }

  static error(res, message, statusCode) {
    const codes = [200, 201, 400, 401, 404, 405, 403, 409, 422, 500];

    const findCode = codes.find((code) => code == statusCode);

    if (!findCode) statusCode = 400;
    else statusCode = findCode;

    res.status(statusCode).json({
      message: message || "Something went wrong",
      code: statusCode,
      error: true,
    });
  }

  static validation(res, errors) {
    res.status(422).json({
      message: "Validation errors",
      error: true,
      code: 422,
      errors,
    });
  }
}

module.exports = ResponseService;
