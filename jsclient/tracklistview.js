function TrackListView(table, columns, on_click_entry, on_move_entry, on_remove_entry) {
  this.pos = -1;
  this.readonly = false;
  var self = this;

  function get_index_for_entry(entry) {
    for (var i = 0; i < table.childNodes.length; i++) {
      if (table.childNodes[i] === entry) {
        break;
      }
    }

    return i;
  }

  function get_column_name_for_click_target(td) {
    return td.className;
  }

  function list_entry_on_click(event) {
    this.style.opacity = 0;
    var handler = function() {
      this.style.opacity = 1;
      this.removeEventListener('transitionend', handler);
    }

    this.addEventListener('transitionend', handler);
    on_click_entry(get_index_for_entry(this),
                   get_column_name_for_click_target(event.target));
  }

  function list_entry_on_remove(event) {
    event.stopPropagation();
    this.parentNode.style.opacity = 0;

    var handler = function() {
      on_remove_entry(get_index_for_entry(this));
      this.parentNode.removeEventListener('transitionend', handler);
    };

    this.parentNode.addEventListener('transitionend', handler);
  }

  function list_entry_on_move_up(event) {
    event.stopPropagation();
    var pos = get_index_for_entry(this.parentNode);

    if (pos > 0) {
      on_move_entry(pos, pos - 1);
    }
  }

  function list_entry_on_move_down(event) {
    event.stopPropagation();
    var pos = get_index_for_entry(this.parentNode);

    if (pos < table.childNodes.length) {
      on_move_entry(pos, pos + 1);
    }
  }

  function list_entry_from_info(info) {
    var tr = document.createElement("tr");
    var hoverIndicator = document.createElement("td");
    hoverIndicator.classList.add("hoverIndicator");
    tr.appendChild(hoverIndicator);

    tr.addEventListener("mouseenter", function() {
      hoverIndicator.classList.add("hover");
    });

    tr.addEventListener("mouseleave", function() {
      hoverIndicator.classList.remove("hover");
    });

    if (!self.readonly) {
      buttons = [
        ["X", list_entry_on_remove],
        ["^", list_entry_on_move_up],
        ["V", list_entry_on_move_down]
      ];

      for (var i = 0; i < buttons.length; i++) {
        var b = document.createElement("td");
        b.innerHTML = buttons[i][0];
        b.classList.add("tracklistButton");
        b.addEventListener("click", buttons[i][1]);
        tr.appendChild(b);
      }
    }

    for (var i = 0; i < columns.length; i++) {
      var c = columns[i];
      var td = document.createElement("td");

      td.innerHTML = info[c];
      td.classList.add(c);
      tr.appendChild(td);
    }

    tr.classList.add("track");
    tr.style.transition = 'opacity 0.15s linear';
    tr.addEventListener("click", list_entry_on_click);
    return tr;
  }

  this.set_current_pos = function tracklistview_set_current_pos(pos) {
    var entries = table.childNodes;
    if (this.pos != -1 && this.pos < entries.length) {
      entries[this.pos].classList.remove("active");
    }

    if (pos != -1 && pos < entries.length) {
      entries[pos].classList.add("active");
    }

    this.pos = pos;
  }

  this.clear = function tracklistview_clear() {
    table.innerHTML = "";
  }

  this.append = function tracklistview_append(info) {
    this.insert_at(table.childElementCount, info);
  }

  this.insert_at = function tracklistview_insert_at(position, info) {
    var entry = list_entry_from_info(info);
    var after = table.childNodes[position];

    table.insertBefore(entry, after);
  }

  this.remove_at = function tracklistview_remove_at(position) {
    table.removeChild(table.childNodes[position]);
  }
}
