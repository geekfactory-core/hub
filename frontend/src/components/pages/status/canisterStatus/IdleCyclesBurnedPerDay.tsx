import {isNullish, nonNullish} from '@dfinity/utils';
import {LoadingAndFailedToLoadValueWrapper} from 'frontend/src/components/widgets/alert/LoadingAndFailedToLoadValueWrapper';
import {useCanisterStatusContext} from 'frontend/src/context/ic/canisterStatus/CanisterStatusProvider';
import {convertFractionalAdaptiveSI} from 'frontend/src/utils/core/number/si/convert';
import {formatCyclesValueWithUnitByStrategy} from 'frontend/src/utils/ic/cycles/format';
import {useMemo} from 'react';

export const IdleCyclesBurnedPerDay = () => {
    const {canisterStatus} = useCanisterStatusContext();
    const {fetchCanisterStatus, feature: canisterStatusFeature, data, responseError} = canisterStatus;
    const {inProgress, loaded} = canisterStatusFeature.status;
    const idleCyclesBurnedPerDay = data?.canister_status_response.idle_cycles_burned_per_day;
    const idleCyclesBurnedPerDayAdaptive = useMemo(() => convertFractionalAdaptiveSI(idleCyclesBurnedPerDay, 'T'), [idleCyclesBurnedPerDay]);
    if (isNullish(idleCyclesBurnedPerDayAdaptive) || nonNullish(responseError) || canisterStatusFeature.error.isError) {
        return <LoadingAndFailedToLoadValueWrapper loaded={loaded} isError inProgress={inProgress} action={fetchCanisterStatus} />;
    }
    return formatCyclesValueWithUnitByStrategy(idleCyclesBurnedPerDayAdaptive, 'long');
};
