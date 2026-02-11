import type {PropsWithChildren} from 'react';

type Props = {
    marginTop?: string | number;
    marginBottom?: string | number;
};

export const CenteredXyContainer = (props: PropsWithChildren<Props>) => {
    return (
        <div
            className="gf-width-100"
            style={{
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                marginTop: props.marginTop,
                marginBottom: props.marginBottom
            }}>
            {props.children}
        </div>
    );
};
