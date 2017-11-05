const EventEmitter = require( 'events' );
const rpio = require( 'rpio' );

/**
 * Digital input which listens to rising edges.
 * Keeps the state until reset.
 *
 * @type {DigitalInput}
 */
module.exports = class DigitalInput extends EventEmitter {

    /**
     * @param {number} pin Physical pin to read
     */
    constructor( pin ) {
        super();

        this._pin = pin;
        this._tEnabled = undefined;
        this._currentStatus = false;

        this.reset();

        rpio.open( pin, rpio.INPUT, rpio.PULL_DOWN );
        rpio.poll( pin, () => this._stateChanged(), rpio.POLL_BOTH );

        // Read initial status
        this._stateChanged();
    }

    get pin() {
        return this._pin;
    }

    get status() {
        return {
            pin: this.pin,
            status: this.currentStatus,
            tEnabled: this.tEnabled,
        };
    }

    /**
     * @returns {number} Timestamp when the input was activated the last time
     */
    get tEnabled() {
        return this._tEnabled;
    }

    /**
     * @returns {boolean} true, if the input is currently HIGH
     */
    get currentStatus() {
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
        if ( status === rpio.HIGH ) {
            this._currentStatus = true;
            this.setActivated();
        } else {
            this._currentStatus = false;
        }
    }

};
