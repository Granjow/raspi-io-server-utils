This package contains useful classes for the Raspberry Pi.
TypeScript support included.

Changes: See [CHANGELOG.md](CHANGELOG.md).


## Usage

ES6 example:

```js
// JavaScript
const { DigitalInput, DigitalOutput } = require( 'raspi-io-server-utils' );

// TypeScript
import { DigitalOutput } from 'raspi-io-server-utils/dist/src/io/digital-output';
import { DigitalInput } from 'raspi-io-server-utils/dist/src/io/digital-input';

const input = new DigitalInput( 11 );
const output = new DigitalOutput( 13 );

input.on( 'enable', () => {
    output.enabled = !output.enabled;
} );
```


## AVPlayer

Starts audio/video files with VLC, mplayer, or omxplayer, whatever is available.

```typescript
import { AvPlayer } from 'raspi-io-server-utils/dist/src/avplayer/av-player';

const player = new AvPlayer( [ 'vlc', 'omxplayer' ] );
player.play( 'movie.mp3' ).catch(
    ( err ) => console.error( 'Playback error', err )
);
```


## IO

An extension to [rpio](https://www.npmjs.com/package/rpio) with events on digital input/output pins
and status report as JSON.

Note: Newer rpio and kernel combinations may cause freezes when hooking up interrupts.
See [4.14 freezes when GPIO is pulled high](https://github.com/raspberrypi/linux/issues/2550)
and add `dtoverlay=gpio-no-irq` to `/boot/config.txt` for a workaround.

## Vector clock

Small class implementing a [Vector Clock](https://en.wikipedia.org/wiki/Vector_clock) for ordering asynchronous events.
