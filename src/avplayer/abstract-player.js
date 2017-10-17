const EventEmitter = require( 'events' );

class AbstractPlayer extends EventEmitter {

    /**
     * @param {string} file
     */
    constructor( file ) {
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
     * @param {number} volume Volume between 0 and 100
     */
    set volume( volume ) {
        this._volume = volume;
    }

    get status() {
        return {
            running: this.running,
            playedSeconds: this.playTimeSeconds
        };
    }

    get playTime() {
        if ( this._tStart ) {
            if ( this._tStop > this._tStart ) {
                return this._tStop - this._tStart;
            } else {
                return Date.now() - this._tStart;
            }
        }
        return 0;
    }

    get playTimeSeconds() {
        return Math.round( this.playTime / 100 ) / 10;
    }

    get running() {
        throw new Error( 'Not implemented!' );
    }

    _started() {
        this._tStart = Date.now();
        setImmediate( () => this.emit( 'start' ) );
    }

    _stopped() {
        this._tStop = Date.now();
        setImmediate( () => this.emit( 'stop' ) );
    }

}

module.exports = AbstractPlayer;
