import { AbstractPlayer } from './abstract-player';
import { ChildProcess } from 'child_process';

const childProcess = require( 'child_process' );

export class VlcPlayer extends AbstractPlayer {

    static checkAvailability() {
        return new Promise( ( resolve, reject ) => {
            childProcess.exec( 'cvlc --version', ( err : Error ) => {
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
        return 'cvlc';
    }

    get _vlcVolume() {
        return this._volume / 100 * 2;
    }

    _start() {
        let stderr = '';

        const args : string[] = [
            '--play-and-exit',
            `--gain=${this._vlcVolume}`,
            '--no-video-title-show',
            '-f', this.file,
        ];

        this._process = childProcess.spawn( 'cvlc', args );

        this._process.stderr.on( 'data', ( data : any ) => {
            console.error( data.toString() );

            stderr += data.toString();
            stderr.split( '\n' )
                .filter( line => line.indexOf( 'cannot open file' ) > 0 )
                .some( ( err : string ) => {
                    this.emit( 'error', err );
                    this._stop();
                    return true;
                } );
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

    private _process : ChildProcess;

}
