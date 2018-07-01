const EventEmitter = require( 'events' );
const PlayerFactory = require( './av-player-factory' );

/**
 * @type {AVPlayer}
 */
class AvPlayer extends EventEmitter {

    /**
     * @param {string[]=} preferredPlayers
     */
    constructor( preferredPlayers ) {
        super();

        this._factory = new PlayerFactory();
        this._factory.init( preferredPlayers ).then( () => this.emit( 'ready' ) );

        this._volume = 50;
        this._loop = false;
        this._activePlayer = undefined;
        this._file = undefined;
    }

    stop() {
        this.loop = false;
        return this._stop();
    }

    /**
     * @param {string} file
     * @return {PromiseLike<any> | Promise<any>}
     */
    play( file ) {
        this._file = file;
        return this._stop().then( () => this._play( file ) );
    }

    /**
     * @param {number} volume
     */
    set volume( volume ) {
        volume = Number( volume );
        if ( isNaN( volume ) || volume < 0 || volume > 100 ) throw new Error( 'volume must be a number between 0 and 100' );
        this._volume = volume;
    }

    /**
     * @param {boolean} loop
     */
    set loop( loop ) {
        this._loop = loop;
    }

    /**
     * @returns {number}
     */
    get volume() {
        return this._volume;
    }

    get status() {
        return {
            volume: this._volume,
            file: this._file,
            running: this.running,
            activePlayer: this._activePlayer ? this._activePlayer.status : 'No active player',
        };
    }

    /**
     * @returns {boolean}
     */
    get running() {
        return this._activePlayer && this._activePlayer.running;
    }

    /**
     * @param {string} file
     * @return {Promise<any>} Resolves when playback starts or when an error occurs
     */
    _play( file ) {
        return new Promise( ( resolve ) => {
            this._activePlayer = this._factory.createPlayer( file );
            this._activePlayer.once( 'start', () => {
                this._started();
                resolve();
            } );
            this._activePlayer.once( 'stop', () => this._stopped() );
            this._activePlayer.once( 'error', ( err ) => {
                this._error( err );
            } );
            this._activePlayer.volume = this._volume;
            this._activePlayer.start();

        } );
    }

    _stop() {
        return new Promise( ( resolve ) => {
            if ( this._activePlayer && this._activePlayer.running ) {
                this._activePlayer.once( 'stop', () => {
                    resolve();
                } );
                this._activePlayer.stop()
            } else {
                resolve();
            }
        } );
    }

    _started() {
        setImmediate( () => this.emit( 'start' ) );
    }

    _stopped() {
        setImmediate( () => this.emit( 'stop' ) );
        if ( this._loop ) {
            console.log( 'Loop: Restarting audio file' );
            this.play( this._file );
        } else {
            console.log( 'Not restarting.', this._loop );
        }
    }

    _error( err ) {
        setImmediate( () => this.emit( 'error', err ) );
        console.error( 'Player error: ' + err );
    }

}

module.exports = AvPlayer;
