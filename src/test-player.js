const PlayerFactory = require( './avplayer/av-player-factory' );

const file = 'audio.mp3';
const dur = 4000;


const factory = new PlayerFactory();
factory.init( [ 'omxplayer' ] ).then( () => {

    const player = factory.createPlayer( file );
    player.on( 'stop', () => {

        factory.preferredOrder = [ 'mplayer' ];
        const player = factory.createPlayer( file );
        player.start();
        setTimeout( () => player.stop(), dur );
    } );

    player.start();
    setTimeout( () => player.stop(), dur );
} );
