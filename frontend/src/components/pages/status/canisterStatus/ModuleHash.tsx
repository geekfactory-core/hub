import {isNullish} from '@dfinity/utils';
import {LoadingAndFailedToLoadValueWrapper} from 'frontend/src/components/widgets/alert/LoadingAndFailedToLoadValueWrapper';
import {useCanisterStatusContext} from 'frontend/src/context/ic/canisterStatus/CanisterStatusProvider';
import {i18} from 'frontend/src/i18';

export const ModuleHash = () => {
    const {
        canisterMetadataStatus: {moduleHash, feature, fetchCanisterMetadataStatus}
    } = useCanisterStatusContext();
    const {inProgress, loaded} = feature.status;

    if (!loaded || feature.error.isError) {
        return <LoadingAndFailedToLoadValueWrapper loaded={loaded} isError={feature.error.isError} inProgress={inProgress} action={fetchCanisterMetadataStatus} />;
    }

    if (isNullish(moduleHash)) {
        return <div>{i18.status.canisterStatus.noModuleHash}</div>;
    }

    return <div>{moduleHash}</div>;
};
