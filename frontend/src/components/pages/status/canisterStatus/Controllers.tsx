import {LoadingAndFailedToLoadValueWrapper} from 'frontend/src/components/widgets/alert/LoadingAndFailedToLoadValueWrapper';
import {useCanisterStatusContext} from 'frontend/src/context/ic/canisterStatus/CanisterStatusProvider';
import {i18} from 'frontend/src/i18';
import {isEmptyArray} from 'frontend/src/utils/core/array/array';

export const Controllers = () => {
    const {
        canisterMetadataStatus: {controllers, feature, fetchCanisterMetadataStatus}
    } = useCanisterStatusContext();
    const {inProgress, loaded} = feature.status;

    if (!loaded || feature.error.isError) {
        return <LoadingAndFailedToLoadValueWrapper loaded={loaded} isError={feature.error.isError} inProgress={inProgress} action={fetchCanisterMetadataStatus} />;
    }
    if (isEmptyArray(controllers)) {
        return i18.status.canisterStatus.noControllers;
    }
    return (
        <div>
            {controllers.map((v, idx) => (
                <div key={idx}>{v}</div>
            ))}
        </div>
    );
};
