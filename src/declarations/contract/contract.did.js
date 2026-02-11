export const idlFactory = ({IDL}) => {
    const GetContractOwnerResult = IDL.Record({owner: IDL.Principal});
    const GetContractOwnerError = IDL.Variant({
        ContractNotActivated: IDL.Null,
        ContractActivationNotRequired: IDL.Null
    });
    const GetContractOwnerResponse = IDL.Variant({
        Ok: GetContractOwnerResult,
        Err: GetContractOwnerError
    });
    return IDL.Service({
        get_contract_owner: IDL.Func([IDL.Record({})], [GetContractOwnerResponse], [])
    });
};