var XMMSV_TYPES = [
  'none',
  'error',
  'int64',
  'string',
  'coll',
  'bin',
  'list',
  'dict',
  'bitbuffer',
  'float',
  'end'
];

var xv_to_js_converters = {
  'none': function(xval) {
    return null;
  },

  'error': function(xval) {
    var pp = _malloc(8), ret = null;

    if (_xmmsv_get_error(xval, pp)) {
      var p = getValue(pp, 'i64');
      ret = Pointer_stringify(p);
    }

    _free(pp);
    return ret;
  },

  'int64': function(xval) {
    var p = _malloc(8), ret = null;

    if (_xmmsv_get_int64(xval, p)) {
      ret = getValue(p, 'i64');
    }

    _free(p);
    return ret;
  },

  'string': function(xval) {
    var pp = _malloc(8), ret = null;

    if (_xmmsv_get_string(xval, pp)) {
      var p = getValue(pp, 'i64');
      ret = Pointer_stringify(p);
    }

    _free(pp);
    return ret;
  },

  'list': function(xval) {
    var ppit = _malloc(8), ppv = _malloc(8), ret = [];

    _xmmsv_get_list_iter(xval, ppit);
    var pit = getValue(ppit, 'i64');

    while (_xmmsv_list_iter_valid(pit)) {
      _xmmsv_list_iter_entry(pit, ppv);
      var pv = getValue(ppv, 'i64');

      ret.push(jsobj_from_xmmsv(pv))
      _xmmsv_list_iter_next(pit);
    }

    _free(ppit);
    _free(ppv);
    return ret;
  },

  'dict': function(xval) {
    var ppit = _malloc(8),
        ppk = _malloc(8),
        ppv = _malloc(8),
        ret = {};

    _xmmsv_get_dict_iter(xval, ppit);
    var pit = getValue(ppit, 'i64');

    while (_xmmsv_dict_iter_valid(pit)) {
      _xmmsv_dict_iter_pair(pit, ppk, ppv);

      var pk = getValue(ppk, 'i64'),
          pv = getValue(ppv, 'i64');

      ret[Pointer_stringify(pk)] = jsobj_from_xmmsv(pv);
      _xmmsv_dict_iter_next(pit);
    }

    _free(ppit);
    _free(ppk);
    _free(ppv);
    return ret;
  },

  'coll': function(xval) {
    var type = _xmmsv_coll_get_type(xval),
        ops = jsobj_from_xmmsv(_xmmsv_coll_operands_get(xval)),
        attrs = jsobj_from_xmmsv(_xmmsv_coll_attributes_get(xval));

    // XXX idlist not implemented
    return new Collection(type, ops, attrs);
  }
};

function jsobj_from_xmmsv(xval) {
  var type = XMMSV_TYPES[_xmmsv_get_type(xval)];

  if (type in xv_to_js_converters) {
    return xv_to_js_converters[type](xval);
  } else {
    console.err("No converter for xmmsv of type '" + type + "'");
  }
}

var js_to_xv_converters = {
  'Number': function(jsnum) {
    return _xmmsv_new_int(jsnum);
  },

  'String': function(jsstr) {
    return Module.ccall('xmmsv_new_string', 'number', ['string'], [jsstr]);
  },

  'Array': function(jsarray) {
    var pxlist = _xmmsv_new_list();

    for (var i = 0; i < jsarray.length; i++) {
      var pxitem = xmmsv_from_jsobj(jsarray[i]);
      _xmmsv_list_append(pxlist, pxitem);
    }

    return pxlist;
  },

  'Object': function(jsobj) {
    var pxdict = _xmmsv_new_dict();

    for (var key in jsobj) {
      if (!jsobj.hasOwnProperty(key)) {
        continue;
      }
      var val = xmmsv_from_jsobj(jsobj[key]);
      Module.ccall('xmmsv_dict_set', 'number',
                   ['number', 'string', 'number'], [pxdict, key, val]);
    }

    return pxdict;
  },

  'Collection': function(jscoll) {
    var pxcoll = _xmmsv_new_coll(jscoll.type);

    var pxattr = xmmsv_from_jsobj(jscoll.attributes);
    _xmmsv_coll_attributes_set(pxcoll, pxattr);
    _xmmsv_unref(pxattr);

    var pxop = xmmsv_from_jsobj(jscoll.operands);
    _xmmsv_coll_operands_set(pxcoll, pxop);
    _xmmsv_unref(pxop);

    return pxcoll;
  }
};

function xmmsv_from_jsobj(jsobj) {
  var type = jsobj.constructor.name;

  if (type in js_to_xv_converters) {
    return js_to_xv_converters[type](jsobj);
  } else {
    console.err("No converter for js object of type '" + type + "'");
  }
}
