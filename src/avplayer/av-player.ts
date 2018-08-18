import { AvPlayerFactory } from './av-player-factory';
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
 * Some kind of error has occurred.
 */
export class AvPlayer extends EventEmitter {

    private _factory : AvPlayerFactory;
    private _volume : number;
    private _loop : boolean;
    private _activePlayer : AbstractPlayer | undefined;
    private _file : string;

    constructor( preferredPlayers? : string[] ) {
        super();

        this._factory = new AvPlayerFactory();
        this._factory.init( preferredPlayers ).then( () => this.emit( 'ready' ) );

        this._volume = 50;
        this._loop = false;
        this._activePlayer = undefined;
        this._file = undefined;
    }

    stop() : Promise<void> {
        this.loop = false;
        return this._stop();
    }

    play( file : string ) : Promise<any> {
        this._file = file;
        return this._stop().then( () => this._play( file ) );
    }

    set volume( volume : number ) {
        volume = Number( volume );
        if ( isNaN( volume ) || volume < 0 || volume > 100 ) throw new Error( 'volume must be a number between 0 and 100' );
        this._volume = volume;
    }

    set loop( loop : boolean ) {
        this._loop = loop;
    }

    get volume() : number {
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

    get running() : boolean {
        return this._activePlayer && this._activePlayer.running;
    }

    /**
     * @return Resolves when playback starts or when an error occurs
     */
    _play( file : string ) : Promise<void> {
        return new Promise( ( resolve ) => {
            this._activePlayer = this._factory.createPlayer( file );
            this._activePlayer.once( 'start', () => {
                this._started();
                resolve();
            } );
            this._activePlayer.once( 'stop', () => this._stopped() );
            this._activePlayer.once( 'error', ( err : Error ) => {
                this._error( err );
            } );
            this._activePlayer.volume = this._volume;
            this._activePlayer.start();

        } );
    }

    _stop() : Promise<void> {
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

    _error( err : Error ) {
        setImmediate( () => this.emit( 'error', err ) );
        console.error( 'Player error: ' + err );
    }

}
