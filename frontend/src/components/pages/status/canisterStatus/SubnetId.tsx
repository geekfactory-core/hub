import {isNullish} from '@dfinity/utils';
import {LoadingAndFailedToLoadValueWrapper} from 'frontend/src/components/widgets/alert/LoadingAndFailedToLoadValueWrapper';
import {useCanisterStatusContext} from 'frontend/src/context/ic/canisterStatus/CanisterStatusProvider';

export const SubnetId = () => {
    const {
        canisterMetadataStatus: {subnetId, feature, fetchCanisterMetadataStatus}
    } = useCanisterStatusContext();
    const {inProgress, loaded} = feature.status;

    if (isNullish(subnetId) || feature.error.isError) {
        return <LoadingAndFailedToLoadValueWrapper loaded={loaded} isError inProgress={inProgress} action={fetchCanisterMetadataStatus} />;
    }

    return <div>{subnetId}</div>;
};
