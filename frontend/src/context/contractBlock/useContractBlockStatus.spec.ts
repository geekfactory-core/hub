import {describe, expect, it} from 'vitest';
import {mapContractBlockState} from './useContractBlockStatus';

describe('useContractBlockStatus', () => {
    describe('contractBlockState mapping', () => {
        it('returns blocked state when blocked metadata exists', () => {
            expect(mapContractBlockState({blocked: [{value: 'policy', timestamp: BigInt(10)}]})).toEqual({
                type: 'blocked',
                reason: 'policy',
                timestamp: BigInt(10)
            });
        });

        it('returns active state when blocked metadata is empty', () => {
            expect(mapContractBlockState({blocked: []})).toEqual({type: 'active'});
        });

        it('returns undefined when data is undefined', () => {
            expect(mapContractBlockState(undefined)).toBeUndefined();
        });
    });
});
