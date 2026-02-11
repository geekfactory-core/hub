import {isNullish} from '@dfinity/utils';
import {LoadingAndFailedToLoadValueWrapper} from 'frontend/src/components/widgets/alert/LoadingAndFailedToLoadValueWrapper';
import {CopyableUIDComponent} from 'frontend/src/components/widgets/uid/CopyableUIDComponent';
import {useCanisterStatusContext} from 'frontend/src/context/ic/canisterStatus/CanisterStatusProvider';

export const CanisterId = () => {
    const {canisterStatus, canisterId} = useCanisterStatusContext();
    const {fetchCanisterStatus, feature: canisterStatusFeature} = canisterStatus;
    const {inProgress, loaded} = canisterStatusFeature.status;

    if (isNullish(canisterId)) {
        return <LoadingAndFailedToLoadValueWrapper loaded={loaded} isError inProgress={inProgress} action={fetchCanisterStatus} />;
    }
    return <CopyableUIDComponent uid={canisterId} />;
};
