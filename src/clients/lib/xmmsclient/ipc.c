/*  XMMS2 - X Music Multiplexer System
 *  Copyright (C) 2003	Peter Alm, Tobias Rundstr�m, Anders Gustafsson
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

#include <glib.h>

#include <sys/types.h>
#include <sys/select.h>

#include "xmms/util.h"
#include "xmms/ringbuf.h"
#include "xmms/signal_xmms.h"
#include "xmms/xmmsclient.h"

#include "xmms/ipc.h"
#include "xmms/ipc_transport.h"
#include "xmms/ipc_msg.h"

#include "internal/client_ipc.h"

struct xmmsc_ipc_St {
	xmms_ringbuf_t *read_buffer;
	xmms_ipc_transport_t *transport;
	gchar *error;
	gpointer private_data;
	gboolean disconnect;
	gint pollopts;
	GHashTable *results_table;
	void *lockdata;
	void (*lockfunc)(void *lock);
	void (*unlockfunc)(void *lock);
	void (*disconnect_callback) (void *ipc);
	void *disconnect_data;
};

static inline void xmmsc_ipc_lock (xmmsc_ipc_t *ipc);
static inline void xmmsc_ipc_unlock (xmmsc_ipc_t *ipc);

xmmsc_ipc_t *
xmmsc_ipc_init (void)
{
	xmmsc_ipc_t *ipc;
	ipc = g_new0 (xmmsc_ipc_t, 1);
	ipc->read_buffer = xmms_ringbuf_new_unlocked (XMMS_IPC_MSG_MAX_SIZE);
	ipc->disconnect = FALSE;
	ipc->pollopts = XMMSC_IPC_IO_IN;
	ipc->results_table = g_hash_table_new (NULL, NULL);

	return ipc;
}

void
xmmsc_ipc_disconnect_set (xmmsc_ipc_t *ipc, void (*disconnect_callback) (void *), void *userdata)
{
	x_return_if_fail (ipc);
	ipc->disconnect_callback = disconnect_callback;
	ipc->disconnect_data = userdata;
}

void
xmmsc_ipc_lock_set (xmmsc_ipc_t *ipc, void *lock, void (*lockfunc)(void *), void (*unlockfunc)(void *))
{
	ipc->lockdata = lock;
	ipc->lockfunc = lockfunc;
	ipc->unlockfunc = unlockfunc;
}

void
xmmsc_ipc_result_register (xmmsc_ipc_t *ipc, xmmsc_result_t *res)
{
	g_return_if_fail (ipc);
	g_return_if_fail (res);

	xmmsc_ipc_lock (ipc);
	g_hash_table_insert (ipc->results_table, GUINT_TO_POINTER (xmmsc_result_cid (res)), res);
	xmmsc_ipc_unlock (ipc);
}

xmmsc_result_t *
xmmsc_ipc_result_lookup (xmmsc_ipc_t *ipc, guint cid)
{
	xmmsc_result_t *res;
	g_return_val_if_fail (ipc, NULL);

	xmmsc_ipc_lock (ipc);
	res = g_hash_table_lookup (ipc->results_table, GUINT_TO_POINTER (cid));
	xmmsc_ipc_unlock (ipc);
	return res;
}

void
xmmsc_ipc_result_unregister (xmmsc_ipc_t *ipc, xmmsc_result_t *res)
{
	g_return_if_fail (ipc);
	g_return_if_fail (res);

	xmmsc_ipc_lock (ipc);
	g_hash_table_remove (ipc->results_table, GUINT_TO_POINTER (xmmsc_result_cid (res)));
	xmmsc_ipc_unlock (ipc);
}
	
static void
xmmsc_ipc_exec_msg (xmmsc_ipc_t *ipc, xmms_ipc_msg_t *msg)
{
	xmmsc_result_t *res;

	res = xmmsc_ipc_result_lookup (ipc, msg->cid);

	if (msg->cmd == XMMS_IPC_CMD_ERROR) {
		gchar *errstr;
		gint len;

		if (!xmms_ipc_msg_get_string_alloc (msg, &errstr, &len))
			errstr = g_strdup ("No errormsg!");

		xmmsc_result_seterror (res, errstr);
	}
		
	if (res) {
		xmmsc_result_run (res, msg);
	} else {
		xmms_ipc_msg_destroy (msg);
	}
}

gboolean
xmmsc_ipc_io_in_callback (xmmsc_ipc_t *ipc)
{
	gchar buffer[4096];
	xmms_ipc_msg_t *msg = NULL;
	gint ret;
	g_return_val_if_fail (ipc, FALSE);

	do {
		ret = xmms_ipc_transport_read (ipc->transport, buffer, 4096);
		if (ret == -1) {
			break;
		} else if (ret == 0) {
			xmmsc_ipc_disconnect (ipc);
			break;
		}
		xmmsc_ipc_lock (ipc);
		xmms_ringbuf_write (ipc->read_buffer, buffer, ret);
		xmmsc_ipc_unlock (ipc);
	} while (ret > 0);

#if HEAVY_DEBUG
	printf ("got %d bytes in ringbuffer!\n", xmms_ringbuf_bytes_used (ipc->read_buffer));
#endif

	xmmsc_ipc_lock (ipc);
	do {
		if (!xmms_ipc_msg_can_read (ipc->read_buffer)) {
			break;
		} else {
			msg = xmms_ipc_msg_read (ipc->read_buffer);
			if (!msg)
				continue;
			xmmsc_ipc_unlock (ipc);
#if HEAVY_DEBUG
			printf ("Read msg with command %d\n", msg->cmd);
#endif
			xmmsc_ipc_exec_msg (ipc, msg);
			xmmsc_ipc_lock (ipc);
		}
	} while (msg);
	xmmsc_ipc_unlock (ipc);

	return TRUE;
}

gint
xmmsc_ipc_fd_get (xmmsc_ipc_t *ipc)
{
	g_return_val_if_fail (ipc, -1);
	return xmms_ipc_transport_fd_get (ipc->transport);
}

void
xmmsc_ipc_error_set (xmmsc_ipc_t *ipc, gchar *error)
{
	g_return_if_fail (ipc);
	ipc->error = error;
}

void
xmmsc_ipc_wait_for_event (xmmsc_ipc_t *ipc, guint timeout)
{
	fd_set fdset;
	struct timeval tmout;

	g_return_if_fail (ipc);
	tmout.tv_sec = timeout;
	tmout.tv_usec = 0;

	FD_ZERO (&fdset);
	FD_SET (xmms_ipc_transport_fd_get (ipc->transport), &fdset);

#ifdef HEAVY_DEBUG
	fprintf (stderr, "Waiting for event!\n");
#endif
	if (select (xmms_ipc_transport_fd_get (ipc->transport) + 1, &fdset, 
		    NULL, NULL, &tmout) == -1) {
#ifdef HEAVY_DEBUG
		fprintf (stderr, "select returned -1\n");
#endif
		return;
	}

	xmmsc_ipc_io_in_callback (ipc);
}

gboolean
xmmsc_ipc_msg_write (xmmsc_ipc_t *ipc, xmms_ipc_msg_t *msg, guint32 cid)
{
	fd_set fdset;
	struct timeval tmout;

	g_return_val_if_fail (ipc, FALSE);
	g_return_val_if_fail (ipc, FALSE);

	tmout.tv_sec = 5;
	tmout.tv_usec = 0;

	FD_ZERO (&fdset);
	FD_SET (xmms_ipc_transport_fd_get (ipc->transport), &fdset);

	/* Block for 5 seconds ... */
	if (select (xmms_ipc_transport_fd_get (ipc->transport) +1, 
		    NULL, &fdset, NULL, &tmout) == -1) {
		return FALSE;
	}

	return xmms_ipc_msg_write_fd (xmms_ipc_transport_fd_get (ipc->transport), 
				      msg, cid);
}

void
xmmsc_ipc_disconnect (xmmsc_ipc_t *ipc)
{
	ipc->disconnect = TRUE;
	if (ipc->disconnect_callback) {
		ipc->disconnect_callback (ipc->disconnect_data);
	}
}

gpointer
xmmsc_ipc_private_data_get (xmmsc_ipc_t *ipc)
{
	g_return_val_if_fail (ipc, NULL);
	return ipc->private_data;
}

void
xmmsc_ipc_private_data_set (xmmsc_ipc_t *ipc, gpointer data)
{
	g_return_if_fail (ipc);
	ipc->private_data = data;
}

void
xmmsc_ipc_destroy (xmmsc_ipc_t *ipc)
{
	if (!ipc)
		return;

	xmms_ringbuf_destroy (ipc->read_buffer);
	g_hash_table_destroy (ipc->results_table);
	if (ipc->transport) {
		xmms_ipc_transport_destroy (ipc->transport);
	}
	if (ipc->error) {
		g_free (ipc->error);
	}
	g_free (ipc);
}

gboolean
xmmsc_ipc_connect (xmmsc_ipc_t *ipc, gchar *path) 
{
	g_return_val_if_fail (ipc, FALSE);
	g_return_val_if_fail (path, FALSE);

	ipc->transport = xmms_ipc_client_init (path);
	if (!ipc->transport) {
		ipc->error = "Could not init client!";
		return FALSE;
	}

	return TRUE;
}

static inline void
xmmsc_ipc_lock (xmmsc_ipc_t *ipc)
{
	if (ipc->lockdata)
		ipc->lockfunc (ipc->lockdata);
}

static inline void
xmmsc_ipc_unlock (xmmsc_ipc_t *ipc)
{
	if (ipc->lockdata)
		ipc->lockfunc (ipc->lockdata);
}
