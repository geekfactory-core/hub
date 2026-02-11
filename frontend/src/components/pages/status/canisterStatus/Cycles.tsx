import {isNullish, nonNullish} from '@dfinity/utils';
import {LoadingAndFailedToLoadValueWrapper} from 'frontend/src/components/widgets/alert/LoadingAndFailedToLoadValueWrapper';
import {useCanisterStatusContext} from 'frontend/src/context/ic/canisterStatus/CanisterStatusProvider';
import {convertFractionalAdaptiveSI} from 'frontend/src/utils/core/number/si/convert';
import {formatCyclesValueWithUnitByStrategy} from 'frontend/src/utils/ic/cycles/format';
import {useMemo} from 'react';

export const Cycles = () => {
    const {canisterStatus} = useCanisterStatusContext();
    const {fetchCanisterStatus, feature: canisterStatusFeature, data, responseError} = canisterStatus;
    const {inProgress, loaded} = canisterStatusFeature.status;
    const cycles = data?.canister_status_response.cycles;
    const cyclesAdaptive = useMemo(() => convertFractionalAdaptiveSI(cycles, 'T'), [cycles]);
    if (isNullish(cyclesAdaptive) || nonNullish(responseError) || canisterStatusFeature.error.isError) {
        return <LoadingAndFailedToLoadValueWrapper loaded={loaded} isError inProgress={inProgress} action={fetchCanisterStatus} />;
    }
    return formatCyclesValueWithUnitByStrategy(cyclesAdaptive, 'long');
};
