import {Principal} from '@dfinity/principal';
import {describe, expect, it} from 'vitest';
import {jsonStringify} from './json';

describe('jsonStringify', () => {
    describe('primitives', () => {
        it('serializes string, number, boolean, null', () => {
            const parsed = JSON.parse(jsonStringify({str: 'text', num: 42, bool: true, nil: null}) as string);
            expect(parsed).toEqual({str: 'text', num: 42, bool: true, nil: null});
        });

        it('serializes NaN and Infinity to null', () => {
            const parsed = JSON.parse(jsonStringify({nan: NaN, inf: Infinity}) as string);
            expect(parsed).toEqual({nan: null, inf: null});
        });

        it('serializes undefined in object as omitted key', () => {
            const parsed = JSON.parse(jsonStringify({a: 1, b: undefined}) as string);
            expect(parsed).toEqual({a: 1});
        });

        it('serializes function in object as "[Function]"', () => {
            const parsed = JSON.parse(jsonStringify({fn: () => {}}) as string);
            expect(parsed).toEqual({fn: '[Function]'});
        });

        it('serializes symbol in object as "Symbol(desc)"', () => {
            const parsed = JSON.parse(jsonStringify({sym: Symbol('s')}) as string);
            expect(parsed).toEqual({sym: 'Symbol(s)'});
        });

        it('returns undefined for top-level undefined', () => {
            expect(jsonStringify(undefined)).toBeUndefined();
        });

        it('serializes top-level function as "[Function]"', () => {
            expect(jsonStringify(function () {})).toBe('"[Function]"');
        });

        it('serializes top-level symbol as "Symbol(desc)"', () => {
            expect(jsonStringify(Symbol('s'))).toBe('"Symbol(s)"');
        });
    });

    describe('arrays', () => {
        it('replaces unsupported values (undefined, NaN, Infinity) with null', () => {
            const parsed = JSON.parse(jsonStringify([1, 'a', true, null, undefined, NaN, Infinity]) as string);
            expect(parsed).toEqual([1, 'a', true, null, null, null, null]);
        });
    });

    describe('BigInt', () => {
        it('serializes BigInt to {type:"bigint", value:string}', () => {
            const parsed = JSON.parse(jsonStringify({a: 1n, arr: [2n]}) as string);
            expect(parsed).toEqual({
                a: {type: 'bigint', value: '1'},
                arr: [{type: 'bigint', value: '2'}]
            });
        });

        it('serializes top-level BigInt', () => {
            expect(jsonStringify(123n)).toBe(JSON.stringify({type: 'bigint', value: '123'}));
        });
    });

    describe('Error', () => {
        it('serializes Error with cause when serializeError is true', () => {
            const cause = new Error('cause');
            const err = new Error('boom', {cause});
            const parsed = JSON.parse(jsonStringify({err}, undefined, {serializeError: true}) as string);

            expect(parsed.err.type).toBe('Error');
            expect(parsed.err.name).toBe(err.name);
            expect(parsed.err.message).toBe('boom');
            expect(typeof parsed.err.stack).toBe('string');
            expect(parsed.err.stack.length).toBeGreaterThan(0);
            expect(parsed.err.cause.type).toBe('Error');
            expect(parsed.err.cause.message).toBe('cause');
        });

        it('does not specially serialize Error when serializeError is false', () => {
            const parsed = JSON.parse(jsonStringify({err: new Error('nope')}, undefined, {serializeError: false}) as string);
            expect(parsed).toEqual({err: {}});
        });

        it('does not specially serialize Error when options are not provided', () => {
            const parsed = JSON.parse(jsonStringify({err: new Error('nope')}) as string);
            expect(parsed).toEqual({err: {}});
        });
    });

    describe('special types', () => {
        it('serializes Date to ISO string', () => {
            const d = new Date('2020-01-02T03:04:05.678Z');
            const parsed = JSON.parse(jsonStringify({d}) as string);
            expect(parsed.d).toBe(d.toJSON());
        });

        it('serializes Map to {type:"Map", value:[entries]}', () => {
            const map = new Map<string, unknown>([
                ['a', 1],
                ['b', 'two'],
                ['c', {nested: true, big: 1n}]
            ]);
            const parsed = JSON.parse(jsonStringify({map}) as string);
            expect(parsed.map).toEqual({
                type: 'Map',
                value: [
                    ['a', 1],
                    ['b', 'two'],
                    ['c', {nested: true, big: {type: 'bigint', value: '1'}}]
                ]
            });
        });

        it('serializes Set to {type:"Set", value:[values]}', () => {
            const set = new Set([1, 'two', {nested: true, big: 1n}]);
            const parsed = JSON.parse(jsonStringify({set}) as string);
            expect(parsed.set).toEqual({
                type: 'Set',
                value: [1, 'two', {nested: true, big: {type: 'bigint', value: '1'}}]
            });
        });

        it.each([
            {
                label: 'Uint8Array',
                input: new Uint8Array([1, 2, 3]),
                expected: {type: 'Uint8Array', value: [1, 2, 3]}
            },
            {
                label: 'BigUint64Array',
                input: new BigUint64Array([1n, 2n, 3n]),
                expected: {type: 'BigUint64Array', value: ['1', '2', '3']}
            }
        ])('serializes $label to {type, value}', ({input, expected}) => {
            const parsed = JSON.parse(jsonStringify({arr: input}) as string);
            expect(parsed.arr).toEqual(expected);
        });

        it('serializes Principal to {__principal__: text}', () => {
            const p = Principal.anonymous();
            const parsed = JSON.parse(jsonStringify({p}) as string);
            expect(parsed.p).toEqual({__principal__: '2vxsx-fae'});
        });
    });

    describe('options', () => {
        it('respects numeric space indentation', () => {
            const out = jsonStringify({a: 1, b: {c: 2}}, 2);
            expect(out as string).toMatch(/\n\s{2}"/);
        });

        it('respects string space indentation', () => {
            const out = jsonStringify({a: 1}, '\t');
            expect(out as string).toMatch(/\n\t"/);
        });
    });

    describe('cyclic / unserializable', () => {
        it('returns "[Unserializable: ...]" for cyclic structures', () => {
            const cyclic: Record<string, unknown> = {};
            cyclic.self = cyclic;
            expect(jsonStringify(cyclic)).toMatch(/^\[Unserializable:/);
        });
    });

    describe('complex nested object', () => {
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
                        ['c', () => 'deep fn']
                    ])
                }
            };

            const parsed = JSON.parse(jsonStringify(complex, 2, {serializeError: true}) as string);

            expect(parsed.big).toEqual({type: 'bigint', value: '42'});
            expect(parsed.nan).toBeNull();
            expect(parsed.inf).toBeNull();
            expect(parsed.fn).toBe('[Function]');
            expect(parsed.sym).toBe('Symbol(sym)');
            expect(parsed.date).toBe('2021-01-01T00:00:00.000Z');

            expect(parsed.arr[2]).toEqual({type: 'Set', value: [1, {type: 'bigint', value: '2'}]});
            expect(parsed.arr[3]).toEqual({
                type: 'Map',
                value: [
                    ['x', {type: 'bigint', value: '1'}],
                    ['y', {type: 'Uint8Array', value: [7, 8]}]
                ]
            });
            expect(parsed.arr[4]).toEqual({type: 'BigUint64Array', value: ['3', '4']});
            expect(parsed.arr[5].type).toBe('Error');
            expect(parsed.arr[5].message).toBe('nested error');
            expect(parsed.arr[5].cause.type).toBe('Error');
            expect(parsed.arr[5].cause.message).toBe('inner cause');
            expect(parsed.arr[6]).toEqual({__principal__: '2vxsx-fae'});

            expect(parsed.nested.set).toEqual({
                type: 'Set',
                value: [{type: 'Map', value: [['k', {type: 'bigint', value: '99'}]]}]
            });
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
});
