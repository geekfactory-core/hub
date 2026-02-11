import {mapTokenMetadata, type IcrcTokenMetadata, type IcrcTokenMetadataResponse} from '@dfinity/ledger-icrc';
import type {Principal} from '@dfinity/principal';
import {nonNullish} from '@dfinity/utils';
import {toError} from 'frontend/src/utils/core/error/toError';
import {useFeature, type DataAvailability, type Feature} from 'frontend/src/utils/core/feature/feature';
import {reusePromiseWrapper} from 'frontend/src/utils/core/promise/reusePromise';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {safeCall} from 'frontend/src/utils/ic/api/safeCall';
import {getICRCTokenLogo} from 'frontend/src/utils/ic/icrc/icrcMetadata';
import {useMemo, useState} from 'react';
import {apiLogger} from '../../logger/logger';
import {caughtErrorMessage} from '../../logger/loggerConstants';
import {useICRCService} from './useICRCService';

type MetadataDataAvailability = DataAvailability<{metadata: IcrcTokenMetadata}>;

type Context = {
    metadata: IcrcTokenMetadata | undefined;
    metadataFeature: Feature;
    fetchMetadata: () => Promise<void>;
    metadataDataAvailability: MetadataDataAvailability;
};

export const useICRCMetadata = (ledgerCanister: Principal): Context => {
    const ledgerCanisterId = useMemo(() => ledgerCanister.toText(), [ledgerCanister]);

    const {getICRCLedgerServiceAnonymous} = useICRCService();

    const [metadata, setMetadata] = useState<IcrcTokenMetadata | undefined>(undefined);
    const [metadataFeature, updateMetadataFeature] = useFeature();

    /**
    ==========================================
    Metadata
    ==========================================
    */

    const fetchMetadata = useMemo(
        () =>
            reusePromiseWrapper(async () => {
                const logMessagePrefix = `useICRCMetadata[${ledgerCanisterId}]:`;
                try {
                    updateMetadataFeature({status: {inProgress: true}});

                    const actor = await getICRCLedgerServiceAnonymous(ledgerCanister);

                    const call = safeCall(actor.metadata, {
                        logger: apiLogger,
                        logMessagePrefix
                    });
                    const response = await call({certified: false});
                    if (hasProperty(response, 'Ok')) {
                        const metadataResponse: IcrcTokenMetadataResponse = response.Ok;
                        const metadata: IcrcTokenMetadata | undefined = mapTokenMetadata(metadataResponse);
                        apiLogger.debug(`${logMessagePrefix} metadata`, {metadata});
                        if (metadata != undefined && metadata.icon == undefined) {
                            metadata.icon = getICRCTokenLogo(metadataResponse);
                        }
                        setMetadata(metadata);
                        updateMetadataFeature({
                            status: {inProgress: false, loaded: true},
                            error: {isError: false, error: undefined}
                        });
                        return;
                    }
                    throw response.Thrown;
                } catch (e) {
                    apiLogger.error(caughtErrorMessage(logMessagePrefix), e);
                    setMetadata(undefined);
                    updateMetadataFeature({
                        status: {inProgress: false, loaded: true},
                        error: {isError: true, error: toError(e)}
                    });
                }
            }),
        [ledgerCanisterId, updateMetadataFeature, getICRCLedgerServiceAnonymous, ledgerCanister]
    );

    const metadataDataAvailability: MetadataDataAvailability = useMemo(() => {
        if (metadataFeature.status.loaded) {
            if (nonNullish(metadata)) {
                return {type: 'available', metadata};
            } else {
                return {type: 'notAvailable'};
            }
        } else {
            return {type: 'loading'};
        }
    }, [metadataFeature.status.loaded, metadata]);

    return useMemo<Context>(
        () => ({
            metadata,
            metadataFeature,
            fetchMetadata,
            metadataDataAvailability
        }),
        [metadata, metadataFeature, fetchMetadata, metadataDataAvailability]
    );
};
