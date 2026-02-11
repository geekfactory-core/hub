import {formatDate, formatDateTime, formatTime} from 'frontend/src/utils/core/date/format';
import {useMemo} from 'react';

export const DateTimeComponent = (props: {timeMillis: number | bigint; breakLines?: boolean}) => {
    return useMemo(() => {
        const value = Number(props.timeMillis);
        if (props.breakLines) {
            return (
                <div className="gf-noWrap">
                    <div>{formatDate(value)}</div>
                    <div>{formatTime(value)}</div>
                </div>
            );
        }
        return formatDateTime(value);
    }, [props.breakLines, props.timeMillis]);
};
