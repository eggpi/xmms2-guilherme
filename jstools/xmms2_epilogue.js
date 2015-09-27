// some hand-implemented methods

this.collection_save = function(collection, name, namespace) {
    collection = xmmsv_from_jsobj(collection);
    var res = Module.ccall('xmmsc_collection_save', 'number', ['number', 'number', 'string', 'string'], [_xc, collection, name, name_space]);
    _xmmsv_unref(collection);
    return promise_from_result(res);
}

this.collection_query_infos = function(collection, order, lim_start, lim_len, fetch, group) {
    collection = xmmsv_from_jsobj(collection);
    order = xmmsv_from_jsobj(order);
    fetch = xmmsv_from_jsobj(fetch);
    group = xmmsv_from_jsobj(group);
    var res = Module.ccall('xmmsc_coll_query_infos', 'number', ['number', 'number', 'number', 'number', 'number', 'number', 'number'], [_xc, collection, order, lim_start, lim_len, fetch, group]);
    _xmmsv_unref(collection);
    _xmmsv_unref(order);
    _xmmsv_unref(fetch);
    _xmmsv_unref(group);
    return promise_from_result(res);
}

this.collection_query_ids = function(collection, order, lim_start, lim_len) {
    collection = xmmsv_from_jsobj(collection);
    order = xmmsv_from_jsobj(order);
    var res = Module.ccall('xmmsc_coll_query_ids', 'number', ['number', 'number', 'number', 'number', 'number'], [_xc, collection, order, lim_start, lim_len]);
    _xmmsv_unref(collection);
    _xmmsv_unref(order);
    return promise_from_result(res);
}

this.playlist_insert_id = function(playlist, pos, id) {
  var res = Module.ccall('xmmsc_playlist_insert_id', 'number', ['number', 'number', 'number', 'number'], [_xc, playlist, pos, id]);
  return promise_from_result(res);
}

this.playlist_clear = function(playlist) {
  var res = Module.ccall('xmmsc_playlist_clear', 'number', ['number', 'number'], [_xc, playlist]);
  return promise_from_result(res);
}

this.disconnect = function() {
  Module.ccall('xmmsc_unref', null, ['number'], [_xc]);
  _xmmsc_mainloop_emscripten_deinit();
  _xc = null;
}

if (window.location.protocol == "https:") {
  Module['websocket']['url'] = 'wss://';
}
