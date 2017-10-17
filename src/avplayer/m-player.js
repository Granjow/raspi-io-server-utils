const childProcess = require( 'child_process' );
const AbstractPlayer = require( './abstract-player' );

class MPlayer extends AbstractPlayer {

    static checkAvailability() {
        return new Promise( ( resolve, reject ) => {
            childProcess.exec( 'which mplayer', err => {
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
        return 'mplayer';
    }

    get _mplayerVolume() {
        return this._volume;
    }

    _start() {
        this._process = childProcess.spawn(
            'mplayer',
            `-nogui -display :0 -fs -volume ${this._mplayerVolume} ${this._file}`.split( ' ' )
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

module.exports = MPlayer;
