import { VectorClock } from '../src/vector-clock/vector-clock';

describe( 'Vector clock', () => {
    it( 'can be created', () => {
        expect( () => new VectorClock( { owner: 'a' } ) ).not.toThrow();
    } );
    it( 'can be created with time vector', () => {
        expect( () => new VectorClock( { owner: 'a', time: [ { id: 'a', time: 4 } ] } ) ).not.toThrow();
    } );
    it( 'throws an error for invalid ID', () => {
        expect( () => new VectorClock( {} as any ) ).toThrow();
    } );
    it( 'throws an error for invalid time', () => {
        expect( () => new VectorClock( { owner: 'a', time: [ 1, 'a' ] } as any ) ).toThrow();
    } );
    it( 'increases its time on tick', () => {
        const c = new VectorClock( { owner: 'a' } );
        expect( c.time ).toBe( 0 );

        c.nextTick();
        expect( c.time ).toBe( 1 );
    } );
} );

describe( 'Events', () => {

    let a : VectorClock, b : VectorClock, c : VectorClock;

    beforeEach( () => {
        a = new VectorClock( { owner: 'a' } );
        b = new VectorClock( { owner: 'b' } );
        c = new VectorClock( { owner: 'c' } );
    } );

    it( 'fires on tick', ( done ) => {
        a.on( 'new-time', () => {
            done();
        } );
        a.nextTick();
    }, 100 );

    it( 'fires on sync', ( done ) => {
        a.on( 'new-time', () => {
            done();
        } );
        b.nextTick();
        a.syncFrom( b );
    }, 100 );

} );

describe( 'Synchronisation', () => {

    let a : VectorClock, b : VectorClock, c : VectorClock;

    beforeEach( () => {
        a = new VectorClock( { owner: 'a' } );
        b = new VectorClock( { owner: 'b' } );
        c = new VectorClock( { owner: 'c' } );
    } );

    it( 'uses newest timestamps', () => {
        a.nextTick().nextTick().nextTick();
        b.nextTick().nextTick();
        c.nextTick();

        a.syncFrom( b ).syncFrom( c );

        expect( a.time ).toBe( 3 );
        expect( a.timeOf( 'b' ) ).toBe( 2 );
        expect( a.timeOf( 'c' ) ).toBe( 1 );
    } );

    it( 'throws error when client thinks owner is newer', () => {
        a.syncFrom( b );
        b.syncFrom( a );

        b.updateOther( 'a', 2 );

        expect( () => a.syncFrom( b ) ).toThrow();
    } );
    it( 'can recover own time when syncing', ( done ) => {
        a.syncFrom( b );
        b.syncFrom( a );

        b.updateOther( 'a', 2 );

        a.on( 'time', () => {
            expect( a.time ).toBe( 2 );
            done();
        } );

        expect( () => a.syncFrom( b, true ) ).not.toThrow();
        expect( a.time ).toBe( 2 );
    }, 100 );
} );

describe( 'Time comparison', () => {
    it( 'recognizes newer timestamps', () => {
        const c1 = new VectorClock( { owner: 'a' } );
        const c2 = new VectorClock( { owner: 'b' } );

        c1.syncFrom( c2 );
        c2.syncFrom( c1 );


        expect( c1.newerThan( c2 ) ).toBe( false, 'Equal timestamps should ' );
        c1.nextTick();
        expect( c1.newerThan( c2 ) ).toBe( true, 'C is newer after one tick' );
    } );
    it( 'detects when timestamps are not newer', () => {
        const c1 = new VectorClock( { owner: 'a' } );
        const c2 = new VectorClock( { owner: 'b' } );

        c1.nextTick();

        expect( c1.newerThan( c2 ) ).toBe( false, 'Not newer until synced' );
    } );
    it( 'considers unsynced clients', () => {
        const a = new VectorClock( { owner: 'a' } );
        const b = new VectorClock( { owner: 'b' } );
        const c = new VectorClock( { owner: 'c' } );

        // c knows about a
        c.syncFrom( a );
        // a knows about b and c
        a.syncFrom( b ).syncFrom( c );
        // b knows about a and c
        b.syncFrom( a );

        // Event on c: not newer than a
        c.nextTick();
        expect( c.newerThan( a ) ).toBe( false, 'c does not know about b' );
        expect( c.ownTimestampNewerThan( a ) ).toBe( true, 'Is newer when ignoring all other timestamps' );
        expect( a.ownTimestampNewerThan( c ) ).toBe( false );

        // Event on b: newer than a
        b.nextTick();
        expect( b.newerThan( a ) ).toBe( true, 'b knows about a and c and happened afterwards' );
    } );
} );

describe( 'Stringify', () => {
    it( 'works for an empty clock', () => {
        const a = new VectorClock( { owner: 'a' } );
        expect( () => a.toString() ).not.toThrow();
    } );
} );

describe( 'Owners of other clocks', () => {
    it( 'is unknown before syncing', () => {
        const a = new VectorClock( { owner: 'a' } );
        const b = new VectorClock( { owner: 'b' } );

        expect( a.knowsOwnerOf( b ) ).toBe( false );
        expect( b.knowsOwnerOf( a ) ).toBe( false );
    } );
    it( 'is known after syncing', () => {
        const a = new VectorClock( { owner: 'a' } );
        const b = new VectorClock( { owner: 'b' } );

        a.syncFrom( b );

        expect( a.knowsOwnerOf( b ) ).toBe( true );
        expect( b.knowsOwnerOf( a ) ).toBe( false );

        b.syncFrom( a );
        expect( b.knowsOwnerOf( a ) ).toBe( true );
    } );
} );
