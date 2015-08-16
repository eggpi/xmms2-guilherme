xmmsclient.collections = {};

function Collection(type, operands, attributes) {
  this.idlist = []; // XXX not implemented
  this.type = type;
  this.operands = operands ? operands : [];
  this.attributes = attributes ? attributes : {};
  this.ordering = [];
}

Collection.prototype.attr = function coll_attr(key, value) {
  this.attributes[key] = value;
  return this;
}

Collection.prototype.op = function coll_op(operand) {
  this.operands.push(operand);
  return this;
}

Collection.prototype.order = function coll_order(order) {
  this.ordering = order;
  return this;
}

xmmsclient.collections.Collection = Collection;

// XXX Collection.prototype.equals = ...?

function Order() {
  // XXX not implemented
}

function Limit() {
  // XXX not implemented
}

function MediaSet() {
  // XXX not implemented
}

function IdList() {
  // XXX not implemented
}

function Reference(to, namespace) {
  if (namespace === undefined) {
    namespace = "Collections";
  }

  return new Collection(xmmsclient.XMMS_COLLECTION_TYPE_REFERENCE, [],
                        {"namespace": namespace, "reference": to});
}

function Universe() {
  return new Reference("All Media", "Collections");
}

xmmsclient.collections.Universe = Universe;

function UnaryFilter(type, field, parent) {
  if (parent === undefined) {
    parent = Universe();
  }

  return new Collection(type, [parent], {"field": field});
}

xmmsclient.collections.Has = UnaryFilter.bind(null, xmmsclient.XMMS_COLLECTION_TYPE_HAS);
xmmsclient.collections.Token = UnaryFilter.bind(null, xmmsclient.XMMS_COLLECTION_TYPE_TOKEN); // XXX

function BinaryFilter(type, field, value, parent) {
  if (parent === undefined) {
    parent = Universe();
  }

  return new Collection(type, [parent], {"field": field, "value": value});
}

xmmsclient.collections.Match = BinaryFilter.bind(null, xmmsclient.XMMS_COLLECTION_TYPE_MATCH); // XXX
xmmsclient.collections.Equals = BinaryFilter.bind(null, xmmsclient.XMMS_COLLECTION_TYPE_EQUALS);
xmmsclient.collections.NotEqual = BinaryFilter.bind(null, xmmsclient.XMMS_COLLECTION_TYPE_NOTEQUAL);
xmmsclient.collections.Smaller = BinaryFilter.bind(null, xmmsclient.XMMS_COLLECTION_TYPE_SMALLER);
xmmsclient.collections.SmallerEqual = BinaryFilter.bind(null, xmmsclient.XMMS_COLLECTION_TYPE_SMALLEREQ);
xmmsclient.collections.Greater = BinaryFilter.bind(null, xmmsclient.XMMS_COLLECTION_TYPE_GREATER);
xmmsclient.collections.GreaterEqual = BinaryFilter.bind(null, xmmsclient.XMMS_COLLECTION_TYPE_GREATEREQ);

function SetOperation() {
  var type = arguments[0],
      collections = Array.prototype.slice.call(arguments, 1);
  return new Collection(type, collections);
}

xmmsclient.collections.Union = SetOperation.bind(null, xmmsclient.XMMS_COLLECTION_TYPE_UNION);
xmmsclient.collections.Intersection = SetOperation.bind(null, xmmsclient.XMMS_COLLECTION_TYPE_INTERSECTION);
xmmsclient.collections.Complement = SetOperation.bind(null, xmmsclient.XMMS_COLLECTION_TYPE_COMPLEMENT);

xmmsclient.collections.coll_parse = function coll_parse(pattern) {
  var pp = _malloc(8), ret = null;

  var ok = Module.ccall('xmmsv_coll_parse', 'number', ['string', 'number'], [pattern, pp]);
  if (ok) {
    var p = getValue(pp, 'i64');
    ret = jsobj_from_xmmsv(p);
    _xmmsv_unref(p);
  }

  _free(pp);
  return ret;
}
