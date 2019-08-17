import { DigitalOutputOverridable, OutputInversion } from '../src/io/digital-output-overridable';

const rpio = require( 'rpio' );

describe( 'Digital overridable output', () => {

    let output : DigitalOutputOverridable;

    beforeEach( () => {
        output = new DigitalOutputOverridable( {
            outputInversion: OutputInversion.OnIsHigh,
            pin: 10,
        } );
    } );

    afterEach( () => {
        output.close();
    } );

    it( 'starts uninitialised', () => {
        expect( output.enabled ).not.toBeDefined();
    } );

    it( 'is enabled after enabling', () => {
        output.enabled = true;
        expect( output.enabled ).toBe( true );
    } );

    it( 'is disabled after disabling', () => {
        output.enabled = false;
        expect( output.enabled ).toBe( false );
    } );

    it( 'writes LOW and HIGH correctly when not inverted', () => {
        output.enabled = false;
        expect( output.lastWrittenRpioState ).toBe( rpio.LOW, 'Should be LOW when disabled' );
        output.enabled = true;
        expect( output.lastWrittenRpioState ).toBe( rpio.HIGH, 'Should be HIGH when enabled' );
    } );

    it( 'writes LOW and HIGH correctly when inverted', () => {
        const invertedOutput = new DigitalOutputOverridable( {
            pin: 11,
            outputInversion: OutputInversion.OnIsLow,
        } );

        invertedOutput.enabled = false;
        expect( invertedOutput.lastWrittenRpioState ).toBe( rpio.HIGH, 'Should be HIGH when disabled' );
        invertedOutput.enabled = true;
        expect( invertedOutput.lastWrittenRpioState ).toBe( rpio.LOW, 'Should be LOW when enabled' );

        invertedOutput.close();
    } );

    describe( 'Override mode', () => {

        it( 'defaults to false', () => {
            output.enabled = true;
            output.overrideMode = true;
            expect( output.enabled ).toBe( false );
        } );

    } );

    describe( 'Events', () => {

        it( 'emits event on first write', ( done ) => {
            output.onChange( ( data ) => {
                expect( data.enabled ).toBe( true );
                done();
            } );
            output.enabled = true;
        }, 100 );

        it( 'emits event when overriding true to false', ( done ) => {
            let run = 0;
            output.onChange( ( data ) => {
                if ( run === 0 ) {
                    expect( data.enabled ).toBe( true );
                } else {
                    expect( data.enabled ).toBe( false );
                    done();
                }
                run++;
            } );

            output.enabled = true;
            output.overrideOutputEnabled = false;
            output.overrideMode = true;
        }, 100 );

        it( 'emits event when overriding false to true', ( done ) => {
            let run = 0;
            output.onChange( ( data ) => {
                if ( run === 0 ) {
                    expect( data.enabled ).toBe( false );
                } else {
                    expect( data.enabled ).toBe( true );
                    done();
                }
                run++;
            } );

            output.enabled = false;
            output.overrideOutputEnabled = true;
            output.overrideMode = true;
        }, 100 );

        it( 'emits event when overriding, and ', ( done ) => {
            let run = 0;
            output.onChange( ( data ) => {
                if ( run === 0 ) {
                    expect( data.enabled ).toBe( false );
                    expect( data.overrideMode ).toBe( false );
                } else {
                    expect( data.enabled ).toBe( true );
                    expect( data.overrideMode ).toBe( true );
                    done();
                }
                run++;
            } );

            output.enabled = false;
            output.overrideMode = true;
            output.overrideOutputEnabled = true;
        }, 100 );


    } );

} );
