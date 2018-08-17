const EventEmitter = require( 'events' );
const rpio = require( 'rpio' );

/**
 * Digital input which listens to rising edges.
 * Keeps the state until reset.
 *
 * @type {DigitalInput}
 */
export class DigitalInput extends EventEmitter {

    private readonly _pin : number;
    private readonly _highIsOff : boolean;
    private readonly _ON : number;
    private _tEnabled : number;
    private _currentStatus : boolean;

    /**
     * @param pin Physical pin to read
     * @param highIsOff Invert the input: low = on, high = off
     */
    constructor( pin : number, highIsOff : boolean = false ) {
        super();

        this._pin = pin;
        this._tEnabled = undefined;
        this._highIsOff = highIsOff;
        this._currentStatus = false;

        this._ON = highIsOff ? rpio.LOW : rpio.HIGH;

        this.reset();

        try {
            rpio.open( pin, rpio.INPUT, rpio.PULL_DOWN );
        } catch ( e ) {
            throw new Error( `Could not open output pin ${pin}: ${e.message || e}` );
        }

        rpio.poll( pin, () => this._stateChanged(), rpio.POLL_BOTH );

        // Read initial status
        this._stateChanged();
    }

    get pin() : number {
        return this._pin;
    }

    get status() {
        return {
            pin: this.pin,
            status: this.currentStatus,
            tEnabled: this.tEnabled,
            highIsOff: this._highIsOff,
        };
    }

    /**
     * @returns Timestamp when the input was activated the last time
     */
    get tEnabled() : number {
        return this._tEnabled;
    }

    /**
     * @returns true, if the input is currently HIGH
     */
    get currentStatus() : boolean {
        return this._currentStatus;
    }

    reset() {
        this._tEnabled = -1;
    }

    setActivated() {
        this._tEnabled = Date.now();
        setImmediate( () => this.emit( 'enable' ) );
    }

    _stateChanged() {
        const status = rpio.read( this._pin );
        if ( status === this._ON ) {
            this._currentStatus = true;
            this.setActivated();
        } else {
            this._currentStatus = false;
        }
    }

}
