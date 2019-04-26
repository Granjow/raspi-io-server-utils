import { AbstractPlayer } from './abstract-player';

const childProcess = require( 'child_process' );

export class MPlayer extends AbstractPlayer {

    static checkAvailability() {
        return new Promise( ( resolve, reject ) => {
            childProcess.exec( 'which mplayer', ( err : Error ) => {
                if ( err ) reject();
                else resolve();
            } );
        } );
    }

    private _process : any;

    constructor( file : string ) {
        super( file );
    }

    get running() {
        return !!this._process;
    }

    get playerName() {
        return 'mplayer';
    }

    get _mplayerVolume() {
        return this._volume;
    }

    _start() {

        // mplayer produces a lot of stdout data. When this data is not ignored in the spawn options
        // but also not read out in process.stdout.on(), it accumulates and probably fills an internal buffer,
        // causing playback to stop.
        const opts = {
            stdio: [ 'pipe', 'ignore', 'pipe' ],
        };
        const args : string[] = [ '-nogui', '-display', ':0', '-fs', '-volume', this._mplayerVolume.toString( 10 ), this.file ];
        this._process = childProcess.spawn( 'mplayer', args, opts );

        this._process.stderr.on( 'data', ( data : Buffer ) => {
            console.error( data.toString() );
        } );

        this._process.on( 'exit', () => {
            console.log( 'mplayer exited.' );
            this._stopped();
        } );
        this._process.on( 'error', ( err : Error ) => {
            console.error( 'mplayer error:', err );
            this._stopped();
        } );

        this._started();
    }

    _stop() {
        if ( this._process ) {
            this._process.kill( 'SIGINT' );
        }
    }

    _stopped() {
        this._process.removeAllListeners();
        this._process = undefined;

        super._stopped();
    }

}
