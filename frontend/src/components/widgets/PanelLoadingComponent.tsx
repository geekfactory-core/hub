import type {ReactNode} from 'react';
import {PageLoaderComponent} from './PageLoaderComponent';

type Props = {
    message?: ReactNode;
};
export const PanelLoadingComponent = (props: Props) => {
    const {message} = props;
    return (
        <PageLoaderComponent marginTop={30} marginBottom={30}>
            {message}
        </PageLoaderComponent>
    );
};
