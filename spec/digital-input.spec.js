const DigitalInput = require( '../src/io/digital-input' );

describe( 'Digital Input', () => {
    it( 'can be constructed', () => {
        expect( () => new DigitalInput( 7 ) ).not.toThrow();
    } );
} );