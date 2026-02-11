import {Flex} from 'antd';
import {i18} from 'frontend/src/i18';
import {Link} from 'react-router-dom';
import {PATH_HOME} from '../../Router';

export const Logo = () => {
    return (
        <Link to={PATH_HOME}>
            <Flex align="center" gap={8}>
                <span style={{fontSize: 20, letterSpacing: 1}}>{i18.toolbar.title}</span>
            </Flex>
        </Link>
    );
};
