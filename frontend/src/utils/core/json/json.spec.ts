import {Principal} from '@dfinity/principal';
import {describe, expect, it} from 'vitest';
import {jsonStringify} from './json';

describe('jsonStringify', () => {
    /**
     * PRIMITIVES
     */
    it('serializes string, number, boolean, null', () => {
        const out = jsonStringify({str: 'text', num: 42, bool: true, nil: null});
        const parsed = JSON.parse(out as string);
        expect(parsed).toEqual({str: 'text', num: 42, bool: true, nil: null});
    });

    it('serializes NaN and Infinity to null', () => {
        // JSON.stringify replaces NaN/Infinity with null
        const out = jsonStringify({nan: NaN, inf: Infinity});
        const parsed = JSON.parse(out as string);
        expect(parsed).toEqual({nan: null, inf: null});
    });

    it('handles undefined, functions and symbols in objects', () => {
        // undefined is replaced with null,
        // functions are stringified as "[Function]",
        // symbols are stringified as "Symbol(desc)"
        const out = jsonStringify({a: 1, b: undefined, c: () => {}, d: Symbol('s')});
        const parsed = JSON.parse(out as string);
        expect(parsed).toEqual({a: 1, c: '[Function]', d: 'Symbol(s)'});
    });

    it('handles top-level undefined, function, and symbol', () => {
        expect(jsonStringify(undefined)).toBeUndefined();
        expect(jsonStringify(function () {})).toBe('"[Function]"');
        expect(jsonStringify(Symbol('s'))).toBe('"Symbol(s)"');
    });

    /**
     * ARRAYS
     */
    it('serializes arrays and replaces unsupported values with null', () => {
        const arr = [1, 'a', true, null, undefined, NaN, Infinity];
        const out = jsonStringify(arr);
        const parsed = JSON.parse(out as string);
        // unsupported values become null inside arrays
        expect(parsed).toEqual([1, 'a', true, null, null, null, null]);
    });

    /**
     * BIGINT
     */
    it('serializes BigInt values to { type:"bigint", value:string }', () => {
        const out = jsonStringify({a: 1n, arr: [2n]});
        const parsed = JSON.parse(out as string);
        expect(parsed).toEqual({
            a: {type: 'bigint', value: '1'},
            arr: [{type: 'bigint', value: '2'}]
        });
    });

    it('serializes top-level BigInt', () => {
        expect(jsonStringify(123n)).toBe(JSON.stringify({type: 'bigint', value: '123'}));
    });

    /**
     * ERROR
     */
    it('serializes Error instances when serializeError is true', () => {
        const cause = new Error('cause');
        const err = new Error('boom', {cause});
        const out = jsonStringify({err}, undefined, {serializeError: true});
        const parsed = JSON.parse(out as string);

        expect(parsed.err.type).toBe('Error');
        expect(parsed.err.name).toBe(err.name);
        expect(parsed.err.message).toBe('boom');
        expect(typeof parsed.err.stack).toBe('string');
        expect(parsed.err.stack.length).toBeGreaterThan(0);

        // cause is also serialized as nested Error
        expect(parsed.err.cause).toBeDefined();
        expect(parsed.err.cause.type).toBe('Error');
        expect(parsed.err.cause.message).toBe('cause');
    });

    it('does not specially serialize Error when serializeError is false', () => {
        const err = new Error('nope');
        const out = jsonStringify({err}, undefined, {serializeError: false});
        const parsed = JSON.parse(out as string);
        // default JSON.stringify(Error) has no own enumerable props
        expect(parsed).toEqual({err: {}});
    });

    /**
     * DATE
     */
    it('serializes Date to ISO string', () => {
        const d = new Date('2020-01-02T03:04:05.678Z');
        const out = jsonStringify({d});
        const parsed = JSON.parse(out as string);
        expect(parsed.d).toBe(d.toJSON());
    });

    /**
     * MAP
     */
    it('serializes Map to {type:"Map", value:[entries]}', () => {
        const map = new Map<string, unknown>([
            ['a', 1],
            ['b', 'two'],
            ['c', {nested: true, big: 1n}]
        ]);
        const out = jsonStringify({map});
        const parsed = JSON.parse(out as string);
        expect(parsed.map).toEqual({
            type: 'Map',
            value: [
                ['a', 1],
                ['b', 'two'],
                ['c', {nested: true, big: {type: 'bigint', value: '1'}}]
            ]
        });
    });

    /**
     * SET
     */
    it('serializes Set to {type:"Set", value:[values]}', () => {
        const set = new Set([1, 'two', {nested: true, big: 1n}]);
        const out = jsonStringify({set});
        const parsed = JSON.parse(out as string);
        expect(parsed.set).toEqual({
            type: 'Set',
            value: [1, 'two', {nested: true, big: {type: 'bigint', value: '1'}}]
        });
    });

    /**
     * UINT8ARRAY
     */
    it('serializes Uint8Array to {type:"Uint8Array", value:[numbers]}', () => {
        const arr = new Uint8Array([1, 2, 3]);
        const out = jsonStringify({arr});
        const parsed = JSON.parse(out as string);
        expect(parsed.arr).toEqual({
            type: 'Uint8Array',
            value: [1, 2, 3]
        });
    });

    /**
     * BIGUINT64ARRAY
     */
    it('serializes BigUint64Array to {type:"BigUint64Array", value:[stringified bigints]}', () => {
        const arr = new BigUint64Array([1n, 2n, 3n]);
        const out = jsonStringify({arr});
        const parsed = JSON.parse(out as string);
        expect(parsed.arr).toEqual({
            type: 'BigUint64Array',
            value: ['1', '2', '3']
        });
    });

    /**
     * PRINCIPAL
     */
    it('serializes Principal to object with __principal__ key', () => {
        const p = Principal.anonymous();
        const out = jsonStringify({p});
        const parsed = JSON.parse(out as string);
        expect(parsed.p).toEqual({
            __principal__: '2vxsx-fae'
        });
    });

    /**
     * OPTIONS
     */
    it('respects space indentation', () => {
        const out = jsonStringify({a: 1, b: {c: 2}}, 2);
        expect(typeof out).toBe('string');
        expect(out as string).toMatch(/\n\s{2}"/);
    });

    /**
     * UNSERIALIZABLE
     */
    it('returns [Unserializable: ...] for cyclic structures', () => {
        const cyclic: any = {};
        cyclic.self = cyclic;

        const out = jsonStringify(cyclic);

        // cyclic structures cannot be serialized, should fall back
        expect(typeof out).toBe('string');
        expect(out).toMatch(/^\[Unserializable:/);
    });

    /**
     * COMPLEX OBJECT
     */
    it('serializes a deeply nested object with all supported types', () => {
        const complex = {
            str: 'hello',
            num: 123,
            bool: true,
            nil: null,
            nan: NaN,
            inf: Infinity,
            undef: undefined,
            fn: () => {},
            sym: Symbol('sym'),
            big: 42n,
            date: new Date('2021-01-01T00:00:00Z'),
            arr: [
                1,
                'a',
                new Set([1, 2n]),
                new Map<string, unknown>([
                    ['x', 1n],
                    ['y', new Uint8Array([7, 8])]
                ]),
                new BigUint64Array([3n, 4n]),
                new Error('nested error', {cause: new Error('inner cause')}),
                Principal.anonymous()
            ],
            nested: {
                set: new Set([new Map([['k', 99n]])]),
                map: new Map<string, unknown>([
                    ['a', new Set([1, 2, 3])],
                    ['b', new BigUint64Array([10n, 20n])],
                    /**
                     * deeply nested function
                     */
                    ['c', () => 'deep fn']
                ])
            }
        };

        const out = jsonStringify(complex, 2, {serializeError: true});
        const parsed = JSON.parse(out as string);

        // basic primitives
        expect(parsed.big).toEqual({type: 'bigint', value: '42'});
        expect(parsed.nan).toBeNull();
        expect(parsed.inf).toBeNull();
        expect(parsed.fn).toBe('[Function]');
        expect(parsed.sym).toBe('Symbol(sym)');
        expect(parsed.date).toBe('2021-01-01T00:00:00.000Z');

        // nested Set and Map inside array
        expect(parsed.arr[2]).toEqual({
            type: 'Set',
            value: [1, {type: 'bigint', value: '2'}]
        });
        expect(parsed.arr[3]).toEqual({
            type: 'Map',
            value: [
                ['x', {type: 'bigint', value: '1'}],
                ['y', {type: 'Uint8Array', value: [7, 8]}]
            ]
        });

        // BigUint64Array inside array
        expect(parsed.arr[4]).toEqual({
            type: 'BigUint64Array',
            value: ['3', '4']
        });

        // Error with nested cause
        expect(parsed.arr[5].type).toBe('Error');
        expect(parsed.arr[5].message).toBe('nested error');
        expect(parsed.arr[5].cause.type).toBe('Error');
        expect(parsed.arr[5].cause.message).toBe('inner cause');

        // Principal inside array
        expect(parsed.arr[6]).toEqual({__principal__: '2vxsx-fae'});

        // Map nested inside Set
        expect(parsed.nested.set).toEqual({
            type: 'Set',
            value: [
                {
                    type: 'Map',
                    value: [['k', {type: 'bigint', value: '99'}]]
                }
            ]
        });

        // Map with nested structures (including a function)
        expect(parsed.nested.map).toEqual({
            type: 'Map',
            value: [
                ['a', {type: 'Set', value: [1, 2, 3]}],
                ['b', {type: 'BigUint64Array', value: ['10', '20']}],
                ['c', '[Function]']
            ]
        });
    });
});
