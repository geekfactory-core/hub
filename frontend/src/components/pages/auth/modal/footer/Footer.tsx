import {Flex} from 'antd';
import {CancelButton} from './CancelButton';
import {OkButton} from './OkButton';

export const Footer = () => {
    return (
        <Flex vertical gap={16}>
            <OkButton />
            <CancelButton />
        </Flex>
    );
};
