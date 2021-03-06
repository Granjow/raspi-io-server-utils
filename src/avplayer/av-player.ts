import { AvPlayerFactory, MediaPlayerName } from './av-player-factory';
import { AbstractPlayer } from './abstract-player';

const EventEmitter = require( 'events' );

/**
 * # Audio/Video player
 *
 * This player checks the availability of some common players (mplayer, vlc, omxplayer) and uses what is available
 * to play given media.
 *
 * ## Events
 *
 * ### `ready`
 *
 * Emitted when the AV player is ready and has checked the available players.
 *
 * ### `start`
 *
 * Video has been started.
 *
 * ### `stop`
 *
 * Video has been stopped.
 *
 * ### `error`
 *
 * Some kind of error has occurred. Must be handled, otherwise the process exit(1)s.
 */
export class AvPlayer extends EventEmitter {

    private _factory : AvPlayerFactory;
    private _volume : number;
    private _loop : boolean;
    private _activePlayer : AbstractPlayer | undefined;
    private _file : string;

    private _startedAt : number;

    /**
     * @param preferredPlayers Defines the order of preferred audio/video players. The first existing is used.
     * See {@link AvPlayerFactory} for a list of valid players.
     */
    constructor( preferredPlayers? : MediaPlayerName[] ) {
        super();

        this._factory = new AvPlayerFactory();
        this._factory.init( preferredPlayers ).then( () => this.emit( 'ready' ) );

        this._volume = 100;
        this._loop = false;
        this._activePlayer = undefined;
        this._file = undefined;
    }

    /**
     * Stops the player *and* disables looping.
     */
    stop() : Promise<void> {
        this.loop = false;
        return this._stop();
    }

    /**
     * Play back the specified file.
     * If playback is already active, it is stopped and then the new file is played back.
     *
     * Note: Do not forget to handle the error event.
     *
     * @return Promise which resolves as soon as playback has started.
     */
    play( file : string ) : Promise<any> {
        this._file = file;
        return this._stop().then( () => this._play( file ) );
    }

    /**
     * Set the audio volume. This does not affect the current playback as it is passed as command-line argument.
     * @param volume Volume, between 0 and 100
     */
    set volume( volume : number ) {
        volume = Number( volume );
        if ( isNaN( volume ) || volume < 0 || volume > 100 ) throw new Error( 'volume must be a number between 0 and 100' );
        this._volume = volume;
    }

    /**
     * @param loop When `true`, the file is looped.
     */
    set loop( loop : boolean ) {
        this._loop = loop;
    }

    get volume() : number {
        return this._volume;
    }

    /**
     * Returns the file that is currently loaded
     */
    get file() : string {
        return this._file;
    }

    /**
     * Returns the elapsed time in milliseconds since playback started.
     */
    get elapsed() : number {
        return this._startedAt && ( Date.now() - this._startedAt );
    }

    get status() {
        return {
            volume: this._volume,
            file: this._file,
            running: this.running,
            activePlayer: this._activePlayer ? this._activePlayer.status : 'No active player',
        };
    }

    get running() : boolean {
        return this._activePlayer && this._activePlayer.running;
    }

    /**
     * @return Resolves when playback starts or when an error occurs
     */
    private _play( file : string ) : Promise<void> {
        return new Promise( ( resolve ) => {

            if ( this._activePlayer ) this._activePlayer.removeAllListeners( 'error' );

            this._activePlayer = this._factory.createPlayer( file );
            this._activePlayer.once( 'start', () => {
                this._started();
                resolve();
            } );
            this._activePlayer.once( 'stop', () => this._stopped() );
            this._activePlayer.on( 'error', ( err : Error ) => {
                this._error( err );
            } );
            this._activePlayer.volume = this._volume;
            this._activePlayer.start();

        } );
    }

    private _stop() : Promise<void> {
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

    private _started() {
        this._startedAt = Date.now();
        setImmediate( () => this.emit( 'start' ) );
    }

    private _stopped() {
        this._startedAt = undefined;
        setImmediate( () => this.emit( 'stop' ) );
        if ( this._loop ) {
            console.log( 'Loop: Restarting audio file' );
            this.play( this._file )
                .catch( ( err ) => this.emit( 'error', err ) );
        } else {
            console.log( `Not restarting. Loop mode ${this._loop ? 'on' : 'off'}` );
        }
    }

    _error( err : Error ) {
        this._startedAt = undefined;
        setImmediate( () => this.emit( 'error', err ) );
        console.error( 'Player error: ' + err );
    }

}
