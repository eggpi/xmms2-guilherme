emcc \
src/lib/xmmstypes/xlist.c \
src/lib/xmmstypes/value_serialize.c \
src/lib/xmmstypes/xmmsv_bitbuffer.c \
src/lib/xmmstypes/xmmsv_build.c \
src/lib/xmmstypes/xmmsv_coll.c \
src/lib/xmmstypes/xmmsv_copy.c \
src/lib/xmmstypes/xmmsv_dict.c \
src/lib/xmmstypes/xmmsv_general.c \
src/lib/xmmstypes/xmmsv_list.c \
src/lib/xmmstypes/xmmsv_util.c \
src/lib/xmmssocket/socket_common.c \
src/lib/xmmssocket/socket_unix.c \
src/lib/xmmsipc/msg.c \
src/lib/xmmsipc/socket_tcp.c \
src/lib/xmmsipc/transport.c \
src/lib/xmmsipc/url.c \
src/lib/xmmsipc/socket_unix.c \
src/lib/xmmsipc/transport_unix.c \
src/lib/xmmsutils/strlist.c \
src/lib/xmmsutils/utils.c \
src/lib/xmmsutils/utils_unix.c \
src/lib/xmmsutils/log.c \
src/lib/xmmsutils/stacktrace_dummy.c \
src/lib/xmmsvisualization/timestamp.c \
src/lib/xmmsvisualization/udp.c \
src/clients/lib/xmmsclient/collection.c \
src/clients/lib/xmmsclient/collparser.c \
src/clients/lib/xmmsclient/bindata.c \
src/clients/lib/xmmsclient/config.c \
src/clients/lib/xmmsclient/ipc.c \
src/clients/lib/xmmsclient/medialib.c \
src/clients/lib/xmmsclient/playback.c \
src/clients/lib/xmmsclient/playlist.c \
src/clients/lib/xmmsclient/result.c \
src/clients/lib/xmmsclient/stats.c \
src/clients/lib/xmmsclient/xmmsclient.c \
src/clients/lib/xmmsclient/xform.c \
src/clients/lib/xmmsclient/xqueue.c \
src/clients/lib/xmmsclient/visualization/client.c \
src/clients/lib/xmmsclient/visualization/udp.c \
src/clients/lib/xmmsclient/visualization/dummy.c \
src/clients/lib/xmmsclient-emscripten/xmmsclient-emscripten.c \
-I src/include -I src/includepriv -I _build_ \
-s LINKABLE=1 -s EXPORT_ALL=1 -o jslib/emscripten/xmmsclient.js

PYTHONPATH=waftools/ python jstools/generate_idnumbers.py > jslib/idnumbers.js
(cd jstools; PYTHONPATH=../waftools/ python generate_xmms2.py ../src/ipc.xml > ../jslib/xmms2.js)
PYTHONPATH=waftools/ python jstools/generate_xmmsclient.py jslib > jslib/build/xmmsclient.js
