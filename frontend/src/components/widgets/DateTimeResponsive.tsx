import {Grid} from 'antd';
import {DateTimeComponent} from './DateTimeComponent';

const {useBreakpoint} = Grid;

export const DateTimeResponsive = (props: {timeMillis: number | bigint; forceBreakLines?: boolean}) => {
    const breakpoint = useBreakpoint();
    return <DateTimeComponent timeMillis={props.timeMillis} breakLines={!breakpoint.md || props.forceBreakLines} />;
};
