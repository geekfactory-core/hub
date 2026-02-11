import {isNullish} from '@dfinity/utils';
import {Col, Flex, Input, Row} from 'antd';
import type {SizeType} from 'antd/es/config-provider/SizeContext';
import type {ReactNode} from 'react';
import {CopyButton} from '../CopyButton';

export const TextAreaReadonlyFormItemRow = (props: {value: string; label?: ReactNode; size?: SizeType}) => {
    const {value, label, size} = props;

    const inputRow = (
        <Row className="gf-width-100" wrap={false}>
            <Col flex="auto">
                <Input.TextArea value={value} readOnly size={size} autoSize style={{backgroundColor: 'var(--ant-color-bg-container-disabled)'}} />
            </Col>
            <Col style={{marginLeft: 8}}>
                <CopyButton text={value} className="gf-height-100" />
            </Col>
        </Row>
    );

    if (isNullish(label)) {
        return inputRow;
    }

    return (
        <Flex vertical gap={2}>
            <div className="gf-ant-color-secondary">{label}</div>
            {inputRow}
        </Flex>
    );
};
