import {type KeyValueRowProps, KeyValueRow} from './KeyValueRow';

export const KeyValueVertical = (props: Exclude<KeyValueRowProps, 'vertical'>) => {
    return <KeyValueRow vertical={true} {...props} />;
};
