const ws281x = require( 'rpi-ws281x-native' );

/**
 * # WS2812b LED stripe display
 *
 * Small library function around [rpi-ws281x-native](https://www.npmjs.com/package/rpi-ws281x-native)
 *
 * ## Raspi configuration for WS2812b
 *
 * * Disable `dtparam=audio=on` overlay in `/boot/config.txt`
 * * Data pin is the physical pin 12 by default.
 *   Since it is 3V3, it needs to be level shifted to 5 V with e.g. a 74HCT08.
 */
export class Ws2812bDisplay {

    static rgb2Int( r : number, g : number, b : number ) {
        return ( ( r & 0xff ) << 16 ) + ( ( g & 0xff ) << 8 ) + ( b & 0xff );
    }

    private _length : number;
    private _gpioPin : number;
    private _brightness : number;

    /**
     * @param opts See [rpi_ws281x](https://github.com/jgarff/rpi_ws281x) regarding GPIO pins.
     * Raspberry versions > 2 can use PWM pins BCM18 (physical pin 12) or BCM12 (physical pin 32);
     * the first one is used by default.
     */
    constructor( opts : { length : number, gpioPin? : number } ) {
        if ( !( opts.length > 0 ) ) throw new Error( 'Stripe length missing' );

        this._length = opts.length;
        this._gpioPin = opts.gpioPin || 18;

        ws281x.init( opts.length, { gpio: this._gpioPin } ); // Physical PWM pin 12
        this.brightness = 255;
    }

    get status() {
        return {
            gpioPin: this._gpioPin,
            length: this._length,
            brightness: this._brightness,
        }
    }

    /**
     * Returns the strip length used.
     */
    get length() : number {
        return this._length;
    }

    /**
     * Returns the GPIO pin which is used.
     * Note that this is the BCM pin number and not the physical pin.
     */
    get gpioPin() : number {
        return this._gpioPin;
    }

    /**
     * @param colors Array of [r,g,b] values in [0,255]
     */
    set colors( colors : number[][] ) {
        if ( colors.length > this._length ) throw new Error( `Got ${colors.length} colors, but can only write ${this._length}` );

        const pixelData = new Uint32Array( this._length ).fill( 0 );
        colors.forEach( ( el, ix ) => pixelData[ ix ] = Ws2812bDisplay.rgb2Int( el[ 0 ], el[ 1 ], el[ 2 ] ) );
        ws281x.render( pixelData );
    }

    /**
     * @param {number} brightness Brightness in [0,255]
     */
    set brightness( brightness : number ) {
        ws281x.setBrightness( brightness );
        this._brightness = brightness;
    }

    glow() {
        return new Promise( ( resolve ) => {
            let c = 0;
            let N = 100;
            let interval = setInterval( () => {
                if ( c > N ) {
                    clearInterval( interval );
                    resolve();
                } else {
                    const half = N / 2;
                    const brightness = 255 * ( c < half ? c / half : 1 - ( c - half ) / half );
                    const pixelData = new Uint32Array( this._length ).fill( Ws2812bDisplay.rgb2Int( brightness, brightness, brightness ) );
                    ws281x.render( pixelData );
                }
                c++;
            }, 1000 / N );
        } );
    }

    off() {
        this.colors = new Array( this._length ).fill( [ 0, 0, 0 ] );
    }

    reset() {
        ws281x.reset();
    }
}
