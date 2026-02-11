import {type KeyValueRowProps, KeyValueRow} from './KeyValueRow';

export const KeyValueHorizontal = (props: Exclude<KeyValueRowProps, 'vertical'>) => {
    return <KeyValueRow vertical={false} justify="space-between" align="center" {...props} />;
};
