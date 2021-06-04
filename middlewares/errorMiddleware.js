const httpError = require('http-errors');

class ErrorMiddleware {
  constructor(_httpError) {
    this._httpError = _httpError;
    this.defaultError = this.defaultError.bind(this);
    this.processError = this.processError.bind(this);
  }

  defaultError(req, res, next) {
    next(this._httpError.NotFound());
  }

  processError(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      status: 'error',
      message: err.message || 'Internal Server Error',
    });
  }
}

module.exports = new ErrorMiddleware(httpError);
