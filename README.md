This package contains useful classes for the Raspberry Pi.

## AVPlayer

Starts audio/video files with VLC, mplayer, or omxplayer, whatever is available.

## IO

An extension to [rpio](https://www.npmjs.com/package/rpio) with events on digital input/output pins
and status report as JSON.

Note: Newer rpio and kernel combinations may cause freezes when hooking up interrupts.
See [4.14 freezes when GPIO is pulled high](https://github.com/raspberrypi/linux/issues/2550)
and add `dtoverlay=gpio-no-irq` to `/boot/config.txt` for a workaround.

## Vector clock

Small class implementing a [Vector Clock](https://en.wikipedia.org/wiki/Vector_clock) for ordering asynchronous events.
