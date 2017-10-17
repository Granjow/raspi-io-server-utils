const PlayerFactory = require( './av-player-factory' );

class AvPlayer {

    /**
     * @param {string[]} preferredPlayers
     */
    constructor( preferredPlayers ) {
        this._factory = new PlayerFactory();
        this._factory.init( preferredPlayers );

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

    get status() {
        if ( this._activePlayer ) {
            return this._activePlayer.status;
        }
        return {
            info: 'No active player'
        };
    }

    _play( file ) {
        return new Promise( ( resolve ) => {
            this._activePlayer = this._factory.createPlayer( file );
            this._activePlayer.once( 'start', () => {
                resolve();
            } );
            this._activePlayer.start();

        } );
    }

}

module.exports = AvPlayer;
