#include <xmmsclient/xmmsclient.h>
#include <xmmsclient/xmmsclient++/dict.h>
#include <xmmsclient/xmmsclient++/exceptions.h>
#include <boost/variant.hpp>
#include <string>
#include <list>
#include <iostream>

namespace Xmms
{
	Dict::Dict( xmmsc_result_t* res ) : result_( 0 )
	{
		if( xmmsc_result_iserror( res ) ) {
			throw result_error( xmmsc_result_get_error( res ) );
		}
		else if( xmmsc_result_get_type( res ) != XMMS_OBJECT_CMD_ARG_DICT &&
		         xmmsc_result_get_type( res ) != XMMS_OBJECT_CMD_ARG_PROPDICT) {
			throw not_dict_error( "Result is not a dict" );
		}
		result_ = res;
		xmmsc_result_ref( result_ );
	}

	Dict::Dict( const Dict& dict ) : result_( dict.result_ )
	{
		xmmsc_result_ref( result_ );
	}

	Dict& Dict::operator=( const Dict& dict )
	{
		if( result_ ) {
			xmmsc_result_unref( result_ );
		}
		result_ = dict.result_;
		xmmsc_result_ref( result_ );
		return *this;
	}

	Dict::~Dict()
	{
		xmmsc_result_unref( result_ );
	}

	Dict::Variant Dict::operator[]( const std::string& key ) const
	{
		Dict::Variant value;
		switch( xmmsc_result_get_dict_entry_type( result_, key.c_str() ) )
		{
			case XMMSC_RESULT_VALUE_TYPE_UINT32: {

				unsigned int temp = 0;
				if( !xmmsc_result_get_dict_entry_uint32( result_, 
				                                         key.c_str(), 
				                                         &temp ) ) {
					// FIXME: handle error
				}
				value = temp;
				break;

			}
			case XMMSC_RESULT_VALUE_TYPE_INT32: {

				int temp = 0;
				if( !xmmsc_result_get_dict_entry_int32( result_, 
				                                        key.c_str(), 
				                                        &temp ) ) {
					// FIXME: handle error
				}
				value = temp;
				break;

			}
			case XMMSC_RESULT_VALUE_TYPE_STRING: {

				char* temp = 0;
				if( !xmmsc_result_get_dict_entry_str( result_, 
				                                      key.c_str(), 
				                                      &temp ) ) {
					// FIXME: handle error
				}
				value = std::string( temp );
				break;

			}
			case XMMSC_RESULT_VALUE_TYPE_NONE: {
				throw no_such_key_error( "No such key: " + key );
			}
			default: {
				// should never happen?
			}

		}

		return value;

	}

	static void
	getValue( Dict::Variant& val, xmmsc_result_value_type_t type,
	          const void* value )
	{
		switch( type ) {
			
			case XMMSC_RESULT_VALUE_TYPE_UINT32: {

				val = reinterpret_cast< unsigned int >( value );
				break;

			}
			case XMMSC_RESULT_VALUE_TYPE_INT32: {

				val = reinterpret_cast< int >( value );
				break;

			}
			case XMMSC_RESULT_VALUE_TYPE_STRING: {

				std::string temp( static_cast< const char* >( value ) );
				val = temp;
				break;

			}
			case XMMSC_RESULT_VALUE_TYPE_NONE: {
				break;
			}
			default: {
			}

		}
	}

	static void
	dict_foreach( const void* key, xmmsc_result_value_type_t type,
	              const void* value, void* userdata )
	{
		Xmms::Dict::ForEachFunc* func =
			static_cast< Xmms::Dict::ForEachFunc* >( userdata );
		Xmms::Dict::Variant val;
		std::string keystring( static_cast< const char* >( key ) );
		getValue( val, type, value );
		(*func)( keystring, val );

	}

	void Dict::each( const ForEachFunc& func ) const
	{

		ForEachFunc* f = new ForEachFunc( func );
		xmmsc_result_dict_foreach( result_, &dict_foreach,
		                           static_cast< void* >( f ) );
		delete f;

	}

	PropDict::PropDict( xmmsc_result_t* res ) : Dict( res )
	{
	}

	PropDict::PropDict( const PropDict& dict ) : Dict( dict )
	{
	}

	PropDict& PropDict::operator=( const PropDict& dict )
	{
		Dict::operator=( dict );
		return *this;
	}

	PropDict::~PropDict()
	{
	}

	void PropDict::setSource( const std::string& src ) const
	{
		std::list< std::string > sources;
		sources.push_back( src );
		setSource( sources );
	}

	void PropDict::setSource( const std::list< std::string >& src ) const
	{
		const char **prefs = new const char*[ src.size() + 1 ];

		std::list< std::string >::const_iterator it;
		int n;
		for(it = src.begin(), n = 0; it != src.end(); ++it, ++n) {
			prefs[n] = it->c_str();
		}
		prefs[n] = 0;

		xmmsc_result_source_preference_set( result_, prefs );

		delete [] prefs;
	}

	static void
	propdict_foreach( const void* key, xmmsc_result_value_type_t type,
	                  const void* value, const char* source,
	                  void* userdata )
	{

		Xmms::PropDict::ForEachFunc* func =
			static_cast< Xmms::PropDict::ForEachFunc* >( userdata );

		Dict::Variant val;
		getValue( val, type, value );

		std::string keystring( static_cast< const char* >( key ) );
		std::string sourcestring( source );

		(*func)( keystring, val, sourcestring );

	}

	void PropDict::each( const PropDict::ForEachFunc& func ) const
	{

		PropDict::ForEachFunc* f = new PropDict::ForEachFunc( func );
		xmmsc_result_propdict_foreach( result_, &propdict_foreach,
		                               static_cast< void* >( f ) );
		delete f;

	}

}

