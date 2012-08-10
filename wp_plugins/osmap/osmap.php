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
 if ( !function_exists( 'osmap_enqueue_script' ) ) :
     function osmap_enqueue_script() {
         wp_enqueue_script( 'jquery' );
         wp_enqueue_script( 'osmap', plugins_url('/osmap.js', __FILE__));
     }
     add_action('wp_enqueue_scripts', 'osmap_enqueue_script');
 endif;

?>


