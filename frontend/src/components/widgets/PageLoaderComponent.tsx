import {Spin} from 'antd';
import type {SpinSize} from 'antd/lib/spin/index';
import type {PropsWithChildren} from 'react';
import {CenteredXyContainer} from './CenteredXYContainer';

type Props = {
    size?: SpinSize;
    marginTop?: string | number;
    marginBottom?: string | number;
    contentMarginTop?: string | number;
    textWrapBalance?: boolean;
};

export const PageLoaderComponent = (props: PropsWithChildren<Props>) => {
    const {textWrapBalance = false} = props;
    let {size} = props;
    if (!size) {
        size = 'small';
    }
    return (
        <CenteredXyContainer marginTop={props.marginTop} marginBottom={props.marginBottom}>
            <Spin size={size} />
            {props.children ? <div style={{marginTop: props.contentMarginTop ?? 20, textWrap: textWrapBalance ? 'balance' : undefined}}>{props.children}</div> : null}
        </CenteredXyContainer>
    );
};
