import {Flex} from 'antd';
import {ConnectButton} from '../../../auth/ConnectButton';
import {ToolbarMenu} from './menu/ToolbarMenu';

export const ToolbarRight = () => {
    return (
        <Flex align="center" gap={8}>
            <ConnectButton />
            <ToolbarMenu />
        </Flex>
    );
};
