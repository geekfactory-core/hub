import {theme, Typography} from 'antd';
import {useMemo, type CSSProperties, type ReactNode} from 'react';

type Props = {
    description: ReactNode;
};
export const DataEmptyStub = (props: Props) => {
    const {token} = theme.useToken();

    const panelStyle: CSSProperties = useMemo(
        () => ({
            padding: token.padding * 2,
            paddingBottom: token.padding
        }),
        [token.padding]
    );

    return (
        <div style={panelStyle} className="gf-ta-center">
            <Typography.Paragraph type="secondary">{props.description}</Typography.Paragraph>
        </div>
    );
};
