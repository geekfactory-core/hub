import {secondsToDuration, type I18nSecondsToDuration} from '@dfinity/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import {MILLIS_PER_SECOND} from './constants';

/**
 * Set default locale to "en"
 */
dayjs.locale('en');
/**
 * Set default timezone to UTC
 */
dayjs.extend(utc);
/**
 * Enable relative time plugin
 */
dayjs.extend(relativeTime);
dayjs.utc();

const DATE_FORMAT = 'YYYY/MM/DD';
const TIME_FORMAT = 'HH:mm:ss';

export const formatDateTime = (timeMillis: number) => {
    return dayjs(timeMillis).utc().format(`${DATE_FORMAT} ${TIME_FORMAT}`);
};

export const formatDate = (timeMillis: number) => {
    return dayjs(timeMillis).utc().format(DATE_FORMAT);
};

export const formatTime = (timeMillis: number) => {
    return dayjs(timeMillis).utc().format(TIME_FORMAT);
};

const i18nSecondsToDurationShort: I18nSecondsToDuration = {
    year: 'y',
    year_plural: 'y',
    month: 'mo',
    month_plural: 'mo',
    day: 'd',
    day_plural: 'd',
    hour: 'h',
    hour_plural: 'h',
    minute: 'm',
    minute_plural: 'm',
    second: 's',
    second_plural: 's'
};

export const formatDuration = (durationMillis: number, options: {shortI18?: boolean; showMillis?: boolean; firstTokenOnly?: boolean} = {}): string | undefined => {
    const {showMillis = false, firstTokenOnly = false} = options;
    if (durationMillis < MILLIS_PER_SECOND) {
        if (showMillis) {
            return `${durationMillis} ms`;
        }
        return undefined;
    }
    const {shortI18 = false} = options;
    const value = secondsToDuration({seconds: BigInt(Math.floor(durationMillis / MILLIS_PER_SECOND)), i18n: shortI18 ? i18nSecondsToDurationShort : undefined});
    if (firstTokenOnly) {
        const firstSpaceIndex = value.indexOf(',');
        if (firstSpaceIndex !== -1) {
            return value.slice(0, firstSpaceIndex);
        }
    }
    return value;
};
