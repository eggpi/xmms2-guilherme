import genipc
from indenter import Indenter

ipc_type_to_emscripten_type = {
	"string": "string",
	"int": "number"
}

unimplemented_argument_types = (
	"binary"
)

unimplemented_return_types = (
	"binary"
)

renamed_objects_in_js_methods = {
	"main": "server",
	"coll_sync": "coll"
}

renamed_objects_in_c_methods = {
	"collection": "coll",
	"coll_sync": "coll"
}

skip_c_methods = [
	"xmmsc_coll_save",
	"xmmsc_coll_query_infos"
]

def emit_preamble():
	Indenter.printline("function XMMS2(client_name) {")
	Indenter.enter()

	Indenter.printline(
		"var _xc = Module.ccall('xmmsc_init', 'number', ['string'], [client_name]);")

	Indenter.printline()
	emit_methods_preamble()

def emit_methods_preamble():
	Indenter.printline("this.connect = function(xmms_path) {")
	Indenter.enter()

	Indenter.printline(
		"Module.ccall('xmmsc_connect', 'number', ['number', 'string'], [_xc, xmms_path]);")
	Indenter.printline("_xmmsc_mainloop_emscripten_init(_xc);")
	Indenter.printline("return promise_from_result(_xmmsc_send_hello(_xc));")
	Indenter.leave("};")

def emit_epilogue():
    with open("xmms2_epilogue.js") as epilogue:
        for line in epilogue:
            Indenter.printline(line.rstrip());
	Indenter.leave("}")
	Indenter.printline("xmmsclient.XMMS2 = XMMS2");

def get_js_method_name_for_signal(object, broadcast):
	return "_".join(("signal", object.name, broadcast.name))

def get_js_method_name_for_broadcast(object, broadcast):
	return "_".join(("broadcast", object.name, broadcast.name))

def get_js_method_name_for_method(object, method):
	objname = renamed_objects_in_js_methods.get(object.name, object.name)
	return "_".join((objname, method.name))

def get_c_function_name_for_signal(object, broadcast):
	return "_".join(("xmmsc", "signal", object.name, broadcast.name))

def get_c_function_name_for_broadcast(object, broadcast):
	return "_".join(("xmmsc", "broadcast", object.name, broadcast.name))

def get_c_function_name_for_method(object, method):
	objname = renamed_objects_in_c_methods.get(object.name, object.name)
	return "_".join(("xmmsc", objname, method.name))

def emit_method(object, method):
	js_method = get_js_method_name_for_method(object, method)
	c_function = get_c_function_name_for_method(object, method)

	if c_function in skip_c_methods:
		return False

	if method.return_value:
		ipc_return_types = set(method.return_value.type)
		if ipc_return_types.intersection(unimplemented_return_types):
			# TODO figure this out
			return False

	js_method_args = [] # the names of the arguments for the generated method
	c_arg_types = ["number"] # emscripten types of args for the C function
	c_invocation_args = ["_xc"] # the arguments to call the C function with
	args_that_need_conversion = [] # js args that need to be turned into xmmsv

	for arg in method.arguments:
		if set(arg.type).intersection(unimplemented_argument_types):
			# TODO figure this out
			return False

		js_method_args.append(arg.name)

		# can we get emscripten to convert the js argument to
		# C argument for us?
		if len(arg.type) == 1 and arg.type[0] in ipc_type_to_emscripten_type:
			c_arg_type = ipc_type_to_emscripten_type[arg.type[0]]
			c_invocation_args.append(arg.name)
		else:
			c_arg_type = "number"
			c_invocation_args.append(arg.name)
			args_that_need_conversion.append(arg.name)

		c_arg_types.append(c_arg_type)

	js_method_args_string = ", ".join(js_method_args)
	c_invocation_args_string = ", ".join(c_invocation_args)

	Indenter.printline("this.%s = function(%s) {" % (js_method, js_method_args_string))
	Indenter.enter()

	for arg in args_that_need_conversion:
		Indenter.printline("%s = xmmsv_from_jsobj(%s);" % (arg, arg))

	Indenter.printline(
		"var res = Module.ccall('%s', 'number', %s, [%s]);" %
		(c_function, c_arg_types, c_invocation_args_string))

	for arg in args_that_need_conversion:
		Indenter.printline("_xmmsv_unref(%s);" % arg)

	Indenter.printline("return promise_from_result(res);")
	Indenter.leave("};")
	return True

def emit_broadcast(object, broadcast):
	js_method = get_js_method_name_for_broadcast(object, broadcast)
	c_function = get_c_function_name_for_broadcast(object, broadcast)

	if broadcast.return_value:
		ipc_return_types = set(broadcast.return_value.type)
		if ipc_return_types.intersection(unimplemented_return_types):
			# TODO figure this out
			return False

	Indenter.printline("this.%s = function(callback) {" % js_method)
	Indenter.enter()

	Indenter.printline(
		"var res = Module.ccall('%s', 'number', ['number'], [_xc]);" % c_function)
	Indenter.printline("add_callback_for_result(res, callback);")
	Indenter.leave("};")

	return True

def emit_signal(object, signal):
	js_method = get_js_method_name_for_signal(object, signal)
	c_function = get_c_function_name_for_signal(object, signal)

	if signal.return_value:
		ipc_return_types = set(signal.return_value.type)
		if ipc_return_types.intersection(unimplemented_return_types):
			# TODO figure this out
			return False

	Indenter.printline("this.%s = function(callback) {" % js_method)
	Indenter.enter()

	Indenter.printline(
		"var res = Module.ccall('%s', 'number', ['number'], [_xc]);" % c_function)
	Indenter.printline("add_callback_for_result(res, callback);")
	Indenter.leave("};")

	return True

def build(ipcxml):
	ipc = genipc.parse_xml(ipcxml)

	emit_preamble()
	Indenter.printline()

	def emit(emitter, object, entity):
		Indenter.printline()
		wrapped = emitter(object, entity)
		if not wrapped:
			Indenter.printline(
				"// failed to generate " + entity.name + " for " + object.name)


	for object in ipc.objects:
		Indenter.printline()
		for method in object.methods:
			emit(emit_method, object, method)

		Indenter.printline()
		for broadcast in object.broadcasts:
			emit(emit_broadcast, object, broadcast)

		Indenter.printline()
		for signal in object.signals:
			emit(emit_signal, object, signal)

	Indenter.printline()
	emit_epilogue()

if __name__ == "__main__":
	import sys
	build(sys.argv[1])
