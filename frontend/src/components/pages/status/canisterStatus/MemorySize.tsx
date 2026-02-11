import {isNullish, nonNullish} from '@dfinity/utils';
import {LoadingAndFailedToLoadValueWrapper} from 'frontend/src/components/widgets/alert/LoadingAndFailedToLoadValueWrapper';
import {useCanisterStatusContext} from 'frontend/src/context/ic/canisterStatus/CanisterStatusProvider';
import {convertBytesFractionalAdaptive} from 'frontend/src/utils/core/memory/convert';
import {formatMemoryBytesValueWithUnit} from 'frontend/src/utils/core/memory/format';
import {useMemo} from 'react';

export const MemorySize = () => {
    const {canisterStatus} = useCanisterStatusContext();
    const {fetchCanisterStatus, feature: canisterStatusFeature, data, responseError} = canisterStatus;
    const {inProgress, loaded} = canisterStatusFeature.status;
    const memorySize = useMemo(() => convertBytesFractionalAdaptive(data?.canister_status_response.memory_size), [data?.canister_status_response.memory_size]);

    if (isNullish(memorySize) || nonNullish(responseError) || canisterStatusFeature.error.isError) {
        return <LoadingAndFailedToLoadValueWrapper loaded={loaded} isError inProgress={inProgress} action={fetchCanisterStatus} />;
    }
    return formatMemoryBytesValueWithUnit(memorySize);
};
