import type {PropsWithChildren} from 'react';

type Props = {
    href: string;
    title?: string;
    className?: string;
};

export const ExternalLink = (props: PropsWithChildren<Props>) => {
    return (
        <a href={props.href} title={props.title} className={props.className} target="_blank" rel="noreferrer">
            {props.children}
        </a>
    );
};
