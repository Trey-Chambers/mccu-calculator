<?php
/**
 * Plugin Name: MCCU Financial Calculators
 * Description: React-based financial calculators using Tailwind CSS for MCCU.
 * Version: 1.0.0
 * Author: Bullseye Total Media
 * Text Domain: mccu-calculators
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

class MCCU_Calculators {

    public function __construct() {
        // Register the shortcode
        add_shortcode( 'mccu_calculator', array( $this, 'render_calculator_shortcode' ) );
        
        // Register scripts and styles, but don't enqueue them globally
        add_action( 'wp_enqueue_scripts', array( $this, 'register_assets' ) );
    }

    public function register_assets() {
        $js_path  = plugin_dir_path( __FILE__ ) . 'dist/calculator.js';
        $css_path = plugin_dir_path( __FILE__ ) . 'dist/style.css';

        // Only register if the build files exist to prevent fatal errors
        if ( file_exists( $js_path ) ) {
            wp_register_script(
                'mccu-calculator-js',
                plugin_dir_url( __FILE__ ) . 'dist/calculator.js',
                array(), 
                filemtime( $js_path ),
                true // Load in footer
            );
        }

        if ( file_exists( $css_path ) ) {
            wp_register_style(
                'mccu-calculator-css',
                plugin_dir_url( __FILE__ ) . 'dist/style.css',
                array(),
                filemtime( $css_path )
            );
        }
    }

    public function render_calculator_shortcode( $atts ) {
        // Extract the type attribute, defaulting to loan-payment
        $attributes = shortcode_atts(
            array(
                'type' => 'loan-payment',
            ),
            $atts,
            'mccu_calculator'
        );

        // Enqueue the React assets only when the shortcode is used
        wp_enqueue_script( 'mccu-calculator-js' );
        wp_enqueue_style( 'mccu-calculator-css' );

        $calc_type = esc_attr( $attributes['type'] );

        // Output the mount point for React. 
        ob_start();
        ?>
        <div class="mccu-react-calculator-container" data-calculator-type="<?php echo $calc_type; ?>">
            <noscript>You need to enable JavaScript to run this calculator.</noscript>
        </div>
        <?php
        return ob_get_clean();
    }
}

// Initialize the plugin
new MCCU_Calculators();