import { IOs } from '../src/io/digital-input-overridable';

const rpio = require( 'rpio' );

export class RpioSimulator implements IOs {

    close( pin : number, reset : number ) : void {
        rpio.close( pin, reset );
    }

    open( pin : number, direction : number, pullup : number ) : void {
        rpio.open( pin, direction, pullup );
    }

    poll( pin : number, cb : ( pin : number ) => void, when : number ) : void {
        rpio.poll( pin, cb, when );

        const polls = this._polls.get( pin ) || [];
        polls.push( cb );
        this._polls.set( pin, polls );
    }

    read( pin : number ) : number {
        rpio.read( pin );

        if ( !this._pins.has( pin ) ) this._pins.set( pin, false );
        return this._pins.get( pin ) ? rpio.HIGH : rpio.LOW;
    }

    setPin( pin : number, high : boolean ) {
        this._pins.set( pin, high );
        if ( this._polls.has( pin ) ) {
            for ( let cb of this._polls.get( pin ) ) {
                cb( pin );
            }
        }
    }

    private _pins : Map<number, boolean> = new Map();
    private _polls : Map<number, ( ( pin : number ) => void )[]> = new Map();

}