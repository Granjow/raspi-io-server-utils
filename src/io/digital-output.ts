const EventEmitter = require( 'events' );
const rpio = require( 'rpio' );

/**
 * Digital output, keeps track of the state.
 */
export class DigitalOutput extends EventEmitter {

    private readonly _pin : number;
    private readonly _low : number;
    private readonly _high : number;
    private _enabled : boolean;

    constructor( pin : number, inverted : boolean = false ) {
        super();

        this._pin = pin;
        this._enabled = false;
        this._low = inverted ? rpio.HIGH : rpio.LOW;
        this._high = inverted ? rpio.LOW : rpio.HIGH;

        try {
            rpio.open( pin, rpio.OUTPUT, this._low );
        } catch ( e ) {
            throw new Error( `Could not open input pin ${pin}: ${e.message || e}` );
        }
    }

    get status() {
        return {
            pin: this._pin,
            enabled: this.enabled
        }
    }

    get enabled() : boolean {
        return this._enabled;
    }

    set enabled( enabled : boolean ) {
        this._enabled = enabled;
        rpio.write( this._pin, enabled ? this._high : this._low );
    }

}
