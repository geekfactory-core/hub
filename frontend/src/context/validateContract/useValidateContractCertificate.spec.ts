import {describe, expect, it} from 'vitest';
import {mapContractValidationState} from './useValidateContractCertificate';

describe('mapContractValidationState', () => {
    it('maps CertificateWrong into a fatal validation state', () => {
        const validationState = mapContractValidationState({CertificateWrong: {reason: 'policy'}}, undefined);

        expect(validationState).toEqual({
            type: 'validationFatalError'
        });
    });

    it('keeps certificate fatal errors away from valid states', () => {
        const validationState = mapContractValidationState({CertificateWrong: {reason: 'policy'}}, undefined);

        expect(validationState?.type).not.toBe('certificateValidAndActive');
    });
});
