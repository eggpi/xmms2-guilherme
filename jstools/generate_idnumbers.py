from indenter import Indenter

enums = dict(
  xmms_playback_seek_mode_t = [
      "PADDING",
      "XMMS_PLAYBACK_SEEK_CUR",
      "XMMS_PLAYBACK_SEEK_SET"
  ],

  xmms_playback_status_t = [
      "XMMS_PLAYBACK_STATUS_STOP",
      "XMMS_PLAYBACK_STATUS_PLAY",
      "XMMS_PLAYBACK_STATUS_PAUSE"
  ],

  xmms_playlist_changed_actions_t = [
      "XMMS_PLAYLIST_CHANGED_ADD",
      "XMMS_PLAYLIST_CHANGED_INSERT",
      "XMMS_PLAYLIST_CHANGED_SHUFFLE", # deprecated
      "XMMS_PLAYLIST_CHANGED_REMOVE",
      "XMMS_PLAYLIST_CHANGED_CLEAR", # deprecated
      "XMMS_PLAYLIST_CHANGED_MOVE",
      "XMMS_PLAYLIST_CHANGED_SORT", # deprecated
      "XMMS_PLAYLIST_CHANGED_UPDATE",
      "XMMS_PLAYLIST_CHANGED_REPLACE"
  ],

  xmmsv_coll_type_t = [
      "XMMS_COLLECTION_TYPE_REFERENCE",
      "XMMS_COLLECTION_TYPE_UNIVERSE",
      "XMMS_COLLECTION_TYPE_UNION",
      "XMMS_COLLECTION_TYPE_INTERSECTION",
      "XMMS_COLLECTION_TYPE_COMPLEMENT",
      "XMMS_COLLECTION_TYPE_HAS",
      "XMMS_COLLECTION_TYPE_MATCH",
      "XMMS_COLLECTION_TYPE_TOKEN",
      "XMMS_COLLECTION_TYPE_EQUALS",
      "XMMS_COLLECTION_TYPE_NOTEQUAL",
      "XMMS_COLLECTION_TYPE_SMALLER",
      "XMMS_COLLECTION_TYPE_SMALLEREQ",
      "XMMS_COLLECTION_TYPE_GREATER",
      "XMMS_COLLECTION_TYPE_GREATEREQ",
      "XMMS_COLLECTION_TYPE_ORDER",
      "XMMS_COLLECTION_TYPE_LIMIT",
      "XMMS_COLLECTION_TYPE_MEDIASET",
      "XMMS_COLLECTION_TYPE_IDLIST"
  ]
)

if __name__ == "__main__":
	for name, enum in enums.items():
		Indenter.printline("// " + name)

		for value, label in enumerate(enum):
			if label == "PADDING":
				continue

			Indenter.printline("xmmsclient.%s = %s;" % (label, value))

		Indenter.printline()
