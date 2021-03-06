const EventEmitter = require( 'events' );
const rpio = require( 'rpio' );

export enum InputMode {
    PULLUP = 'PULLUP',
    PULLDOWN = 'PULLDOWN',
    OFF = 'OFF',
}

/**
 * Digital input which listens to rising edges.
 * Keeps the state until reset.
 *
 * ## Events
 *
 * ### `enable`
 *
 * Emitted when the input changes to logical HIGH (depending on the `highIsOff` settings)
 *
 * ### `disable`
 *
 * Emitted when the input changes to logical LOW
 */
export class DigitalInput extends EventEmitter {

    private readonly _pin : number;
    private readonly _highIsOff : boolean;
    private readonly _inputMode : InputMode;
    private readonly _ON : number;
    private _tEnabled : number;
    private _currentStatus : boolean;

    /**
     * Creates a new digital input which is polled for changes. When the pin changes,
     * an `enable` or `disable` event is emitted.
     *
     * @param pin Physical pin to read
     * @param highIsOff Invert the input: low = on, high = off
     * @param inputMode Defines which input resistors (pullup, pulldown, or none) are used.
     */
    constructor( pin : number, highIsOff : boolean = false, inputMode : InputMode = InputMode.OFF ) {
        super();

        this._pin = pin;
        this._tEnabled = undefined;
        this._highIsOff = highIsOff;
        this._inputMode = inputMode;
        this._currentStatus = false;

        this._ON = highIsOff ? rpio.LOW : rpio.HIGH;

        this.reset();

        let rpioInputMode = rpio.OFF;
        switch ( inputMode ) {
            case InputMode.PULLUP:
                rpioInputMode = rpio.PULL_UP;
                break;
            case InputMode.PULLDOWN:
                rpioInputMode = rpio.PULL_DOWN;
                break;
        }

        try {
            rpio.open( pin, rpio.INPUT, rpioInputMode );
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
            inputMode: this._inputMode,
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

    setDeactivated() {
        setImmediate( () => this.emit( 'disable' ) );
    }

    _stateChanged() {
        const status = rpio.read( this._pin );
        const oldStatus = this._currentStatus;
        if ( status === this._ON ) {
            this._currentStatus = true;
            if ( !oldStatus ) this.setActivated();
        } else {
            this._currentStatus = false;
            if ( oldStatus ) this.setDeactivated();
        }
    }

}
