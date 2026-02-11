import {isNullish} from '@dfinity/utils';
import type {WithoutUndefined} from 'frontend/src/utils/core/typescript/typescriptAddons';
import type {PropsWithChildren} from 'react';
import {createContext, useContext, useMemo} from 'react';
import {useContractTemplate} from './useContractTemplate';

type Context = {
    contractTemplateId: bigint;
} & ReturnType<typeof useContractTemplate>;

type SafeContext = WithoutUndefined<Context, 'contractTemplateInformation'>;

const Context = createContext<Context | undefined>(undefined);
export const useContractTemplateContext = () => {
    const context = useContext(Context);
    if (!context) {
        throw new Error('useContractTemplateContext must be used within a ContractProvider');
    }
    return context;
};

export const useContractTemplateContextSafe = (): SafeContext => {
    const context = useContext(Context);
    if (isNullish(context)) {
        throw new Error('useContractTemplateContextSafe must be used within a ContractProvider');
    }
    if (isNullish(context.contractTemplateInformation)) {
        throw new Error('useContractTemplateContextSafe: contractTemplateInformation is nullish');
    }
    return context as SafeContext;
};

type Props = {
    contractTemplateId: bigint;
};
export const ContractTemplateProvider = (props: PropsWithChildren<Props>) => {
    const {contractTemplateId} = props;
    const contractTemplate = useContractTemplate(contractTemplateId);
    const value: Context = useMemo(
        () => ({
            contractTemplateId,
            ...contractTemplate
        }),
        [contractTemplateId, contractTemplate]
    );
    return <Context.Provider value={value}>{props.children}</Context.Provider>;
};
