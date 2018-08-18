const EventEmitter = require( 'events' );

export abstract class AbstractPlayer extends EventEmitter {

    private readonly _file : string;
    protected _volume : number;
    private _error : Error | undefined;

    protected constructor( file : string ) {
        super();

        this._file = file;
        this._volume = 50;
    }

    start() {
        this._start();
    }

    stop() {
        this._stop();
    }

    /**
     * @param volume Volume between 0 and 100
     */
    set volume( volume : number ) {
        this._volume = volume;
    }

    get status() {
        return {
            running: this.running,
            playedSeconds: this.playTimeSeconds,
            volume: this._volume,
            playerName: this.playerName,
            error: this._error,
        };
    }

    get playTime() : number {
        if ( this._tStart ) {
            if ( this._tStop > this._tStart ) {
                return this._tStop - this._tStart;
            } else {
                return Date.now() - this._tStart;
            }
        }
        return 0;
    }

    protected abstract _start() : void;

    protected abstract _stop() : void;

    get playTimeSeconds() : number {
        return Math.round( this.playTime / 100 ) / 10;
    }

    get playerName() : string {
        throw new Error( 'Not implemented!' );
    }

    get running() : boolean {
        throw new Error( 'Not implemented!' );
    }

    get volume() : number {
        return this._volume;
    }

    get isVideo() : boolean {
        return !/(mp3|wav|ogg)$/i.test( this._file );
    }

    get file() : string {
        return this._file;
    }

    _started() {
        this._tStart = Date.now();
        setImmediate( () => this.emit( 'start' ) );
    }

    _stopped() {
        this._tStop = Date.now();
        setImmediate( () => this.emit( 'stop' ) );
    }

    _setError( err : Error ) {
        this._error = err;
    }

}
