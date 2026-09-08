const async_handler = (handler) => (req, res, next) => {
  return Promise.resolve(handler(req, res, next)).catch(next);
};

module.exports = async_handler;
