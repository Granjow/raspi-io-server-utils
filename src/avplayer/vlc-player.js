const childProcess = require( 'child_process' );
const AbstractPlayer = require( './abstract-player' );

class VlcPlayer extends AbstractPlayer {

    static checkAvailability() {
        return new Promise( ( resolve, reject ) => {
            childProcess.exec( 'cvlc --version', err => {
                if ( err ) reject();
                else resolve();
            } );
        } );
    }

    constructor( file ) {
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
        this._process = childProcess.spawn(
            'cvlc',
            `--play-and-exit --gain=${this._vlcVolume} -f ${this._file}`.split( ' ' )
        );

        this._process.stderr.on( 'data', data => {
            console.error( data.toString() );
        } );

        this._process.on( 'exit', () => {
            console.log( 'Exited.' );
            this._stopped();
        } );
        this._process.on( 'error', ( err ) => {
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

module.exports = VlcPlayer;