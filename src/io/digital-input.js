const EventEmitter = require( 'events' );
const rpio = require( 'rpio' );

module.exports = class DigitalInput extends EventEmitter {

    constructor( pin ) {
        super();

        this._pin = pin;
        this._tEnabled = undefined;
        this._currentStatus = false;

        this.reset();

        rpio.open( pin, rpio.INPUT, rpio.PULL_DOWN );
        rpio.poll( pin, () => this._stateChanged(), rpio.POLL_BOTH );
    }

    reset() {
        this._tEnabled = -1;
    }

    get pin() {
        return this._pin;
    }

    get status() {
        return {
            pin: this.pin,
            status: this._currentStatus,
            tEnabled: this._tEnabled
        };
    }

    _stateChanged() {
        const status = rpio.read( this._pin );
        if ( status === rpio.HIGH ) {
            this._tEnabled = Date.now();
            this._currentStatus = true;
            setImmediate( () => this.emit( 'enable' ) );
        } else {
            this._currentStatus = false;
        }
    }

};
