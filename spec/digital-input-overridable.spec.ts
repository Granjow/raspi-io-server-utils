import { RpioSimulator } from './rpio-simulator';
import { DigitalInputOverridable, InputInversion, PullupMode } from '../src/io/digital-input-overridable';

const rpio = require( 'rpio' );
rpio.init( { mock: 'raspi-3' } );

describe( 'Digital Overridable Input', () => {


    let input : DigitalInputOverridable;
    let inputSim : RpioSimulator;

    beforeEach( () => {
        inputSim = new RpioSimulator();
        DigitalInputOverridable.rpio = inputSim;
    } );

    afterEach( () => {
        try {
            if ( input ) input.close();
        } catch ( e ) {
            console.error( e );
        }
    } );

    describe( 'basics', () => {

        it( 'can be initialised', () => {
            expect( () => input = new DigitalInputOverridable( { pin: 12 } ) ).not.toThrow();
        } );

        it( 'fails to initialise with incorrect GPIO number', () => {
            expect( () => input = new DigitalInputOverridable( { pin: 1 } ) ).toThrow();
        } );

        it( 'emits a change event after first read', ( done ) => {
            input = new DigitalInputOverridable( {
                pin: 12,
                inputInversion: InputInversion.HighIsOn,
                pullupMode: PullupMode.OFF,
            } );
            input.onChange( ( data ) => {
                expect( data.enabled ).toBe( false );
                done();
            } );
            input.read();
        } );

        it( 'emits events on changes', ( done ) => {
            const inputStates = [ true, false, true, true, false, false, true ];
            const outputStates = [ true, false, true, false, true ];

            input = new DigitalInputOverridable( {
                pin: 12,
                inputInversion: InputInversion.HighIsOn,
                pullupMode: PullupMode.OFF,
            } );

            let c = 0;
            input.onChange( ( data ) => {
                expect( data.enabled ).toBe( outputStates[ c ] );
                c++;
                if ( c >= outputStates.length ) done();
            } );

            for ( let state of inputStates ) {
                inputSim.setPin( 12, state );
            }

        } )

    } );

    describe( 'Input inversion', () => {

        it( 'can invert input signals', ( done ) => {
            input = new DigitalInputOverridable( {
                pin: 13,
                pullupMode: PullupMode.OFF,
                inputInversion: InputInversion.LowIsOn,
            } );

            let c = 0;
            input.onChange( ( data ) => {
                if ( c === 0 ) {
                    expect( data.enabled ).toBe( true );
                    c++;
                } else {
                    expect( data.enabled ).toBe( false );
                    done();

                }
            } );
            inputSim.setPin( 13, false );
            inputSim.setPin( 13, true );
        } );

    } );

    describe( 'Override mode', () => {

        it( 'emits a change event when enabling override mode for the first time', ( done ) => {
            input = new DigitalInputOverridable( {
                pin: 12,
                pullupMode: PullupMode.OFF,
                inputInversion: InputInversion.HighIsOn,
            } );

            input.onChange( ( data ) => {
                expect( data.physical ).toBe( undefined );
                expect( data.overrideMode ).toBe( true );
                expect( data.enabled ).toBe( false );
                done();
            } );

            input.overrideMode = true;
        } );

        it( 'emits a change event when enabling override mode for the first time', ( done ) => {
            input = new DigitalInputOverridable( {
                pin: 12,
                pullupMode: PullupMode.OFF,
                inputInversion: InputInversion.HighIsOn,
            } );

            input.onChange( ( data ) => {
                expect( data.physical ).toBe( undefined );
                expect( data.overrideMode ).toBe( true );
                expect( data.enabled ).toBe( true );
                done();
            } );

            input.overrideToEnabled = true;
            input.overrideMode = true;
        } );

        it( 'emits a change event when override enable changes', ( done ) => {
            input = new DigitalInputOverridable( {
                pin: 12,
                pullupMode: PullupMode.OFF,
                inputInversion: InputInversion.HighIsOn,
            } );

            let c = 0;
            input.onChange( ( data ) => {
                if ( c === 0 ) {
                    expect( data.physical ).toBe( undefined );
                    expect( data.overrideMode ).toBe( true );
                    expect( data.enabled ).toBe( false, 'Enabled should be false on the first event' );
                } else {
                    expect( data.physical ).toBe( undefined );
                    expect( data.overrideMode ).toBe( true );
                    expect( data.enabled ).toBe( true, 'Enabled should be true on the second event' );
                    done();
                }
                c++;
            } );

            input.overrideMode = true;
            input.overrideToEnabled = true;
        } );

    } );

    describe( 'Status', () => {
        it( 'reports enabled status correctly', ( done ) => {

            input = new DigitalInputOverridable( {
                pin: 11,
            } );

            let c = 0;
            input.onChange( ( data ) => {
                switch ( c ) {
                    case 0:
                        expect( data.enabled ).toBe( true );
                        expect( data.overrideMode ).toBe( false );
                        break;
                    case 1:
                        expect( data.enabled ).toBe( false );
                        expect( data.overrideMode ).toBe( false );
                        break;
                    case 2:
                        expect( data.enabled ).toBe( true );
                        expect( data.overrideMode ).toBe( true );
                        done();
                        break;
                    default:
                        throw new Error( 'Unhandled event' );
                }
                c++;
            } );

            inputSim.setPin( 11, true );
            inputSim.setPin( 11, false );
            input.overrideToEnabled = true;
            input.overrideMode = true;

        } );

    } );

} );
