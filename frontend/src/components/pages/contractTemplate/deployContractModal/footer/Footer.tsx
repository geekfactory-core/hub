import {Flex} from 'antd';
import {CancelButton} from './CancelButton';
import {OkButton} from './OkButton';

export const Footer = () => {
    return (
        <Flex gap={8}>
            <CancelButton />
            <OkButton />
        </Flex>
    );
};
