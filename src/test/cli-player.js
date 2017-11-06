const AVPlayer = require( '../avplayer/avplayer' );

console.log( `Looping file ${process.argv[ 2 ]}` );

const player = new AVPlayer();
player.loop = true;
player.on( 'ready', () => {
    player.play( process.argv[ 2 ] );
} );