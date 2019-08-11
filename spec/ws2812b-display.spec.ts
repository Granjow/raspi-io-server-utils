import { Ws2812bDisplay } from '../src/libs/ws2812b-display';

describe( 'WS2812b display', () => {
    it( 'initialises with BCM 18 as default pin', () => {
        const ws = new Ws2812bDisplay( { length: 10 } );
        expect( ws.gpioPin ).toBe( 18 );
    } );
} );
