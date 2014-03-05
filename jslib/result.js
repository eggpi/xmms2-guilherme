var RESULT_TYPES = [
  'default',
  'signal',
  'broadcast'
];

var results_to_callbacks = {};
var results_to_resolvers = {};

var xmmsc_emscripten_js_callback = function(xval, res) {
  var type = RESULT_TYPES[_xmmsc_result_get_class(res)];
  var jsval = jsobj_from_xmmsv(xval);

  if (type == 'default') {
    var resolver = results_to_resolvers[res];

    if (_xmmsv_is_error(xval)) {
      resolver.reject(jsval);
    } else {
      resolver.resolve(jsval);
    }

    delete results_to_resolvers[res];
  } else {
    var callback = results_to_callbacks[res];
    var keep = !!callback(jsval, _xmmsv_is_error(xval));
    if (!keep) {
      delete results_to_callbacks[res];
    }

    return keep;
  }
}

function add_callback_for_result(result, callback) {
  _xmmsc_result_emscripten_notifier_set(result, result);
  results_to_callbacks[result] = callback;
}

function promise_from_result(result) {
  _xmmsc_result_emscripten_notifier_set(result, result);

  return new Promise(function(resolver) {
    results_to_resolvers[result] = resolver;
  });
}
