import { AvPlayer } from '../avplayer/av-player';

console.log( `Looping file ${process.argv[ 2 ]}` );

const player = new AvPlayer();
player.loop = true;
player.on( 'ready', () => {
    player.play( process.argv[ 2 ] );
} );