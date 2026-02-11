import {isNullish, nonNullish} from '@dfinity/utils';
import {LoadingAndFailedToLoadValueWrapper} from 'frontend/src/components/widgets/alert/LoadingAndFailedToLoadValueWrapper';
import {useCanisterStatusContext} from 'frontend/src/context/ic/canisterStatus/CanisterStatusProvider';
import {formatValueWithUnit} from 'frontend/src/utils/core/number/format';
import {convertFractionalAdaptiveSI} from 'frontend/src/utils/core/number/si/convert';
import {useMemo} from 'react';

export const NumCallsTotal = () => {
    const {canisterStatus} = useCanisterStatusContext();
    const {fetchCanisterStatus, feature: canisterStatusFeature, data, responseError} = canisterStatus;
    const {inProgress, loaded} = canisterStatusFeature.status;
    const numCallsTotal = useMemo(() => convertFractionalAdaptiveSI(data?.canister_status_response.query_stats.num_calls_total), [data?.canister_status_response.query_stats.num_calls_total]);

    if (isNullish(numCallsTotal) || nonNullish(responseError) || canisterStatusFeature.error.isError) {
        return <LoadingAndFailedToLoadValueWrapper loaded={loaded} isError inProgress={inProgress} action={fetchCanisterStatus} />;
    }
    return formatValueWithUnit(numCallsTotal);
};
