import {isNullish} from '@dfinity/utils';
import {Flex} from 'antd';
import {useDynamicTickForTargetTime} from 'frontend/src/hook/useDynamicTickForTargetTime';
import {i18} from 'frontend/src/i18';
import {getDurationTillUTCMillisUnsafe} from 'frontend/src/utils/core/date/duration';
import {formatDateTime, formatDuration} from 'frontend/src/utils/core/date/format';
import {useMemo} from 'react';

export const CertificateExpirationDate = ({expiration}: {expiration: bigint}) => {
    const {tick, targetTimeMillis: certificateWillExpireAtMillis} = useDynamicTickForTargetTime(expiration);
    if (isNullish(certificateWillExpireAtMillis)) {
        return null;
    }
    return (
        <Flex vertical>
            <span>{formatDateTime(certificateWillExpireAtMillis)}</span>
            <ExpirationStatus key={tick} certificateWillExpireAtMillis={certificateWillExpireAtMillis} />
        </Flex>
    );
};

const ExpirationStatus = (props: {certificateWillExpireAtMillis: number}) => {
    const {certificateWillExpireAtMillis} = props;
    const delayToExpirationMillis = useMemo(() => getDurationTillUTCMillisUnsafe(certificateWillExpireAtMillis), [certificateWillExpireAtMillis]);
    if (delayToExpirationMillis <= 0) {
        return <span className="gf-ant-color-error">{i18.validateContract.certificateDetails.expirationDateExpiredWarning}</span>;
    }
    const durationMillis = Number(delayToExpirationMillis);
    const durationLabel = formatDuration(durationMillis);
    if (isNullish(durationLabel)) {
        return <span>{i18.validateContract.certificateDetails.expirationDateLabel.soon}</span>;
    }
    return <span>{i18.validateContract.certificateDetails.expirationDateLabel.label(durationLabel)}</span>;
};
