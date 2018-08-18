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
        this._process = childProcess.spawn(
            'mplayer',
            `-nogui -display :0 -fs -volume ${this._mplayerVolume}`.split( ' ' ).concat( [ this.file ] )
        );

        this._process.stderr.on( 'data', ( data : any ) => {
            console.error( data.toString() );
        } );

        this._process.on( 'exit', () => {
            console.log( 'Exited.' );
            this._stopped();
        } );
        this._process.on( 'error', ( err : Error ) => {
            console.error( 'Error!', err );
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
