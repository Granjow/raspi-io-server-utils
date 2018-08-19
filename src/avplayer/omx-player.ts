import { AbstractPlayer } from './abstract-player';

const childProcess = require( 'child_process' );

export class OmxPlayer extends AbstractPlayer {

    static checkAvailability() {
        return new Promise( ( resolve, reject ) => {
            childProcess.exec( 'omxplayer --version', ( err : Error ) => {
                if ( err ) reject();
                else resolve();
            } );
        } );
    }

    constructor( file : string ) {
        super( file );
    }

    get running() {
        return !!this._process;
    }

    get playerName() {
        return 'omxplayer';
    }

    get _omxVolume() {
        return Math.round( this._volume / 100 * 5000 - 5000 );
    }

    get videoArgs() {
        return this.isVideo ? '-b' : '';
    }

    _start() {
        const playerArgs = this.videoArgs.split( ' ' )
            .concat( '-no-osd --no-keys --vol ${this._omxVolume}'.split( ' ' ), this.file )
            .filter( arg => arg.length > 0 );
        console.log( 'Player args: ', JSON.stringify( playerArgs ) );
        this._process = childProcess.spawn(
            'omxplayer',
            playerArgs
        );

        this._process.stderr.on( 'data', ( data : Buffer ) => {
            console.error( data.toString() );
        } );

        this._process.stdout.on( 'data', ( data : Buffer ) => {
            console.log( data.toString() );
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
            try {
                childProcess.execSync( 'killall -SIGINT omxplayer.bin' );
            } catch ( e ) {
                // Not running anymore.
            }
        }
    }

    _stopped() {
        this._process.removeAllListeners();
        this._process = undefined;

        super._stopped();
    }

}
