function Playlist(xc, view) {
  var self = this;
  var waiting_for_info = false;
  this.playlist = [];
  this.pos = -1;

  this.reload = function playlist_reload() {
    this.playlist = [];
    view.clear();
    return xc.playlist_list_entries().then(function(playlist) {
          if (!playlist.length) {
            return;
          }

          var append_promises = playlist.map(function(id) {
            return self.append(id);
          });

          return Promise.every.apply(null, append_promises);
        });
  }

  this.append = function playlist_append(id) {
    return this.insert_at(self.playlist.length, id);
  }

  this.insert_at = function playlist_insert_at(position, id) {
    // insert a dummy object to keep positions consistent while
    // we wait for a reply from the server
    var dummy = {}, idx;
    this.playlist.splice(position, 0, dummy);
    waiting_for_info = true;

    return xc.medialib_get_info(id).then(function(info) {
      // find the dummy object and replace it with
      // the flattened propdict
      idx = self.playlist.indexOf(dummy);
      if (idx == -1) {
        console.error("Couldn't find dummy playlist entry?!");
        return;
      }

      self.playlist.splice(idx, 1, flatten_propdict(info));
    }).then(function() {
      waiting_for_info = false;
      view.insert_at(idx, self.playlist[idx]);
      view.set_current_pos(self.pos);
    });
  }

  this.remove_at = function playlist_remove_at(position) {
    self.playlist.splice(position, 1);
    view.remove_at(position);
  }

  this.move = function playlist_move(position, newposition) {
    var entry = this.playlist[position];

    this.remove_at(position);
    this.playlist.splice(newposition, 0, entry);
    view.insert_at(newposition, this.playlist[newposition]);
  }

  this.set_current_pos = function playlist_set_current_pos(position) {
    this.pos = position;
    if (!waiting_for_info) {
      // don't notify the view until the playlist stabilizes
      view.set_current_pos(this.pos);
    }
  }
}
