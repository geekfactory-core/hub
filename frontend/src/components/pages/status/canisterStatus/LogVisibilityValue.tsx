import {isNullish, nonNullish} from '@dfinity/utils';
import {Flex} from 'antd';
import {LoadingAndFailedToLoadValueWrapper} from 'frontend/src/components/widgets/alert/LoadingAndFailedToLoadValueWrapper';
import {useCanisterStatusContext} from 'frontend/src/context/ic/canisterStatus/CanisterStatusProvider';
import {i18} from 'frontend/src/i18';
import {hasProperty} from 'frontend/src/utils/core/typescript/typescriptAddons';
import type {LogVisibility} from 'src/declarations/hub/hub.did';

export const LogVisibilityValue = () => {
    const {canisterStatus} = useCanisterStatusContext();
    const {fetchCanisterStatus, feature: canisterStatusFeature, data, responseError} = canisterStatus;
    const {inProgress, loaded} = canisterStatusFeature.status;
    const visibility = data?.canister_status_response.settings.log_visibility;

    if (isNullish(visibility) || nonNullish(responseError) || canisterStatusFeature.error.isError) {
        return <LoadingAndFailedToLoadValueWrapper loaded={loaded} isError inProgress={inProgress} action={fetchCanisterStatus} />;
    }

    return <LogVisibilityComponent logVisibility={visibility} />;
};

const LogVisibilityComponent = ({logVisibility}: {logVisibility: LogVisibility}) => {
    if (hasProperty(logVisibility, 'public')) {
        return i18.status.canisterStatus.logVisibility.public;
    } else if (hasProperty(logVisibility, 'controllers')) {
        return i18.status.canisterStatus.logVisibility.controllers;
    } else if (hasProperty(logVisibility, 'allowed_viewers')) {
        return (
            <Flex vertical>
                <span>{i18.status.canisterStatus.logVisibility.allowedViewers}</span>
                {logVisibility.allowed_viewers.map((viewer) => (
                    <span key={viewer.toText()}>{viewer.toText()}</span>
                ))}
            </Flex>
        );
    } else {
        return '-';
    }
};
