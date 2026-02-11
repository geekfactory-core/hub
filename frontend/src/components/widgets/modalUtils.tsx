import type {ModalProps} from 'antd';
import {MODAL_WIDTH} from 'frontend/src/constants';

export const DEFAULT_MODAL_PROPS: ModalProps = {
    destroyOnHidden: true,
    width: MODAL_WIDTH,
    closable: false,
    maskClosable: false,
    keyboard: false,
    footer: null
};
