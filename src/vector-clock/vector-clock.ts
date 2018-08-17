const EventEmitter = require( 'events' );
const check = require( 'check-types' );

/**
 * Simple implementation of a vector clock.
 *
 * Events:
 * - `new-time` when the time of any member changed
 * - `time` when the time of the owner was changed by a client (may be renamed in future)
 */
export class VectorClock extends EventEmitter {

    private readonly _ownId : string;
    private _clock : Map<string, number>;

    constructor( data : { owner : string, time? : any[] } ) {
        super();

        this._clock = new Map();

        if ( check.not.object( data ) ) throw new Error( 'Must pass either an ID (string) or an object to construct a vector clock' );
        if ( check.not.string( data.owner ) ) throw new Error( 'owner is required when constructing from object' );

        const ownId = data.owner;

        if ( check.array( data.time ) ) {
            data.time.forEach( t => {
                if ( check.not.string( t.id ) ) throw new Error( `time vector IDs must be strings: {id:string,t:number}[]. Received ${JSON.stringify( t )}` );
                if ( check.not.number( t.time ) ) throw new Error( `time vector times must be numbers: {id:string,t:number}[]. Received ${JSON.stringify( t )}` );
                this.updateOther( t.id, t.time );
            } );
        }

        this._ownId = ownId;

        if ( !this._clock.has( ownId ) ) {
            this._clock.set( ownId, 0 );
        }
    }

    get id() : string {
        return this._ownId;
    }

    get time() : number {
        return this._clock.get( this._ownId );
    }

    set time( time : number ) {
        this._clock.set( this._ownId, time );
    }

    get timestamps() : { id : string, time : number }[] {
        const timestamps : { id : string, time : number }[] = [];
        this._clock.forEach( ( v, k ) => timestamps.push( { id: k, time: v } ) );
        return timestamps;
    }

    get json() {
        return {
            owner: this._ownId,
            time: this.timestamps,
        };
    }

    nextTick() {
        this._clock.set( this._ownId, this._clock.get( this._ownId ) + 1 );
        this._newTime();
        return this;
    }

    newerThan( other : VectorClock ) {
        let newer = 0;
        let newerOrEqual = 0;
        this._clock.forEach( ( v, k ) => {
            newer += Number( v > other.timeOf( k ) );
            newerOrEqual += Number( v >= other.timeOf( k ) );
        } );
        const knowsAll = other.timestamps.every( timestamp => this._clock.has( timestamp.id ) );
        return knowsAll && newerOrEqual > 0 && newer > 0;
    }

    /**
     * @param otherClock
     * @returns true, if this clock holds information about the owner of another clock.
     */
    knowsOwnerOf( otherClock : VectorClock ) : boolean {
        return this._clock.has( otherClock.id );
    }

    /**
     * Only checks the timestamp of this clock's owner, ignores all other timestamps
     */
    ownTimestampNewerThan( other : VectorClock ) : boolean {
        return this.time > other.time;
    }

    /**
     * Integrate vector time of other into own time (update timestamps of all clients)
     * @param other
     * @param canUpdateMyTime Set to true if other clocks can update the time of this clock.
     * This is useful e.g. if the owner of this clock could go offline and lose the current time, so it is recovered.
     */
    syncFrom( other : VectorClock, canUpdateMyTime : boolean = false ) {
        let changes = 0;
        const errors : string[] = [];

        other.timestamps.forEach( time => {
            if ( time.id !== this._ownId ) {
                let changed = this.updateOther( time.id, time.time );
                if ( changed ) changes++;
            } else {
                if ( time.time > this.time ) {
                    if ( canUpdateMyTime ) {
                        this.time = time.time;
                        changes++;
                        this._ownClockUpdated();
                    } else {
                        errors.push( 'Client thinks my time is newer' );
                    }
                }
            }
        } );
        if ( errors.length > 0 ) {
            throw new Error( errors.join( ',' ) );
        }
        if ( changes ) {
            this._newTime();
        }
        return this;
    }

    timeOf( id : string ) : number {
        return this._clock.get( id );
    }

    toString() : string {
        const times = [ `{Vector Clock for ${this._ownId}}` ];
        this._clock.forEach( ( v, k ) => times.push( `  ${v} : ${k}${k === this._ownId ? ' (self)' : ''}` ) );
        return times.join( '\n' );
    }

    updateOther( id : string, time : number ) {
        if ( id === this._ownId ) throw new Error( 'Other client has same ID: ' + id );
        if ( check.not.string( id ) ) throw new Error( 'Client ID must be a string. Received: ' + id );
        if ( check.not.greaterOrEqual( time, 0 ) ) throw new Error( `Time for client ${id} must be a number > 0` );

        const currentTime = this._clock.get( id ) || 0;
        const changed = currentTime !== time;

        this._clock.set( id, Math.max( currentTime, time ) );

        return changed;
    }

    _ownClockUpdated() {
        setImmediate( () => this.emit( 'time' ) );
    }

    _newTime() {
        setImmediate( () => this.emit( 'new-time' ) );
    }
}
