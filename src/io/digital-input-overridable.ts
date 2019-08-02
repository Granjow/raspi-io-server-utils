const EventEmitter = require( 'events' );
const rpio = require( 'rpio' );

export enum PullupMode {
    PULLUP = 'PULLUP',
    PULLDOWN = 'PULLDOWN',
    OFF = 'OFF',
}

export enum InputInversion {
    HighIsOn = 'OFF',
    LowIsOn = 'INVERT',
}

export interface ChangeEventData {
    /** Calculated input state */
    enabled : boolean;
    /** Physical input state (not affected by override mode) */
    physical : boolean;
    /** Current override mode */
    overrideMode : boolean;
}

export interface Conf {
    pin : number;
    pullupMode? : PullupMode;
    inputInversion? : InputInversion;
}

export interface IOs {
    open( pin : number, direction : number, pullup : number ) : void;

    poll( pin : number, cb : ( pin : number ) => void, when : number ) : void;

    read( pin : number ) : number;

    close( pin : number, reset : number ) : void;
}

enum Events {
    change = 'CHANGE',
}


export class DigitalInputOverridable {

    static defaultConf : Conf = {
        pin: -1,
        inputInversion: InputInversion.HighIsOn,
        pullupMode: PullupMode.OFF,
    };

    /** rpio instance. Can be overridden for unit testing. */
    static rpio : IOs = require( 'rpio' );

    constructor( conf : Conf ) {

        const mergedConf = Object.assign( {}, DigitalInputOverridable.defaultConf, conf );

        let pullupMode = rpio.OFF;
        switch ( mergedConf.pullupMode ) {
            case PullupMode.PULLUP:
                pullupMode = rpio.PULL_UP;
                break;
            case PullupMode.PULLDOWN:
                pullupMode = rpio.PULL_DOWN;
                break;
        }

        this._ON = mergedConf.inputInversion === InputInversion.HighIsOn ? rpio.HIGH : rpio.LOW;

        try {
            DigitalInputOverridable.rpio.open( mergedConf.pin, rpio.INPUT, pullupMode );
        } catch ( e ) {
            throw new Error( `Could not open output pin ${mergedConf.pin}: ${e.message || e}` );
        }

        DigitalInputOverridable.rpio.poll( mergedConf.pin, () => this.onPoll(), rpio.POLL_BOTH );

        this._conf = mergedConf;
    }

    get status() {
        return {
            pin: this._conf.pin,
            status: this._calculatedStatus,
            overrideMode: this._overrideMode,
            overrideToEnabled: this._overrideToEnabled,
            physicalStatus: this._physicalStatus,
            inputInversion: this._conf.inputInversion,
            pullupMode: this._conf.pullupMode,
            tEnabled: this.tEnabled,
        };
    }

    /**
     * @returns Timestamp when the input was activated the last time
     */
    get tEnabled() : number {
        return this._tEnabled;
    }

    get enabled() : boolean {
        return this._calculatedStatus;
    }

    /**
     * Enable or disable override mode.
     * When enabled, the physical state is ignored and only the override value from #overrideToEnabled
     * is taken into account.
     */
    set overrideMode( override : boolean ) {
        if ( this._overrideMode !== override ) {
            this._overrideMode = override;
            this.recalculateStatus();
        }
    }

    /**
     * Value that is used when override mode is enabled with #overrideMode.
     * This is already the logical value which is not affected by the input inversion.
     */
    set overrideToEnabled( enabled : boolean ) {
        if ( this._overrideToEnabled !== enabled ) {
            this._overrideToEnabled = enabled;
            this.recalculateStatus();
        }
    }

    /**
     * Binds to a change event.
     * @param f Callback function. It receives a #ChangeEventData object.
     */
    onChange( f : ( data : ChangeEventData ) => void ) {
        this._eventEmitter.on( Events.change, f );
    }

    /**
     * Manually read the GPIO pin, e.g. for initialisation.
     */
    read() {
        this.onPoll();
    }

    /**
     * Close the pin so it can be used from somewhere else.
     * Configuration will be reset as well, i.e. it will be put to INPUT mode without pullup/pulldown resistors.
     */
    close() {
        DigitalInputOverridable.rpio.close( this._conf.pin, rpio.RESET );
    }

    private onPoll() {

        const oldStatus = this._physicalStatus;
        const status = DigitalInputOverridable.rpio.read( this._conf.pin ) === this._ON;

        if ( status !== oldStatus ) {
            this._physicalStatus = status;
            this.recalculateStatus();
        }
    }

    private recalculateStatus() {

        const newStatus = this._overrideMode ? this._overrideToEnabled : this._physicalStatus;

        if ( this._calculatedStatus !== newStatus ) {

            if ( newStatus ) this._tEnabled = Date.now();

            this._calculatedStatus = newStatus;

            const changes : ChangeEventData = {
                enabled: this._calculatedStatus,
                overrideMode: this._overrideMode,
                physical: this._physicalStatus,
            };
            setImmediate( () => this._eventEmitter.emit( Events.change, changes ) );

        }

    }


    private _tEnabled : number = -1;
    private _physicalStatus : boolean = undefined;
    private _calculatedStatus : boolean = undefined;

    private _overrideMode : boolean = false;
    private _overrideToEnabled : boolean = false;
    private _eventEmitter = new EventEmitter();

    private readonly _conf : Conf;
    private readonly _ON : number;

}
