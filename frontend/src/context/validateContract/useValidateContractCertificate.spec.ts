import {describe, expect, it} from 'vitest';
import {mapContractValidationState} from './useValidateContractCertificate';

describe('mapContractValidationState', () => {
    it('maps ContractBlocked into a dedicated blocked state', () => {
        const validationState = mapContractValidationState({ContractBlocked: {reason: 'policy'}}, undefined);

        expect(validationState).toEqual({
            type: 'contractBlocked',
            reason: 'policy'
        });
    });

    it('keeps blocked contracts unsafe by not mapping them to valid states', () => {
        const validationState = mapContractValidationState({ContractBlocked: {reason: 'policy'}}, undefined);

        expect(validationState?.type).not.toBe('certificateValidAndActive');
    });
});
