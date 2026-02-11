import {Col, Row} from 'antd';
import {ToolbarLeft} from './left/ToolbarLeft';
import {ToolbarRight} from './right/ToolbarRight';

export const Toolbar = () => {
    return (
        <>
            <Row wrap={false} align="middle">
                <Col flex="auto">
                    <ToolbarLeft />
                </Col>
                <Col>
                    <ToolbarRight />
                </Col>
            </Row>
        </>
    );
};
