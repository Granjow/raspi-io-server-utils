const VectorClock = require( '../src/vector-clock/vector-clock' );

describe( 'Vector clock', () => {
    it( 'can be created', () => {
        expect( () => new VectorClock( 'a' ) ).not.toThrow();
    } );
    it( 'throws an error for invalid ID', () => {
        expect( () => new VectorClock( {} ) ).toThrow();
    } );
    it( 'increases its time on tick', () => {
        const c = new VectorClock( 'a' );
        expect( c.time ).toBe( 0 );

        c.nextTick();
        expect( c.time ).toBe( 1 );
    } );
} );

describe( 'Synchronisation', () => {
    it( 'uses newest timestamps', () => {
        const a = new VectorClock( 'a' );
        const b = new VectorClock( 'b' );
        const c = new VectorClock( 'c' );

        a.nextTick().nextTick().nextTick();
        b.nextTick().nextTick();
        c.nextTick();

        a.syncFrom( b ).syncFrom( c );

        expect( a.time ).toBe( 3 );
        expect( a.timeOf( 'b' ) ).toBe( 2 );
        expect( a.timeOf( 'c' ) ).toBe( 1 );
    } );
} );

describe( 'Time comparison', () => {
    it( 'recognizes newer timestamps', () => {
        const c1 = new VectorClock( 'a' );
        const c2 = new VectorClock( 'b' );

        c1.syncFrom( c2 );
        c2.syncFrom( c1 );


        expect( c1.newerThan( c2 ) ).toBe( false, 'Equal timestamps should ' );
        c1.nextTick();
        expect( c1.newerThan( c2 ) ).toBe( true, 'C is newer after one tick' );
    } );
    it( 'detects when timestamps are not newer', () => {
        const c1 = new VectorClock( 'a' );
        const c2 = new VectorClock( 'b' );

        c1.nextTick();

        expect( c1.newerThan( c2 ) ).toBe( false, 'Not newer until synced' );
    } );
    it( 'considers unsynced clients', () => {
        const a = new VectorClock( 'a' );
        const b = new VectorClock( 'b' );
        const c = new VectorClock( 'c' );

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
        const a = new VectorClock( 'a' );
        expect( () => a.toString() ).not.toThrow();
    } );
} );
