const EventEmitter = require( 'events' );
const rpio = require( 'rpio' );

class DigitalOutput extends EventEmitter {

    constructor( pin ) {
        super();

        this._pin = pin;
        this._enabled = false;

        rpio.open( pin, rpio.OUTPUT, rpio.LOW );
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

}

module.exports = DigitalOutput;
