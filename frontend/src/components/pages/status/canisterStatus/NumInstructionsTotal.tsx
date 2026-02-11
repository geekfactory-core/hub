import {isNullish, nonNullish} from '@dfinity/utils';
import {LoadingAndFailedToLoadValueWrapper} from 'frontend/src/components/widgets/alert/LoadingAndFailedToLoadValueWrapper';
import {useCanisterStatusContext} from 'frontend/src/context/ic/canisterStatus/CanisterStatusProvider';
import {formatValueWithUnit} from 'frontend/src/utils/core/number/format';
import {convertFractionalAdaptiveSI} from 'frontend/src/utils/core/number/si/convert';
import {useMemo} from 'react';

export const NumInstructionsTotal = () => {
    const {canisterStatus} = useCanisterStatusContext();
    const {fetchCanisterStatus, feature: canisterStatusFeature, data, responseError} = canisterStatus;
    const {inProgress, loaded} = canisterStatusFeature.status;
    const numInstructionsTotal = useMemo(
        () => convertFractionalAdaptiveSI(data?.canister_status_response.query_stats.num_instructions_total),
        [data?.canister_status_response.query_stats.num_instructions_total]
    );

    if (isNullish(numInstructionsTotal) || nonNullish(responseError) || canisterStatusFeature.error.isError) {
        return <LoadingAndFailedToLoadValueWrapper loaded={loaded} isError inProgress={inProgress} action={fetchCanisterStatus} />;
    }
    return formatValueWithUnit(numInstructionsTotal);
};
