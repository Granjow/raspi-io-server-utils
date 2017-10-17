const PlayerFactory = require( './av-player-factory' );

class AvPlayer {

    /**
     * @param {string[]} preferredPlayers
     */
    constructor( preferredPlayers ) {
        this._factory = new PlayerFactory();
        this._factory.init( preferredPlayers );

        this._volume = 50;
        this._activePlayer = undefined;

    }

    stop() {
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

    play( file ) {
        return this.stop().then( () => this._play( file ) );
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
     * @returns {number}
     */
    get volume() {
        return this._volume;
    }

    get status() {
        if ( this._activePlayer ) {
            return this._activePlayer.status;
        }
        return {
            volume: this._volume,
            activePlayer: this._activePlayer ? this._activePlayer.status : 'No active player',
        };
    }

    _play( file ) {
        return new Promise( ( resolve ) => {
            this._activePlayer = this._factory.createPlayer( file );
            this._activePlayer.once( 'start', () => {
                resolve();
            } );
            this._activePlayer.volume = this._volume;
            this._activePlayer.start();

        } );
    }

}

module.exports = AvPlayer;
