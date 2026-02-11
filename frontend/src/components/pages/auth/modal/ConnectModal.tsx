import {Flex, Typography} from 'antd';
import {i18} from 'frontend/src/i18';
import {Footer} from './footer/Footer';
import {AgreementCheckbox} from './form/AgreementCheckbox';
import {AgreementCheckboxFAQ} from './form/AgreementCheckboxFAQ';

export const ConnectModal = () => {
    return (
        <Flex vertical gap={16}>
            <Typography.Title level={5}>{i18.auth.connect.confirmationModal.title}</Typography.Title>
            <div>{i18.auth.connect.confirmationModal.description}</div>
            <AgreementCheckboxFAQ />
            <AgreementCheckbox />
            <Footer />
        </Flex>
    );
};
