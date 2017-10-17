const EventEmitter = require( 'events' );

const VlcPlayer = require( './vlc-player' );
const OmxPlayer = require( './omx-player' );
const MPlayer = require( './m-player' );

class AVPlayerFactory extends EventEmitter {

    constructor() {
        super();

        this._availableFactories = [];
    }

    /**
     * Initialise the factory; test which players are available.
     *
     * @param {string[]=} preferredOrder See #preferredOrder
     * @returns {Promise.<void>}
     */
    init( preferredOrder ) {
        const name = 'AVPlayerFactory';

        const vlcCheck = VlcPlayer.checkAvailability().then(
            () => {
                console.log( name + ': cvlc is available.' );
                this._availableFactories.push( VlcPlayer );
            },
            () => console.log( name + ': cvlc not available.' )
        );

        const omxCheck = OmxPlayer.checkAvailability().then(
            () => {
                this._availableFactories.push( OmxPlayer );
                console.log( name + ': omxplayer is available.' );
            },
            () => console.log( name + ': omxplayer not available.' )
        );

        const mplayerCheck = MPlayer.checkAvailability().then(
            () => {
                this._availableFactories.push( MPlayer );
                console.log( name + ': mplayer is available.' );
            },
            () => console.log( name + ': mplayer not available.' )
        );

        return Promise.all( [ vlcCheck, omxCheck, mplayerCheck ] )
            .then( () => {
                console.log( 'Factory is ready.' );
                if ( preferredOrder ) {
                    this.preferredOrder = preferredOrder;
                }
                this.emit( 'ready' )
            } );
    }

    /**
     * Define in which order players should be created.
     * @param {string[]} order
     */
    set preferredOrder( order ) {
        if ( !(order instanceof Array) ) return;
        const preferredOrder = order.map( name => {
            switch ( name ) {
                case 'mplayer':
                    return MPlayer;
                case 'omxplayer':
                    return OmxPlayer;
                case 'vlc':
                case 'cvlc':
                    return VlcPlayer;
                default:
                    return undefined;
            }
        } );
        this._availableFactories = preferredOrder
            .filter( player => this._availableFactories.includes( player ) )
            .concat( this._availableFactories.filter( factory => !preferredOrder.includes( factory ) ) );
    }

    /**
     *
     * @param {string} file
     * @return {AbstractPlayer}
     */
    createPlayer( file ) {
        if ( this._availableFactories.length > 0 ) {
            return new this._availableFactories[ 0 ]( file );
        } else {
            throw new Error( 'No players available.' );
        }
    }

}

module.exports = AVPlayerFactory;
