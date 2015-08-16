var VIEW_COLUMNS = ["artist", "title", "album"];

function make_promise(fn) {
  return function() {
    var args = Array.prototype.slice.call(arguments);
    return new Promise(function(resolver) {
      args = Array.prototype.concat([resolver], args);
      fn.apply(null, args);
    });
  };
}

function flatten_propdict(propdict) {
  var ret = {};

  for (var prop in propdict) {
    for (var source in propdict[prop]) {
      ret[prop] = propdict[prop][source];
      break;
    }
  }

  return ret;
}

function _init_playlist(resolver, reconnect) {
  if (!reconnect) {
    var playlist_element = document.getElementById("playlist");
    playlist_view = new TrackListView(playlist_element,
                                      VIEW_COLUMNS,
                                      on_playlist_view_entry_click,
                                      on_playlist_view_entry_move,
                                      on_playlist_view_entry_remove);
  }

  playlist = new Playlist(xc, playlist_view);
  playlist.reload().then(on_playlist_reload).then(resolver.resolve).catch(
    function(errmsg) {
      if (errmsg == "no current entry") {
        resolver.resolve();
      } else {
        console.error(errmsg);
      }
    });

  xc.broadcast_playlist_changed(on_playlist_changed);
  xc.broadcast_playlist_loaded(playlist.reload);
  xc.broadcast_playlist_current_pos(on_playlist_current_pos);
}
init_playlist = make_promise(_init_playlist);

function _init_control_buttons(resolver, reconnect) {
  if (reconnect) {
    resolver.resolve();
    return;
  }

  var controls = document.getElementById("controls");
  controls.addEventListener("click", function(event) {
    var nodeName = event.target.nodeName;
    if (nodeName !== "BUTTON" && nodeName != "INPUT") {
      controls.classList.toggle("expanded");
    }
  });

  var play = document.getElementById("play-button");
  play.addEventListener("click", function() {
    xc.playback_start();
  });

  var pause = document.getElementById("pause-button");
  pause.addEventListener("click", function() {
    xc.playback_pause();
  });

  var stop = document.getElementById("stop-button");
  stop.addEventListener("click", function() {
    xc.playback_stop();
  });

  var next = document.getElementById("next-button");
  next.addEventListener("click", function() {
    xc.playlist_set_next(playlist.pos + 1).then(xc.playback_tickle);
  });

  var prev = document.getElementById("prev-button");
  prev.addEventListener("click", function() {
    xc.playlist_set_next(playlist.pos - 1).then(xc.playback_tickle);
  });

  var seek = document.getElementById("seek-slider");
  seek.addEventListener("change", function() {
    xc.playback_seek_ms(this.value, xc.XMMS_PLAYBACK_SEEK_SET);
  });

  seek.addEventListener("mousedown", function() {
    this.dragging = true;
  });

  seek.addEventListener("mouseup", function() {
    this.dragging = false;
  });

  var clear = document.getElementById("clear-playlist-button");
  clear.addEventListener("click", function() {
     xc.playlist_clear();
  });

  resolver.resolve();
}
init_control_buttons = make_promise(_init_control_buttons);

function _init_volume_slider(resolver, reconnect) {
  var volume = document.getElementById("volume-slider");
  xc.playback_volume_get().then(function(voldict) {
    for (var channel in voldict); // pick first channel
    volume.channel = channel;
    volume.value = voldict[channel];
    xc.broadcast_playback_volume_changed(on_volume_changed);

    if (!reconnect) {
      volume.addEventListener("change", function() {
        xc.playback_volume_set(this.channel, this.value);
      });
    }

    resolver.resolve();
  }).catch(function() {
    // FIXME this fails with icecast for some reason
    resolver.resolve();
  });
}
init_volume_slider = make_promise(_init_volume_slider);

function _init_current_id(resolver, reconnect) {
  xc.broadcast_playback_current_id(on_current_id);
  xc.playback_current_id().then(on_current_id).then(resolver.resolve);
}
init_current_id = make_promise(_init_current_id);

function _init_playback_status(resolver, reconnect) {
  xc.broadcast_playback_status(on_playback_status);
  xc.playback_status().then(on_playback_status).then(resolver.resolve);
}
init_playback_status = make_promise(_init_playback_status);

function _init_search(resolver, reconnect) {
  if (reconnect) {
    resolver.resolve();
    return;
  }

  function search_result_on_click(i, colname) {
    if (colname === "album") {
      var form = document.getElementById("search-form");
      var input = document.getElementById("search-input");
      var button = document.getElementById("search-button");

      var album = search_view.infos[i]["album"];
      var query = "album:'" + album.replace("'", "\\'") + "'";
      input.value = query;
      button.click();
    } else {
      var id = search_view.infos[i]["id"];
      var pos = playlist.playlist.length;
      xc.playlist_insert_id(null, pos, id).then(
          xc.playback_status).then(
            function(status) {
              if (status === xmmsclient.XMMS_PLAYBACK_STATUS_STOP) {
                on_playlist_view_entry_click(pos);
              }
            });
    }
  }

  var search_results_element = document.getElementById("search-results");
  search_view = new TrackListView(search_results_element,
                                  VIEW_COLUMNS,
                                  search_result_on_click);
  search_view.readonly = true;

  var form = document.getElementById("search-form");
  form.addEventListener("submit", function(event) {
    event.preventDefault();

    var input = document.getElementById("search-input");
    var coll = xmmsclient.collections.coll_parse(input.value);
    if (!coll) {
      search_view.coll = null;
      return;
    }

    coll.order(["artist", "album", "tracknr"]);

    var infos = VIEW_COLUMNS.concat("id");
    xc.collection_query_infos(coll, [], 0, 0, infos, []).then(
      function(infos) {
        search_view.clear();
        // FIXME find a better place for this as well
        search_view.infos = infos;
        search_view.coll = coll;
        for (var i = 0; i < infos.length; i++) {
          search_view.append(infos[i]);
        }
      }
    ).catch(function() {
      search_view.coll = null;
    });
  });

  var enqueue = document.getElementById("enqueue-search");
  enqueue.addEventListener("click", function() {
    if (search_view.coll) {
      xc.playlist_add_collection(null, search_view.coll);
    }
  });

  resolver.resolve();
}
init_search = make_promise(_init_search);

function play_audio() {
  // change src to bypass caching
  var p = Math.floor(Math.random() * 10000);
  speaker.src = "http://" + window.location.hostname + ":9091/stream.ogg?" + p;
  speaker.play();
}

function _init_audio(resolver, reconnect) {
  // TODO Integrate with volume!
  play_audio();
  resolver.resolve();
}
init_audio = make_promise(_init_audio);

function _init_panels(resolver, reconnect) {
  if (!reconnect) {
    var deck = document.getElementById("cards");
    Hammer(deck).on("swipeleft", function() {
      deck.nextCard();
    }).on("swiperight", function() {
      deck.previousCard();
    });
  }

  resolver.resolve();
}
init_panels = make_promise(_init_panels);

function on_connect(reconnect) {
  Promise.every(
    init_playlist(reconnect),
    init_control_buttons(reconnect),
    init_volume_slider(reconnect),
    init_current_id(reconnect),
    init_playback_status(reconnect),
    init_search(reconnect),
    init_audio(reconnect),
    init_panels(reconnect)
  ).then(function() {
    var client = document.getElementById("client");
    client.classList.add("connected");
    var connect = document.getElementById("connect");
    connect.classList.add("connected");
  });
}

function on_current_id(id) {
  var slider = document.getElementById("seek-slider");

  xc.medialib_get_info(id).then(function(info) {
    info = flatten_propdict(info);

    slider.value = 0;
    slider.min = 0;
    slider.max = info["duration"];
  });
  return true;
};

function on_playback_status(status) {
  if (status == xmmsclient.XMMS_PLAYBACK_STATUS_PLAY) {
    var interval_id = setInterval(function() {
      xc.playback_playtime().then(on_playtime);
    }, 1000);

    play_audio();
    on_playtime.interval_id = interval_id;
  } else {
    clearInterval(on_playtime.interval_id);
    delete on_playtime.interval_id;

    if (status == xmmsclient.XMMS_PLAYBACK_STATUS_STOP) {
      var slider = document.getElementById("seek-slider");
      slider.value = 0;
    }
  }

  return true;
}

function on_playlist_view_entry_click(pos) {
  xc.playlist_set_next(pos).then(xc.playback_start).then(xc.playback_tickle);
}

function on_playlist_view_entry_move(from, to) {
  xc.playlist_move_entry(null, from, to);
}

function on_playlist_view_entry_remove(pos) {
  xc.playlist_remove_entry(null, pos);
}

function on_playtime(time) {
  var slider = document.getElementById("seek-slider");

  if (!slider.dragging) {
    slider.value = time;
  }
}

function on_playlist_reload() {
  return xc.playlist_current_pos().then(on_playlist_current_pos);
}

function on_playlist_current_pos(dict) {
  var pos = dict["position"];
  playlist.set_current_pos(pos);
  return true;
}

function on_playlist_changed(changes) {
  switch (changes["type"]) {
    case xmmsclient.XMMS_PLAYLIST_CHANGED_ADD:
      playlist.append(changes["id"]);
      break;
    case xmmsclient.XMMS_PLAYLIST_CHANGED_INSERT:
      playlist.insert_at(changes["position"], changes["id"]);
      break;
    case xmmsclient.XMMS_PLAYLIST_CHANGED_MOVE:
      playlist.move(changes["position"], changes["newposition"]);
      break;
    case xmmsclient.XMMS_PLAYLIST_CHANGED_REMOVE:
      playlist.remove_at(changes["position"]);
      break;
    case xmmsclient.XMMS_PLAYLIST_CHANGED_REPLACE:
      playlist.reload().then(on_playlist_reload);
      break;
  }

  return true;
}

function on_volume_changed(voldict) {
  var volume = document.getElementById("volume-slider");
  volume.value = voldict[volume.channel];

  return true;
}

var xc = null;
var playlist = null;
var playlist_view = null;
var search_view = null;

function connect(xmms_path, reconnect) {
  xc = new xmmsclient.XMMS2('emscripten-test');
  return xc.connect(xmms_path).then(function() {
    on_connect(reconnect);
  });
}

function keep_alive(xmms_path) {
  setInterval(function() {
    if (!document.hasFocus()) {
      // Skip connection check. The browser will likely throttle the emscripten
      // event loop when unfocused, so we'd never get an answer anyway.
      return;
    }

    var keepAliveTimeoutId = setTimeout(function() {
      var disconnected_banner = document.getElementById('disconnected-banner');
      disconnected_banner.classList.remove('hidden');

      xc.disconnect();
      connect(xmms_path, true).then(function() {
        disconnected_banner.classList.add('hidden')
      });
    }, 1000);

    xc.playback_current_id().then(function() {
      var disconnected_banner =
        document.getElementById('disconnected-banner');
      disconnected_banner.classList.add('hidden');
      clearTimeout(keepAliveTimeoutId);
    });
  }, 2000);
}

function main(xmms_path) {
  connect(xmms_path, false);
  keep_alive(xmms_path);
};
