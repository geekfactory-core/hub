import {Flex} from 'antd';
import {i18} from 'frontend/src/i18';
import {OkButton} from './OkButton';
import {URLInput} from './URLInput';
import {useValidateContractDataContext, ValidateContractDataProvider} from './ValidateContractDataProvider';
import {ValidateContractFormDataProvider} from './ValidateContractFormDataProvider';

export const ValidateContractForm = () => {
    return (
        <Flex vertical gap={16}>
            <Description />
            <ValidateContractFormDataProvider>
                <ValidateContractDataProvider>
                    <Flex vertical gap={8}>
                        <div>
                            <URLInput />
                            <ErrorPanel />
                        </div>
                        <OkButton />
                    </Flex>
                </ValidateContractDataProvider>
            </ValidateContractFormDataProvider>
        </Flex>
    );
};

const Description = () => {
    return i18.validateContract.form.description;
};

const ErrorPanel = () => {
    const {actionErrorPanel} = useValidateContractDataContext();
    return actionErrorPanel;
};
