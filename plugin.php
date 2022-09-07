<?php
/**
 * Plugin Name: OptinMonster Importer/Exporter
 * Plugin URI:  https://optinmonster.com
 * Description: Allows importing/exporting OptinMonster Output Settings
 * Author:      OptinMonster Popup Builder Team
 * Author URI:  https://optinmonster.com
 * Version:     1.0.0
 * Text Domain: optin-monster-api
 * Domain Path: languages
 * Requires PHP: 5.3
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Hook in right around the same time OM enqueues.
function handle_enqueue_optinmonster_importer_exporter( $js_args ) {
	wp_enqueue_script(
		'om-exporter',
		plugins_url( 'js/optinmonster-importer-exporter.js', __FILE__ ),
		[],
		'1.0.0'
	);

	return $js_args;
}
add_filter( 'optin_monster_campaigns_js_api_args', 'handle_enqueue_optinmonster_importer_exporter' );
