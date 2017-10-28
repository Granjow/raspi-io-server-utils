const EventEmitter = require( 'events' );
const check = require( 'check-types' );

/**
 * Simple implementation of a vector clock.
 *
 * Events:
 * - `new-time` when the time of any member changed
 * - `time` when the time of the owner was changed by a client (may be renamed in future)
 */
class VectorClock extends EventEmitter {

    /**
     * @param {string|{owner: string, time: Array}} data
     */
    constructor( data ) {
        super();

        /** @type {Map.<string,number>} */
        this._clock = new Map();

        let ownId;
        if ( check.string( data ) ) {
            ownId = data;
        } else {
            if ( check.not.object( data ) ) throw new Error( 'Must pass either an ID (string) or an object to construct a vector clock' );
            if ( check.not.string( data.owner ) ) throw new Error( 'owner is required when constructing from object' );
            if ( check.not.array( data.time ) ) throw new Error( 'time vector is required when constructing from object' );

            ownId = data.owner;
            data.time.forEach( t => {
                this.updateOther( t.id, t.time );
            } );
        }

        /** @type {string} */
        this._ownId = ownId;

        if ( !this._clock.has( ownId ) ) {
            this._clock.set( ownId, 0 );
        }
    }

    get id() {
        return this._ownId;
    }

    /**
     * @returns {number}
     */
    get time() {
        return this._clock.get( this._ownId );
    }

    /**
     * @param {number} time
     */
    set time( time ) {
        return this._clock.set( this._ownId, time );
    }

    /**
     * @returns {{id:string, time: number}[]}
     */
    get timestamps() {
        const timestamps = [];
        this._clock.forEach( ( v, k ) => timestamps.push( { id: k, time: v } ) );
        return timestamps;
    }

    get json() {
        return {
            time: this.timestamps,
            owner: this._ownId
        };
    }

    nextTick() {
        this._clock.set( this._ownId, this._clock.get( this._ownId ) + 1 );
        this._newTime();
        return this;
    }

    /**
     * @param {VectorClock} other
     */
    newerThan( other ) {
        let newer = 0;
        let newerOrEqual = 0;
        this._clock.forEach( ( v, k ) => {
            newer += v > other.timeOf( k );
            newerOrEqual += v >= other.timeOf( k );
        } );
        const knowsAll = other.timestamps.every( timestamp => this._clock.has( timestamp.id ) );
        return knowsAll && newerOrEqual > 0 && newer > 0;
    }

    /**
     * @param {VectorClock} otherClock
     * @returns {boolean} true, if this clock holds information about the owner of another clock.
     */
    knowsOwnerOf( otherClock ) {
        return this._clock.has( otherClock.id );
    }

    /**
     * Only checks the timestamp of this clock's owner, ignores all other timestamps
     * @param {VectorClock} other
     */
    ownTimestampNewerThan( other ) {
        return this.time > other.time;
    }

    /**
     * Integrate vector time of other into own time (update timestamps of all clients)
     * @param {VectorClock} other
     * @param {boolean=} canUpdateMyTime Set to true if other clocks can update the time of this clock.
     * This is useful e.g. if the owner of this clock could go offline and lose the current time, so it is recovered.
     */
    syncFrom( other, canUpdateMyTime ) {
        let changes = 0;
        const errors = [];

        other.timestamps.forEach( time => {
            if ( time.id !== this._ownId ) {
                let changed = this.updateOther( time.id, time.time );
                if (changed) changes++;
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
        if (changes) {
            this._newTime();
        }
        return this;
    }

    timeOf( id ) {
        return this._clock.get( id );
    }

    toString() {
        const times = [ `{Vector Clock for ${this._ownId}}` ];
        this._clock.forEach( ( v, k ) => times.push( `  ${v} : ${k}${k === this._ownId ? ' (self)' : ''}` ) );
        return times.join( '\n' );
    }

    updateOther( id, time ) {
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

module.exports = VectorClock;
