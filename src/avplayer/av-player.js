const path = require( 'path' );
const EventEmitter = require( 'events' );
const childProcess = require( 'child_process' );

const jsonfile = require( 'jsonfile' );

let players = {
    mplayer: {
        exists: false,
        name: 'mplayer',
        args: ( volume ) => `--display=:0 -fs --volume=${volume}`.split( ' ' ),
        exitWhenNoStdout: true,
        kill: childProc => {
            if ( childProc ) {
                console.log( 'Killing mplayer.' );
                childProc.kill( 'SIGKILL' );
                return true;
            }
            return false;
        }
    },
    omxplayer: {
        exists: false,
        name: 'omxplayer',
        args: () => '-b --no-osd --no-keys'.split( ' ' ),
        kill: childProc => {
            if ( childProc ) {
                childProc.kill( 'SIGTERM' );
                childProcess.execSync( 'killall omxplayer.bin' );
                return true;
            }
            return false;
        }
    },
    vlc: {
        exists: false,
        name: 'cvlc',
        args: () => '--play-and-exit -f'.split( ' ' ),
        kill: childProc => {
            if ( childProc ) {
                childProc.kill( 'SIGTERM' );
                return true;
            }
            return false;
        }
    }
};

childProcess.exec( 'omxplayer --version', err => {
    players.omxplayer.exists = !err;
    console.log( 'omxplayer ' + (err ? 'not found' : 'found' ) );
} );
childProcess.exec( 'cvlc --version', err => {
    players.vlc.exists = !err;
    console.log( 'vlc ' + (err ? 'not found' : 'found' ) );
} );
childProcess.exec( 'which mplayer', err => {
    players.mplayer.exists = !err;
    console.log( 'mplayer ' + (err ? 'not found' : 'found' ) );
    console.log( err );
} );

class AVPlayer extends EventEmitter {

    /**
     * @param {string} avFile
     */
    constructor( avFile ) {
        super();

        this._process = undefined;
        this.player = undefined;
        this._avFile = avFile;
        this._lastStdout = 0;
        this._volume = 5;

        this._tStart = undefined;
        this._tStop = undefined;

        this._volumeFile = path.join( __dirname, 'audio.json' );
        jsonfile.readFile( this._volumeFile, ( err, obj ) => {
            if ( !err && obj.hasOwnProperty( 'volume' ) ) {
                this._volume = obj.volume;
                console.log( `Volume changed to ${this._volume}` );
            }
        } );
    }

    /**
     * @param {boolean=} restartIfRunning
     */
    start( restartIfRunning ) {

        if ( this._process ) {
            if ( restartIfRunning ) {
                console.log( 'Already running, stopping first.' );
                this.stop().then( () => this._start() );
            } else {
                console.log( 'Already running.' );
            }
        } else {
            this._start();
        }
    }

    stop() {
        return new Promise( ( resolve ) => {
            if ( this.player ) {
                this._process.on( 'exit', () => {
                    resolve();
                } );
                this.player.kill( this._process );
            } else {
                resolve();
            }
        } );
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
        return !!this._process;
    }

    get status() {
        return {
            running: this.running,
            volume: this.volume,
            playedSeconds: this.playTimeSeconds
        };
    }

    get volume() {
        return this._volume;
    }

    set volume( vol ) {
        this._volume = vol;
        jsonfile.writeFileSync( this._volumeFile, { vol } );
    }

    _stopped() {
        this._process = undefined;
        this._tStop = Date.now();
        setImmediate( () => this.emit( 'stop' ) );
    }

    _start() {
        this.player = this.player || [ players.omxplayer, players.mplayer ].find( p => p.exists ) || players.vlc;

        this._process = childProcess.spawn(
            this.player.name,
            this.player.args( this._volume ).concat( this._avFile )
        );

        this._process.stdout.on( 'data', () => {
            this._lastStdout = Date.now();
        } );

        this._process.stderr.on( 'data', data => {
            console.error( data.toString() );
            this._lastStdout = Date.now();
        } );

        if ( this.player.exitWhenNoStdout ) {
            // mplayer does not exit when reaching the end of a file. Do it manually.
            let interval = setInterval( () => {
                if ( this._process ) {
                    if ( Date.now() - this._lastStdout > 2000 ) {
                        console.log( 'Not active anymore, stopping.', Date.now(), this._lastStdout, Date.now() - this._lastStdout );
                        this.stop();
                    }
                } else {
                    clearInterval( interval );
                }
            }, 2000 );
        }

        this._process.on( 'exit', () => {
            console.log( 'Exited.' );
            this._stopped();
        } );
        this._process.on( 'error', ( err ) => {
            console.error( 'Error!', err );
            this._process = undefined;
            setImmediate( () => this.emit( 'stop' ) );
        } );

        this._tStart = Date.now();
        setImmediate( () => this.emit( 'start' ) );
    }

}

module.exports = AVPlayer;
