const EventEmitter = require( 'events' );
const rpio = require( 'rpio' );

/**
 * Digital output, keeps track of the state.
 *
 * @type {DigitalOutput}
 */
module.exports = class DigitalOutput extends EventEmitter {

    constructor( pin ) {
        super();

        this._pin = pin;
        this._enabled = false;

        try {
            rpio.open( pin, rpio.OUTPUT, rpio.LOW );
        } catch ( e ) {
            throw new Error( `Could not open input pin ${pin}: ${e.message}` );
        }
    }

    get status() {
        return {
            pin: this._pin,
            enabled: this.enabled
        }
    }

    get enabled() {
        return this._enabled;
    }

    set enabled( enabled ) {
        this._enabled = enabled;
        rpio.write( this._pin, enabled ? rpio.HIGH : rpio.LOW );
    }

};
