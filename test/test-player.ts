import { AvPlayerFactory, MediaPlayerName } from '../src/avplayer/av-player-factory';

const file = 'audio.mp3';
const dur = 4000;


const factory = new AvPlayerFactory();
factory.init( [ MediaPlayerName.omxplayer ] ).then( () => {

    const player = factory.createPlayer( file );
    player.on( 'stop', () => {

        factory.preferredOrder = [ MediaPlayerName.mplayer ];
        const player = factory.createPlayer( file );
        player.start();
        setTimeout( () => player.stop(), dur );
    } );

    player.start();
    setTimeout( () => player.stop(), dur );
} );
