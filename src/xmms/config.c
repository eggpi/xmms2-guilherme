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

#include <stdlib.h>
#include <unistd.h>
#include <stdio.h>
#include <string.h>
#include <fcntl.h>
#include <sys/types.h>
#include <sys/stat.h>

#include "xmms/config.h"
#include "xmms/util.h"
#include "xmms/xmms.h"
#include "xmms/object.h"
#include "xmms/signal_xmms.h"
#include "xmms/plugin.h"
#include "xmms/dbus.h"


struct xmms_config_St {
	xmms_object_t obj;
	const gchar *url;

	GHashTable *values;
	GList *plugins;

	GMutex *mutex;

	/* parsing */
	gint state;
	gint prevstate;
	gchar *where[3];
};

struct xmms_config_value_St {
	xmms_object_t obj;

	const gchar *name;
	gchar *data;
	
};

enum xmms_config_states {
	XMMS_CONFIG_STATE_START,
	XMMS_CONFIG_STATE_SECTION,
	XMMS_CONFIG_STATE_PLUGIN,
	XMMS_CONFIG_STATE_VALUE,
};

/*
 * Global config
 */

xmms_config_t *global_config;

/*
 * Config functions
 */

static void 
xmms_config_parse_start (GMarkupParseContext *ctx,
		    	 const gchar *name,
		    	 const gchar **attr_name,
		    	 const gchar **attr_data,
		    	 gpointer userdata,
		    	 GError **error)
{
	xmms_config_t *st = userdata;

	if (g_strcasecmp (name, "section") == 0) {
		st->state = XMMS_CONFIG_STATE_SECTION;
		st->where[0] = g_strdup (attr_data[0]);
	} else if (g_strcasecmp (name, "plugin") == 0) {
		if (st->state == XMMS_CONFIG_STATE_SECTION) {
			st->prevstate = st->state;
			st->state = XMMS_CONFIG_STATE_PLUGIN;
			st->where[1] = g_strdup (attr_data[0]);
		} else {
			xmms_log_fatal ("Config file is a mess");
		}
	} else if (g_strcasecmp (name, "value") == 0) {
		if (st->state == XMMS_CONFIG_STATE_SECTION) {
			st->prevstate = st->state;
			st->state = XMMS_CONFIG_STATE_VALUE;
			st->where[1] = g_strdup (attr_data[0]);
		} else if (st->state == XMMS_CONFIG_STATE_PLUGIN) {
			st->prevstate = st->state;
			st->state = XMMS_CONFIG_STATE_VALUE;
			st->where[2] = g_strdup (attr_data[0]);
		} else {
			xmms_log_fatal ("Config file is a mess");
		}
	} 

}

void 
xmms_config_parse_end (GMarkupParseContext *ctx,
		  	const gchar *name,
		  	gpointer userdata,
		  	GError **err)
{
	xmms_config_t *st = userdata;

	switch (st->state) {
		case XMMS_CONFIG_STATE_SECTION:
			g_free (st->where[0]);
			st->where[0] = NULL;
			st->state = XMMS_CONFIG_STATE_START;
			break;
		case XMMS_CONFIG_STATE_PLUGIN:
			g_free (st->where[1]);
			st->where[1] = NULL;
			st->state = XMMS_CONFIG_STATE_SECTION;
			break;
		case XMMS_CONFIG_STATE_VALUE:
			if (st->prevstate == XMMS_CONFIG_STATE_SECTION) {
				g_free (st->where[1]);
				st->where[1] = NULL;
				st->state = XMMS_CONFIG_STATE_SECTION;
			} else {
				g_free (st->where[2]);
				st->where[2] = NULL;
				st->state = XMMS_CONFIG_STATE_PLUGIN;
			}
			break;
	}

}

static void
add_value (gchar *key, gchar *value)
{
	xmms_config_value_t *val;

	val = xmms_config_value_new (key);
	xmms_config_value_data_set (val, value);

	g_hash_table_insert (global_config->values, key, val);
}

static void
xmms_config_parse_text (GMarkupParseContext *ctx,
      			const gchar *text,
      			gsize text_len,
      			gpointer userdata,
      			GError **err)
{
	xmms_config_t *st = userdata;
	gchar *str;

	if (st->state != XMMS_CONFIG_STATE_VALUE)
		return;

	if (st->prevstate == XMMS_CONFIG_STATE_SECTION) {
		str = g_strdup_printf ("%s.%s", st->where[0], st->where[1]);
	} else 
		str = g_strdup_printf ("%s.%s.%s", st->where[0], 
						   st->where[1], 
						   st->where[2]);

	add_value (str, g_strdup (text));
}

void
xmms_config_setvalue (xmms_config_t *conf, gchar *key, gchar *value)
{
	xmms_config_value_t *val;

	val = xmms_config_lookup (key);
	if (val)
		xmms_config_value_data_set (val, g_strdup (value));

}

XMMS_METHOD_DEFINE (setvalue, xmms_config_setvalue, xmms_config_t *, NONE, STRING, STRING);



gboolean
xmms_config_init (const gchar *filename)
{
	GMarkupParser pars;
	GMarkupParseContext *ctx;
	xmms_config_t *config;
	int ret, fd;

	g_return_val_if_fail (filename, FALSE);

	config = g_new0 (xmms_config_t, 1);
	xmms_object_init (XMMS_OBJECT (config));
	config->mutex = g_mutex_new ();
	config->values = g_hash_table_new (g_str_hash, g_str_equal);
	config->url = g_strdup (filename);
	config->state = XMMS_CONFIG_STATE_START;
	global_config = config;

	memset (&pars, 0, sizeof (pars));

	pars.start_element = xmms_config_parse_start;
	pars.end_element = xmms_config_parse_end;
	pars.text = xmms_config_parse_text;

	ctx = g_markup_parse_context_new (&pars, 0, config, NULL);

	fd = open (filename, O_RDONLY);

	if (fd == -1) return FALSE;

	while (42) {
		gchar buffer[1024];
		ret = read (fd, buffer, 1024);

		if (ret == 0) 
			break;

		g_markup_parse_context_parse (ctx, buffer, ret, NULL);
	}


	xmms_object_method_add (XMMS_OBJECT (config), "setvalue", XMMS_METHOD_FUNC (setvalue));
	xmms_dbus_register_object ("config", XMMS_OBJECT (config));

	return TRUE;
}

void
xmms_config_free (void)
{
	g_return_if_fail (global_config);
}

xmms_config_value_t *
xmms_config_lookup (const gchar *path)
{
	xmms_config_value_t *value;
	g_return_val_if_fail (global_config, NULL);
	
	XMMS_DBG ("Looking up %s", path);
	
	g_mutex_lock (global_config->mutex);
	value = g_hash_table_lookup (global_config->values, path);
	g_mutex_unlock (global_config->mutex);


	return value;
}

static void
add_to_list_foreach (gpointer key, gpointer value, gpointer udata)
{
	*(GList**)udata = g_list_append (*(GList**)udata, (gchar*) key);
}

static int
common_chars (gchar *n1, gchar *n2)
{
	gint i, j = 0;
	gchar **tmp = g_strsplit (n1, ".", 0);

	while (tmp[j])
		j++;
	
	for (i = 0; i < strlen (n1); i++) {
		if (n1[i] == '.') {
			if (j == 0)
				return i;
			else
				j--;
		}

		if (n1[i] != n2[i])
			return i;
	}

	return 0;
}

gboolean
xmms_config_save (const gchar *file)
{
	GList *list = NULL;
	GList *n;
	gchar *last = NULL;
	guint lastn = 0;
	FILE *fp = NULL;

	g_return_val_if_fail (global_config, FALSE);

	g_hash_table_foreach (global_config->values, add_to_list_foreach, &list);

	list = g_list_sort (list, (GCompareFunc) g_strcasecmp);

	if (!(fp = fopen (file, "wb+"))) {
		XMMS_DBG ("Couldn't open %s for writing.", file);
		return FALSE;
	}

	fprintf (fp, "<xmms>\n");

	for (n = list; n; n = g_list_next (n)) {
		gint nume = 0;
		gchar *line = (gchar *)n->data;
		gchar **tmp = g_strsplit ((gchar *)n->data, ".", 0);

//		printf ("%s\n", line);

		while (tmp[nume])
			nume ++;
		
		if (!last) {
			gchar *data;
			data = xmms_config_value_string_get (xmms_config_lookup (line));
			
			fprintf (fp, "\t<section name=\"%s\">\n", tmp[0]);
			if (nume == 3) {
				fprintf (fp, "\t\t<plugin name=\"%s\">\n", tmp[1]);
				fprintf (fp, "\t\t\t<value name=\"%s\">%s", tmp[2] ? tmp[2] : tmp[1], data);
			} else {
				fprintf (fp, "\t\t\t<value name=\"%s\">%s", tmp[2] ? tmp[2] : tmp[1], data);
			}
		} else {
			gchar **tmpv;
			gchar *data;
			gint nume2 = 0;
			gint c = common_chars (last, line);
			tmpv = g_strsplit (line+c, ".", 0);
			
			while (tmpv[nume2])
				nume2 ++;

			fprintf (fp, "</value>\n");
			if (nume == 3 && lastn == 3 && nume2 >= 2) {
				/* closing a plugin */
				fprintf (fp, "\t\t</plugin>\n");
			} 

			if (nume == nume2)
				fprintf (fp, "\t</section>\n");

			if (nume == nume2)
				fprintf (fp, "\t<section name=\"%s\">\n", tmp[0]);

			if (nume == 3 && nume2 > 1) {
				fprintf (fp, "\t\t<plugin name=\"%s\">\n", tmp[1]);
			}

			data = xmms_config_value_string_get (xmms_config_lookup (line));
			
			fprintf (fp, "\t\t\t<value name=\"%s\">%s", tmp[2] ? tmp[2] : tmp[1], data);


//			printf ("%d %d\n", nume2, nume);

		}

		last = (gchar *)n->data;
		lastn = nume;

		if (!g_list_next (n)) {
			if (nume == 3) {
				fprintf (fp, "</value>\n\t\t</plugin>\n\t</section>\n");
			} else if (nume == 2)
				fprintf (fp, "</value>\n\t</section>\n");
		}
	}

	fprintf (fp, "</xmms>\n");

	fclose (fp);

	return TRUE;
}

GList *
xmms_config_plugins_get (void)
{
	GList *plugins;
	g_return_val_if_fail (global_config, NULL);

	g_mutex_lock (global_config->mutex);
	plugins = global_config->plugins;
	g_mutex_unlock (global_config->mutex);

	return plugins;
}

/*
 * Value manipulation 
 */

xmms_config_value_t *
xmms_config_value_new (const gchar *name)
{
	xmms_config_value_t *ret;

	ret = g_new0 (xmms_config_value_t, 1);
	ret->name = name;

	XMMS_DBG ("adding config value %s", name);
	xmms_object_init (XMMS_OBJECT (ret));

	return ret;
}

const gchar *
xmms_config_value_name_get (const xmms_config_value_t *value)
{
	g_return_val_if_fail (value, NULL);

	return value->name;
}

void
xmms_config_value_free (xmms_config_value_t *value)
{
	g_return_if_fail (value);
	g_free (value);
}

void
xmms_config_value_data_set (xmms_config_value_t *val, gchar *data)
{
	g_return_if_fail (val);
	g_return_if_fail (data);

	XMMS_DBG ("setting %s to %s", val->name, data);

	val->data = data;
	xmms_object_emit (XMMS_OBJECT (val), XMMS_SIGNAL_CONFIG_VALUE_CHANGE,
			  (gpointer) data);
}

const gchar *
xmms_config_value_string_get (const xmms_config_value_t *val)
{
	g_return_val_if_fail (val, NULL);
	return val->data;
}

gint
xmms_config_value_int_get (const xmms_config_value_t *val)
{
	g_return_val_if_fail (val, 0);
	if (val->data)
		return atoi (val->data);

	return 0;
}

gfloat
xmms_config_value_float_get (const xmms_config_value_t *val)
{
	g_return_val_if_fail (val, 0.0);
	if (val->data)
		return atof (val->data);

	return 0.0;
}

void
xmms_config_value_callback_set (xmms_config_value_t *val,
				xmms_object_handler_t cb,
				gpointer userdata)
{
	g_return_if_fail (val);

	if (!cb)
		return;

	xmms_object_connect (XMMS_OBJECT (val), 
			     XMMS_SIGNAL_CONFIG_VALUE_CHANGE, 
			     (xmms_object_handler_t) cb, userdata);
}

xmms_config_value_t *
xmms_config_value_register (const gchar *path, 
			    const gchar *default_value,
			    xmms_object_handler_t cb,
			    gpointer userdata)
{

	xmms_config_value_t *val;

	XMMS_DBG ("Registering: %s", path);

	g_mutex_lock (global_config->mutex);

	val = g_hash_table_lookup (global_config->values, path);
	if (!val) {
		gchar *name = strrchr (path, '.');

		if (!name) 
			val = xmms_config_value_new (path);
		else
			val = xmms_config_value_new (name+1);

		xmms_config_value_data_set (val, g_strdup (default_value));
	}

	if (cb) 
		xmms_config_value_callback_set (val, cb, userdata);

	g_hash_table_insert (global_config->values, g_strdup (path), val);

	g_mutex_unlock (global_config->mutex);

	return val;
}
