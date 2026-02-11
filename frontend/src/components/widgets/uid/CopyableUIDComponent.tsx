import {type UIDComponentProps, UIDComponent} from './UIDComponent';

type Props = UIDComponentProps;

export const CopyableUIDComponent = (props: Props) => {
    return <UIDComponent {...props} copyable={true} />;
};
