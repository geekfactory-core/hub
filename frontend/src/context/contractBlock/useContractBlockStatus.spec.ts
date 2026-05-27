import {describe, expect, it} from 'vitest';
import {fromNullable} from '@dfinity/utils';
import type {GetContractBlockStatusResult} from 'src/declarations/hub/hub.did';

const mapBlockedState = (result: GetContractBlockStatusResult) => {
    const blocked = fromNullable(result.blocked);
    if (blocked) {
        return {type: 'blocked', reason: blocked.value, timestamp: blocked.timestamp};
    }
    return {type: 'active'};
};

describe('useContractBlockStatus mapping', () => {
    it('maps blocked result into a blocked contract state', () => {
        expect(mapBlockedState({blocked: [{value: 'policy', timestamp: BigInt(10)}]})).toEqual({
            type: 'blocked',
            reason: 'policy',
            timestamp: BigInt(10)
        });
    });

    it('maps empty result into an active contract state', () => {
        expect(mapBlockedState({blocked: []})).toEqual({type: 'active'});
    });
});
