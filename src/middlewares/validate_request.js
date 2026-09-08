const validate_request = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    convert: true,
    stripUnknown: false,
  });

  if (error) {
    return next(error);
  }

  if (property === 'query') {
    req.validated_query = value;
  } else {
    req[property] = value;
  }

  return next();
};

const validate_body = (schema) => validate_request(schema, 'body');
const validate_query = (schema) => validate_request(schema, 'query');
const validate_params = (schema) => validate_request(schema, 'params');

module.exports = {
  validate_body,
  validate_params,
  validate_query,
  validate_request,
};
