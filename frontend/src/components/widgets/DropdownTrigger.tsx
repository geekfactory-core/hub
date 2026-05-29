import {forwardRef, type ComponentPropsWithoutRef} from 'react';

export const DropdownTrigger = forwardRef<HTMLSpanElement, ComponentPropsWithoutRef<'span'>>((props, ref) => {
    return <span {...props} ref={ref} />;
});

DropdownTrigger.displayName = 'DropdownTrigger';
