const EventEmitter = require( 'events' );
const rpio = require( 'rpio' );

export interface ChangeEventData {
    enabled : boolean;
    overrideMode : boolean;
    writtenRpioState : number;
}

export interface Conf {
    pin : number;
    outputInversion? : OutputInversion;
}

export enum OutputInversion {
    /** Default: Enabling the output sets it to HIGH (3v3 on a Raspberry). */
    OnIsHigh = 'OFF',
    /** Inverted: Enabling the output writes a LOW (0v on a Raspberry), disabling it writes a logical HIGH (3v3). */
    OnIsLow = 'INVERT',
}

enum Events {
    change = 'Change',
}

/**
 * Digital output, keeps track of the state and can be overridden.
 */
export class DigitalOutputOverridable {

    static defaultConf : Conf = {
        pin: -1,
        outputInversion: OutputInversion.OnIsHigh,
    };


    /**
     * Opens a new digital output.
     *
     * **Note:** The output is not written yet and is therefore in unknown state until it is set.
     *
     * @param conf For parameters which are not required, the default parameters from #defaultConf are used.
     */
    constructor( conf : Conf ) {

        const mergedConf = Object.assign( {}, DigitalOutputOverridable.defaultConf, conf );

        this._pin = mergedConf.pin;
        this._high = ( mergedConf.outputInversion === OutputInversion.OnIsHigh ) ? rpio.HIGH : rpio.LOW;
        this._low = ( mergedConf.outputInversion === OutputInversion.OnIsHigh ) ? rpio.LOW : rpio.HIGH;

        try {
            rpio.open( mergedConf.pin, rpio.OUTPUT, this._low );
        } catch ( e ) {
            throw new Error( `Could not open input pin ${mergedConf.pin}: ${e.message || e}` );
        }
    }

    get status() {
        return {
            pin: this._pin,
            enabled: this.enabled,
            overrideMode: this._overrideMode,
            overrideOutputEnabled: this._overrideOutputEnabled,
            lastWrittenRpioState: this._lastWrittenRpioState,
        }
    }

    /**
     * Returns true if the output is enabled.
     * This is the logical state
     */
    get enabled() : boolean {
        return this._calculatedEnabled;
    }

    get lastWrittenRpioState() : number {
        return this._lastWrittenRpioState;
    }

    set enabled( enabled : boolean ) {
        if ( this._enabled !== enabled ) {
            this._enabled = enabled;
            this.updateOutputState();
        }
    }

    set overrideMode( override : boolean ) {
        if ( this._overrideMode !== override ) {
            this._overrideMode = override;
            this.updateOutputState();
        }
    }

    set overrideOutputEnabled( enabled : boolean ) {
        if ( this._overrideOutputEnabled !== enabled ) {
            this._overrideOutputEnabled = enabled;
            this.updateOutputState();
        }
    }

    onChange( f : ( data : ChangeEventData ) => void ) {
        this._events.on( Events.change, f );
    }

    close() {
        rpio.close( this._pin, rpio.PIN_RESET );
    }

    private updateOutputState() {
        const newCalculatedEnabled = this._overrideMode ? this._overrideOutputEnabled : this._enabled;

        if ( newCalculatedEnabled !== this._calculatedEnabled || this._lastWrittenState !== newCalculatedEnabled ) {
            this._calculatedEnabled = newCalculatedEnabled;

            const stateToWrite : number = this._calculatedEnabled ? this._high : this._low;
            rpio.write( this._pin, stateToWrite );
            this._lastWrittenState = newCalculatedEnabled;
            this._lastWrittenRpioState = stateToWrite;

            const changeEventData : ChangeEventData = {
                enabled: this.enabled,
                overrideMode: this._overrideMode,
                writtenRpioState: this._lastWrittenRpioState,
            };
            setImmediate( () => this._events.emit( Events.change, changeEventData ) );
        }
    }

    private readonly _pin : number;
    private readonly _low : number;
    private readonly _high : number;

    private readonly _events = new EventEmitter();

    private _enabled : boolean = undefined;
    private _calculatedEnabled : boolean;
    private _lastWrittenState : boolean = undefined;
    private _lastWrittenRpioState : number = undefined;

    private _overrideMode : boolean = false;
    private _overrideOutputEnabled : boolean = false;

}
