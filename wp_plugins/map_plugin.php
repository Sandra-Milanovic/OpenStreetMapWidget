<?php
/*
 Plugin Name: osmap
 Plugin URI: http://github.com/Sandra-Milanovic/OpenStreetMapWidget
 Description: Paste a long link to the map and you get an embed!
 Version: 0.1
 Author: SandraMilanovic
 Author Email: NotAvailable
 Author URI: NotAvailable
*/
if ( !function_exists( 'map_embed_shortcode' ) ) :
	
	function map_embed_shortcode($atts, $content = null) {
		if( !isset($atts["width"]) ):
			$atts["width"] = 480;
		endif;
		if( !isset($atts["height"]) ):
			$atts["height"] = 420;
		endif;
		return '<iframe src="' . $atts["src"] . '" width=' . $atts["width"] . ' height=' . $atts["height"] . '></iframe>';
	}
	add_shortcode('map', 'map_embed_shortcode');

endif;

?>