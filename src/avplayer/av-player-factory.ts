import { OmxPlayer } from './omx-player';
import { MPlayer } from './m-player';
import { VlcPlayer } from './vlc-player';
import { AbstractPlayer } from './abstract-player';

export enum MediaPlayerName {
    vlc = 'vlc',
    cvlc = 'cvlc',
    mplayer = 'mplayer',
    omxplayer = 'omxplayer',
}

const EventEmitter = require( 'events' );

/**
 * Creates an A/V player.
 */
export class AvPlayerFactory extends EventEmitter {

    private _availableFactories : any;

    constructor() {
        super();

        this._availableFactories = [];
    }

    /**
     * Initialise the factory; test which players are available.
     *
     * @param preferredOrder See #preferredOrder
     */
    init( preferredOrder? : MediaPlayerName[] ) : Promise<void> {
        const name = 'AvPlayerFactory';

        const vlcCheck = VlcPlayer.checkAvailability().then(
            () => {
                console.log( name + ': ✓ cvlc is available.' );
                this._availableFactories.push( VlcPlayer );
            },
            () => console.log( name + ': ✗ cvlc not available.' )
        );

        const omxCheck = OmxPlayer.checkAvailability().then(
            () => {
                this._availableFactories.push( OmxPlayer );
                console.log( name + ': ✓ omxplayer is available.' );
            },
            () => console.log( name + ': ✗ omxplayer not available.' )
        );

        const mplayerCheck = MPlayer.checkAvailability().then(
            () => {
                this._availableFactories.push( MPlayer );
                console.log( name + ': ✓ mplayer is available.' );
            },
            () => console.log( name + ': ✗ mplayer not available.' )
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
     */
    set preferredOrder( order : MediaPlayerName[] ) {
        if ( !( order instanceof Array ) ) return;
        const factoriesInOrder = order.map( name => {
            switch ( name ) {
                case MediaPlayerName.mplayer:
                    return MPlayer;
                case MediaPlayerName.omxplayer:
                    return OmxPlayer;
                case MediaPlayerName.vlc:
                case MediaPlayerName.vlc:
                    return VlcPlayer;
                default:
                    return undefined;
            }
        } );
        this._availableFactories = factoriesInOrder
            .filter( player => this._availableFactories.includes( player ) )
            .concat( this._availableFactories.filter( ( factory : any ) => !factoriesInOrder.includes( factory ) ) );
    }

    createPlayer( file : string ) : AbstractPlayer {
        if ( this._availableFactories.length > 0 ) {
            return new this._availableFactories[ 0 ]( file );
        } else {
            throw new Error( 'No players available.' );
        }
    }

}
