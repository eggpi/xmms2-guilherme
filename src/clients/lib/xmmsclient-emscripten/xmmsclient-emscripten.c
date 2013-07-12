/*  XMMS2 - X Music Multiplexer System
 *  Copyright (C) 2003-2013 XMMS2 Team
 *
 *  PLUGINS ARE NOT CONSIDERED TO BE DERIVED WORK !!!
 *
 *  This library is free software; you can redistribute it and/or
 *  modify it under the terms of the GNU Lesser General Public
 *  License as published by the Free Software Foundation; either
 *  version 2.1 of the License, or (at your option) any later version.
 *
 *  This library is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  Lesser General Public License for more details.
 */

#include "emscripten.h"

#include <assert.h>
#include <sys/types.h>
#include <sys/select.h>

#include <xmmsclient/xmmsclient.h>
#include <xmmsclient/xmmsclient-emscripten.h>

static int mainloop_set = 0;
static void xmmsc_mainloop_emscripten_loop (void *arg);
static int xmmsc_emscripten_result_cb (xmmsv_t *val, void *user_data);
/* static */ void xmmsc_result_emscripten_notifier_set (xmmsc_result_t *res, void *user_data);

void
xmmsc_mainloop_emscripten_init (xmmsc_connection_t *c)
{
	xmmsc_mainloop_emscripten_deinit ();
	emscripten_set_main_loop_arg (xmmsc_mainloop_emscripten_loop, c, 30, false);
	mainloop_set = 1;
}

void
xmmsc_mainloop_emscripten_deinit (void)
{
	if (mainloop_set) {
		emscripten_cancel_main_loop ();
		mainloop_set = 0;
	}
}

static void
xmmsc_mainloop_emscripten_loop (void *arg)
{
	xmmsc_connection_t *connection = (xmmsc_connection_t *) arg;
	fd_set rfdset, wfdset;
	int fd = xmmsc_io_fd_get (connection);
	struct timeval tmout = {0}; // emscripten ignores timeouts

	FD_ZERO (&rfdset);
	FD_SET (fd, &rfdset);

	FD_ZERO (&wfdset);
	if (xmmsc_io_want_out (connection)) {
		FD_SET (fd, &wfdset);
	}

	if (select (fd + 1, &rfdset, &wfdset, NULL, &tmout) == SOCKET_ERROR) {
		return;
	}

	if (FD_ISSET (fd, &rfdset)) {
		xmmsc_io_in_handle (connection);
	}

	if (FD_ISSET (fd, &wfdset)) {
		xmmsc_io_out_handle (connection);
	}

	return;
}

static int
xmmsc_emscripten_result_cb (xmmsv_t *val, void *user_data)
{
	return EM_ASM_INT({
		return xmmsc_emscripten_js_callback($0, $1);
	}, val, user_data);
}

/* static */ void
xmmsc_result_emscripten_notifier_set (xmmsc_result_t *res, void *user_data)
{
	xmmsc_result_notifier_set (res, xmmsc_emscripten_result_cb, user_data);
	xmmsc_result_unref (res);
}
