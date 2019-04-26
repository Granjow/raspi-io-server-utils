import { MediaPlayerName } from '../src/avplayer/av-player-factory';
import { AvPlayer } from '../src/avplayer/av-player';

const file = 'audio.mp3';

const player = new AvPlayer( [ MediaPlayerName.mplayer ] );
player.on( 'ready', () => {
    player.on( 'error', ( err : any ) => console.error( err ) );
    player.loop = true;
    player.play( file )
        .catch( ( err ) => console.error( 'Playback error\n', err ) );
} );