import {ExportOutlined} from '@ant-design/icons';
import {ExternalLink} from 'frontend/src/components/widgets/ExternalLink';
import {AbstractCheckbox} from 'frontend/src/components/widgets/form/AbstractCheckbox';
import {i18} from 'frontend/src/i18';
import {useCallback} from 'react';
import {RouterPaths} from '../../../skeleton/Router';
import {useConnectModalDataDataContext} from '../ConnectModalDataProvider';

export const AgreementCheckboxFAQ = () => {
    const {formState, updateFormState, formControlsDisabled} = useConnectModalDataDataContext();

    const onClick = useCallback(() => {
        updateFormState({
            howItWorksChecked: !formState.howItWorksChecked
        });
    }, [formState.howItWorksChecked, updateFormState]);

    return (
        <AbstractCheckbox checked={formState.howItWorksChecked == true} onClick={onClick} disabled={formControlsDisabled}>
            <div>
                {i18.auth.connect.confirmationModal.agreementCheckbox.faq.part1}
                <ExternalLink href={RouterPaths.externalFAQPage()} className="gf-underline gf-underline-hover">
                    {i18.auth.connect.confirmationModal.agreementCheckbox.faq.part2}
                </ExternalLink>{' '}
                <ExportOutlined className="gf-font-size-smaller" />
            </div>
        </AbstractCheckbox>
    );
};
