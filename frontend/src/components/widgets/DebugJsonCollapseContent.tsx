import {jsonStringify} from 'frontend/src/utils/core/json/json';
import {useMemo} from 'react';

export const DebugJsonCollapseContent = (props: {data: any}) => {
    const {data} = props;
    const value = useMemo<string>(() => jsonStringify(data, 4), [data]);
    return <pre>{value}</pre>;
};
