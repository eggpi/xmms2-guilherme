function XMMS2(client_name) {
	var _xc = Module.ccall('xmmsc_init', 'number', ['string'], [client_name]);

	this.connect = function(xmms_path) {
		Module.ccall('xmmsc_connect', 'number', ['number', 'string'], [_xc, xmms_path]);
		_xmmsc_mainloop_emscripten_init(_xc);
		return promise_from_result(_xmmsc_send_hello(_xc));
	};



	this.server_hello = function(protocol_version, client) {
		var res = Module.ccall('xmmsc_main_hello', 'number', ['number', 'number', 'string'], [_xc, protocol_version, client]);
		return promise_from_result(res);
	};

	this.server_quit = function() {
		var res = Module.ccall('xmmsc_main_quit', 'number', ['number'], [_xc]);
		return promise_from_result(res);
	};

	this.server_list_plugins = function(plugin_type) {
		var res = Module.ccall('xmmsc_main_list_plugins', 'number', ['number', 'number'], [_xc, plugin_type]);
		return promise_from_result(res);
	};

	this.server_stats = function() {
		var res = Module.ccall('xmmsc_main_stats', 'number', ['number'], [_xc]);
		return promise_from_result(res);
	};


	this.broadcast_main_quit = function(callback) {
		var res = Module.ccall('xmmsc_broadcast_main_quit', 'number', ['number'], [_xc]);
		add_callback_for_result(res, callback);
	};



	this.playlist_replace = function(playlist, replacement, action) {
		replacement = xmmsv_from_jsobj(replacement);
		var res = Module.ccall('xmmsc_playlist_replace', 'number', ['number', 'string', 'number', 'number'], [_xc, playlist, replacement, action]);
		_xmmsv_unref(replacement);
		return promise_from_result(res);
	};

	this.playlist_set_next = function(position) {
		var res = Module.ccall('xmmsc_playlist_set_next', 'number', ['number', 'number'], [_xc, position]);
		return promise_from_result(res);
	};

	this.playlist_set_next_rel = function(position_delta) {
		var res = Module.ccall('xmmsc_playlist_set_next_rel', 'number', ['number', 'number'], [_xc, position_delta]);
		return promise_from_result(res);
	};

	this.playlist_add_url = function(name, url) {
		var res = Module.ccall('xmmsc_playlist_add_url', 'number', ['number', 'string', 'string'], [_xc, name, url]);
		return promise_from_result(res);
	};

	this.playlist_add_collection = function(name, collection) {
		collection = xmmsv_from_jsobj(collection);
		var res = Module.ccall('xmmsc_playlist_add_collection', 'number', ['number', 'string', 'number'], [_xc, name, collection]);
		_xmmsv_unref(collection);
		return promise_from_result(res);
	};

	this.playlist_remove_entry = function(playlist, position) {
		var res = Module.ccall('xmmsc_playlist_remove_entry', 'number', ['number', 'string', 'number'], [_xc, playlist, position]);
		return promise_from_result(res);
	};

	this.playlist_move_entry = function(playlist, current_position, new_position) {
		var res = Module.ccall('xmmsc_playlist_move_entry', 'number', ['number', 'string', 'number', 'number'], [_xc, playlist, current_position, new_position]);
		return promise_from_result(res);
	};

	this.playlist_list_entries = function(name) {
		var res = Module.ccall('xmmsc_playlist_list_entries', 'number', ['number', 'string'], [_xc, name]);
		return promise_from_result(res);
	};

	this.playlist_current_pos = function(name) {
		var res = Module.ccall('xmmsc_playlist_current_pos', 'number', ['number', 'string'], [_xc, name]);
		return promise_from_result(res);
	};

	this.playlist_current_active = function() {
		var res = Module.ccall('xmmsc_playlist_current_active', 'number', ['number'], [_xc]);
		return promise_from_result(res);
	};

	this.playlist_insert_url = function(name, position, url) {
		var res = Module.ccall('xmmsc_playlist_insert_url', 'number', ['number', 'string', 'number', 'string'], [_xc, name, position, url]);
		return promise_from_result(res);
	};

	this.playlist_insert_collection = function(name, position, collection) {
		collection = xmmsv_from_jsobj(collection);
		var res = Module.ccall('xmmsc_playlist_insert_collection', 'number', ['number', 'string', 'number', 'number'], [_xc, name, position, collection]);
		_xmmsv_unref(collection);
		return promise_from_result(res);
	};

	this.playlist_load = function(name) {
		var res = Module.ccall('xmmsc_playlist_load', 'number', ['number', 'string'], [_xc, name]);
		return promise_from_result(res);
	};

	this.playlist_radd = function(name, url) {
		var res = Module.ccall('xmmsc_playlist_radd', 'number', ['number', 'string', 'string'], [_xc, name, url]);
		return promise_from_result(res);
	};

	this.playlist_rinsert = function(name, position, url) {
		var res = Module.ccall('xmmsc_playlist_rinsert', 'number', ['number', 'string', 'number', 'string'], [_xc, name, position, url]);
		return promise_from_result(res);
	};


	this.broadcast_playlist_changed = function(callback) {
		var res = Module.ccall('xmmsc_broadcast_playlist_changed', 'number', ['number'], [_xc]);
		add_callback_for_result(res, callback);
	};

	this.broadcast_playlist_current_pos = function(callback) {
		var res = Module.ccall('xmmsc_broadcast_playlist_current_pos', 'number', ['number'], [_xc]);
		add_callback_for_result(res, callback);
	};

	this.broadcast_playlist_loaded = function(callback) {
		var res = Module.ccall('xmmsc_broadcast_playlist_loaded', 'number', ['number'], [_xc]);
		add_callback_for_result(res, callback);
	};



	this.config_get_value = function(key) {
		var res = Module.ccall('xmmsc_config_get_value', 'number', ['number', 'string'], [_xc, key]);
		return promise_from_result(res);
	};

	this.config_set_value = function(key, value) {
		var res = Module.ccall('xmmsc_config_set_value', 'number', ['number', 'string', 'string'], [_xc, key, value]);
		return promise_from_result(res);
	};

	this.config_register_value = function(key, value) {
		var res = Module.ccall('xmmsc_config_register_value', 'number', ['number', 'string', 'string'], [_xc, key, value]);
		return promise_from_result(res);
	};

	this.config_list_values = function() {
		var res = Module.ccall('xmmsc_config_list_values', 'number', ['number'], [_xc]);
		return promise_from_result(res);
	};


	this.broadcast_config_value_changed = function(callback) {
		var res = Module.ccall('xmmsc_broadcast_config_value_changed', 'number', ['number'], [_xc]);
		add_callback_for_result(res, callback);
	};



	this.playback_start = function() {
		var res = Module.ccall('xmmsc_playback_start', 'number', ['number'], [_xc]);
		return promise_from_result(res);
	};

	this.playback_stop = function() {
		var res = Module.ccall('xmmsc_playback_stop', 'number', ['number'], [_xc]);
		return promise_from_result(res);
	};

	this.playback_pause = function() {
		var res = Module.ccall('xmmsc_playback_pause', 'number', ['number'], [_xc]);
		return promise_from_result(res);
	};

	this.playback_tickle = function() {
		var res = Module.ccall('xmmsc_playback_tickle', 'number', ['number'], [_xc]);
		return promise_from_result(res);
	};

	this.playback_playtime = function() {
		var res = Module.ccall('xmmsc_playback_playtime', 'number', ['number'], [_xc]);
		return promise_from_result(res);
	};

	this.playback_seek_ms = function(offset_milliseconds, whence) {
		var res = Module.ccall('xmmsc_playback_seek_ms', 'number', ['number', 'number', 'number'], [_xc, offset_milliseconds, whence]);
		return promise_from_result(res);
	};

	this.playback_seek_samples = function(offset_samples, whence) {
		var res = Module.ccall('xmmsc_playback_seek_samples', 'number', ['number', 'number', 'number'], [_xc, offset_samples, whence]);
		return promise_from_result(res);
	};

	this.playback_status = function() {
		var res = Module.ccall('xmmsc_playback_status', 'number', ['number'], [_xc]);
		return promise_from_result(res);
	};

	this.playback_current_id = function() {
		var res = Module.ccall('xmmsc_playback_current_id', 'number', ['number'], [_xc]);
		return promise_from_result(res);
	};

	this.playback_volume_set = function(channel, volume) {
		var res = Module.ccall('xmmsc_playback_volume_set', 'number', ['number', 'string', 'number'], [_xc, channel, volume]);
		return promise_from_result(res);
	};

	this.playback_volume_get = function() {
		var res = Module.ccall('xmmsc_playback_volume_get', 'number', ['number'], [_xc]);
		return promise_from_result(res);
	};


	this.broadcast_playback_status = function(callback) {
		var res = Module.ccall('xmmsc_broadcast_playback_status', 'number', ['number'], [_xc]);
		add_callback_for_result(res, callback);
	};

	this.broadcast_playback_volume_changed = function(callback) {
		var res = Module.ccall('xmmsc_broadcast_playback_volume_changed', 'number', ['number'], [_xc]);
		add_callback_for_result(res, callback);
	};

	this.broadcast_playback_current_id = function(callback) {
		var res = Module.ccall('xmmsc_broadcast_playback_current_id', 'number', ['number'], [_xc]);
		add_callback_for_result(res, callback);
	};


	this.signal_playback_playtime = function(callback) {
		var res = Module.ccall('xmmsc_signal_playback_playtime', 'number', ['number'], [_xc]);
		add_callback_for_result(res, callback);
	};


	this.medialib_get_info = function(id) {
		var res = Module.ccall('xmmsc_medialib_get_info', 'number', ['number', 'number'], [_xc, id]);
		return promise_from_result(res);
	};

	this.medialib_import_path = function(directory) {
		var res = Module.ccall('xmmsc_medialib_import_path', 'number', ['number', 'string'], [_xc, directory]);
		return promise_from_result(res);
	};

	this.medialib_rehash = function(id) {
		var res = Module.ccall('xmmsc_medialib_rehash', 'number', ['number', 'number'], [_xc, id]);
		return promise_from_result(res);
	};

	this.medialib_get_id = function(url) {
		var res = Module.ccall('xmmsc_medialib_get_id', 'number', ['number', 'string'], [_xc, url]);
		return promise_from_result(res);
	};

	this.medialib_remove_entry = function(entry) {
		var res = Module.ccall('xmmsc_medialib_remove_entry', 'number', ['number', 'number'], [_xc, entry]);
		return promise_from_result(res);
	};

	this.medialib_set_property_string = function(entry, source, key, value) {
		var res = Module.ccall('xmmsc_medialib_set_property_string', 'number', ['number', 'number', 'string', 'string', 'string'], [_xc, entry, source, key, value]);
		return promise_from_result(res);
	};

	this.medialib_set_property_int = function(entry, source, key, value) {
		var res = Module.ccall('xmmsc_medialib_set_property_int', 'number', ['number', 'number', 'string', 'string', 'number'], [_xc, entry, source, key, value]);
		return promise_from_result(res);
	};

	this.medialib_remove_property = function(entry, source, key) {
		var res = Module.ccall('xmmsc_medialib_remove_property', 'number', ['number', 'number', 'string', 'string'], [_xc, entry, source, key]);
		return promise_from_result(res);
	};

	this.medialib_move_entry = function(entry, url) {
		var res = Module.ccall('xmmsc_medialib_move_entry', 'number', ['number', 'number', 'string'], [_xc, entry, url]);
		return promise_from_result(res);
	};

	this.medialib_add_entry = function(url) {
		var res = Module.ccall('xmmsc_medialib_add_entry', 'number', ['number', 'string'], [_xc, url]);
		return promise_from_result(res);
	};


	this.broadcast_medialib_entry_added = function(callback) {
		var res = Module.ccall('xmmsc_broadcast_medialib_entry_added', 'number', ['number'], [_xc]);
		add_callback_for_result(res, callback);
	};

	this.broadcast_medialib_entry_changed = function(callback) {
		var res = Module.ccall('xmmsc_broadcast_medialib_entry_changed', 'number', ['number'], [_xc]);
		add_callback_for_result(res, callback);
	};

	this.broadcast_medialib_entry_removed = function(callback) {
		var res = Module.ccall('xmmsc_broadcast_medialib_entry_removed', 'number', ['number'], [_xc]);
		add_callback_for_result(res, callback);
	};



	this.collection_get = function(name, name_space) {
		var res = Module.ccall('xmmsc_coll_get', 'number', ['number', 'string', 'string'], [_xc, name, name_space]);
		return promise_from_result(res);
	};

	this.collection_list = function(name_space) {
		var res = Module.ccall('xmmsc_coll_list', 'number', ['number', 'string'], [_xc, name_space]);
		return promise_from_result(res);
	};

	// failed to generate save for collection

	this.collection_remove = function(name, name_space) {
		var res = Module.ccall('xmmsc_coll_remove', 'number', ['number', 'string', 'string'], [_xc, name, name_space]);
		return promise_from_result(res);
	};

	this.collection_find = function(entry, name_space) {
		var res = Module.ccall('xmmsc_coll_find', 'number', ['number', 'number', 'string'], [_xc, entry, name_space]);
		return promise_from_result(res);
	};

	this.collection_rename = function(original_name, new_name, name_space) {
		var res = Module.ccall('xmmsc_coll_rename', 'number', ['number', 'string', 'string', 'string'], [_xc, original_name, new_name, name_space]);
		return promise_from_result(res);
	};

	this.collection_query = function(collection, fetch) {
		collection = xmmsv_from_jsobj(collection);
		fetch = xmmsv_from_jsobj(fetch);
		var res = Module.ccall('xmmsc_coll_query', 'number', ['number', 'number', 'number'], [_xc, collection, fetch]);
		_xmmsv_unref(collection);
		_xmmsv_unref(fetch);
		return promise_from_result(res);
	};

	// failed to generate query_infos for collection

	this.collection_idlist_from_playlist = function(path) {
		var res = Module.ccall('xmmsc_coll_idlist_from_playlist', 'number', ['number', 'string'], [_xc, path]);
		return promise_from_result(res);
	};


	this.broadcast_collection_changed = function(callback) {
		var res = Module.ccall('xmmsc_broadcast_collection_changed', 'number', ['number'], [_xc]);
		add_callback_for_result(res, callback);
	};



	this.visualization_query_version = function() {
		var res = Module.ccall('xmmsc_visualization_query_version', 'number', ['number'], [_xc]);
		return promise_from_result(res);
	};

	this.visualization_register = function() {
		var res = Module.ccall('xmmsc_visualization_register', 'number', ['number'], [_xc]);
		return promise_from_result(res);
	};

	this.visualization_init_shm = function(id, shm_id) {
		var res = Module.ccall('xmmsc_visualization_init_shm', 'number', ['number', 'number', 'string'], [_xc, id, shm_id]);
		return promise_from_result(res);
	};

	this.visualization_init_udp = function(id) {
		var res = Module.ccall('xmmsc_visualization_init_udp', 'number', ['number', 'number'], [_xc, id]);
		return promise_from_result(res);
	};

	this.visualization_set_property = function(id, key, value) {
		var res = Module.ccall('xmmsc_visualization_set_property', 'number', ['number', 'number', 'string', 'string'], [_xc, id, key, value]);
		return promise_from_result(res);
	};

	this.visualization_set_properties = function(id, properties) {
		properties = xmmsv_from_jsobj(properties);
		var res = Module.ccall('xmmsc_visualization_set_properties', 'number', ['number', 'number', 'number'], [_xc, id, properties]);
		_xmmsv_unref(properties);
		return promise_from_result(res);
	};

	this.visualization_shutdown = function(id) {
		var res = Module.ccall('xmmsc_visualization_shutdown', 'number', ['number', 'number'], [_xc, id]);
		return promise_from_result(res);
	};





	this.broadcast_mediainfo_reader_status = function(callback) {
		var res = Module.ccall('xmmsc_broadcast_mediainfo_reader_status', 'number', ['number'], [_xc]);
		add_callback_for_result(res, callback);
	};


	this.signal_mediainfo_reader_unindexed = function(callback) {
		var res = Module.ccall('xmmsc_signal_mediainfo_reader_unindexed', 'number', ['number'], [_xc]);
		add_callback_for_result(res, callback);
	};


	this.xform_browse = function(url) {
		var res = Module.ccall('xmmsc_xform_browse', 'number', ['number', 'string'], [_xc, url]);
		return promise_from_result(res);
	};




	this.bindata_retrieve = function(hash) {
		var res = Module.ccall('xmmsc_bindata_retrieve', 'number', ['number', 'string'], [_xc, hash]);
		return promise_from_result(res);
	};

	this.bindata_add = function(raw_data) {
		raw_data = xmmsv_from_jsobj(raw_data);
		var res = Module.ccall('xmmsc_bindata_add', 'number', ['number', 'number'], [_xc, raw_data]);
		_xmmsv_unref(raw_data);
		return promise_from_result(res);
	};

	this.bindata_remove = function(hash) {
		var res = Module.ccall('xmmsc_bindata_remove', 'number', ['number', 'string'], [_xc, hash]);
		return promise_from_result(res);
	};

	this.bindata_list = function() {
		var res = Module.ccall('xmmsc_bindata_list', 'number', ['number'], [_xc]);
		return promise_from_result(res);
	};




	this.coll_sync = function() {
		var res = Module.ccall('xmmsc_coll_sync', 'number', ['number'], [_xc]);
		return promise_from_result(res);
	};




	this.courier_send_message = function(dest, reply_policy, payload) {
		payload = xmmsv_from_jsobj(payload);
		var res = Module.ccall('xmmsc_courier_send_message', 'number', ['number', 'number', 'number', 'number'], [_xc, dest, reply_policy, payload]);
		_xmmsv_unref(payload);
		return promise_from_result(res);
	};

	this.courier_reply = function(msgid, reply_policy, payload) {
		payload = xmmsv_from_jsobj(payload);
		var res = Module.ccall('xmmsc_courier_reply', 'number', ['number', 'number', 'number', 'number'], [_xc, msgid, reply_policy, payload]);
		_xmmsv_unref(payload);
		return promise_from_result(res);
	};

	this.courier_get_connected_clients = function() {
		var res = Module.ccall('xmmsc_courier_get_connected_clients', 'number', ['number'], [_xc]);
		return promise_from_result(res);
	};


	this.broadcast_courier_message = function(callback) {
		var res = Module.ccall('xmmsc_broadcast_courier_message', 'number', ['number'], [_xc]);
		add_callback_for_result(res, callback);
	};




	this.broadcast_ipc_manager_client_connected = function(callback) {
		var res = Module.ccall('xmmsc_broadcast_ipc_manager_client_connected', 'number', ['number'], [_xc]);
		add_callback_for_result(res, callback);
	};

	this.broadcast_ipc_manager_client_disconnected = function(callback) {
		var res = Module.ccall('xmmsc_broadcast_ipc_manager_client_disconnected', 'number', ['number'], [_xc]);
		add_callback_for_result(res, callback);
	};


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
}
xmmsclient.XMMS2 = XMMS2
