import {ExportOutlined} from '@ant-design/icons';
import {ExternalLink} from 'frontend/src/components/widgets/ExternalLink';
import {AbstractCheckbox} from 'frontend/src/components/widgets/form/AbstractCheckbox';
import {i18} from 'frontend/src/i18';
import {useCallback} from 'react';
import {RouterPaths} from '../../../skeleton/Router';
import {useConnectModalDataDataContext} from '../ConnectModalDataProvider';

export const AgreementCheckbox = () => {
    const {formState, updateFormState, formControlsDisabled} = useConnectModalDataDataContext();

    const onClick = useCallback(() => {
        updateFormState({
            termsOfUseChecked: !formState.termsOfUseChecked
        });
    }, [formState.termsOfUseChecked, updateFormState]);

    return (
        <AbstractCheckbox checked={formState.termsOfUseChecked == true} onClick={onClick} disabled={formControlsDisabled}>
            {`${i18.auth.connect.confirmationModal.agreementCheckbox.termsOfUse.part1} `}
            <ExternalLink href={RouterPaths.externalTermsOfUsePage()} className="gf-underline gf-underline-hover gf-noWrap">
                {i18.auth.connect.confirmationModal.agreementCheckbox.termsOfUse.termsOfUse}
            </ExternalLink>{' '}
            <ExportOutlined className="gf-font-size-smaller" />
        </AbstractCheckbox>
    );
};
