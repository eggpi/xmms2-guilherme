import os
from indenter import Indenter

def include_file(path):
	with open(path) as include:
		for line in include:
			Indenter.printline(line.rstrip())

def generate(includedir):
	includes = (
		"emscripten/xmmsclient.js",
		"promise/Promise.js",
		"idnumbers.js",
		"coll.js",
		"xmmsv.js",
		"result.js",
		"xmms2.js"
	)

	Indenter.printline("(function(global) {")
	Indenter.enter()

	Indenter.printline("var xmmsclient = global.xmmsclient = {};")
	Indenter.printline("xmmsclient.collections = {};")

	for filename in includes:
		include_file(os.path.join(includedir, filename))

	Indenter.leave("})(this);")

if __name__ == "__main__":
	import sys
	generate(sys.argv[1])
