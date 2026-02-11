import {CloseCircleOutlined, FilterOutlined} from '@ant-design/icons';
import {isNullish} from '@dfinity/utils';
import {Flex, Input} from 'antd';
import {DefaultButton} from 'frontend/src/components/widgets/button/DefaultButton';
import {PrimaryButton} from 'frontend/src/components/widgets/button/PrimaryButton';
import {useAuthContext} from 'frontend/src/context/auth/AuthProvider';
import {getOnlyMyDeploymentsStateValueSafe, useContractDeploymentsProviderContext} from 'frontend/src/context/contractTemplate/ContractDeploymentsProvider';
import {type ListSortItem, deserializeListSortItem} from 'frontend/src/hook/useRemoteListWithUrlState';
import {useWindowSize} from 'frontend/src/hook/useWindowSize';
import {i18} from 'frontend/src/i18';
import {getCanisterPrincipalStringIfValid, isCanisterPrincipalValid} from 'frontend/src/utils/ic/principal';
import {type ChangeEvent, type KeyboardEvent, type ReactNode, useCallback, useEffect, useMemo, useState} from 'react';
import {OnlyMyDeploymentsSelect} from './OnlyMyDeploymentsSelect';
import {SortingSelect, validateListSortItem} from './SortingSelect';

export const Form = () => {
    const {width: screenWidth} = useWindowSize(50);
    const isSmallScreen = screenWidth < 500;
    const {
        listState,
        updateListState,
        initialListState,
        feature: {
            status: {inProgress, loaded},
            error: {isError}
        }
    } = useContractDeploymentsProviderContext();
    const {isAuthenticated} = useAuthContext();

    const [textInputValue, setTextInputValue] = useState<string | undefined>(listState.canisterId);

    useEffect(() => {
        setTextInputValue(listState.canisterId);
    }, [listState.canisterId]);

    const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setTextInputValue(event.target.value);
    }, []);

    const setFilter = useCallback(() => {
        const textSafeValue = getCanisterPrincipalStringIfValid(textInputValue);
        setTextInputValue(textSafeValue);
        updateListState({
            canisterId: textSafeValue,
            currentPage: 1
        });
    }, [textInputValue, updateListState]);

    const resetFilter = useCallback(() => {
        setTextInputValue(undefined);
        updateListState({
            canisterId: undefined,
            currentPage: 1
        });
    }, [updateListState]);

    const inputsDisabled = useMemo(() => {
        return inProgress || !loaded || isError;
    }, [inProgress, loaded, isError]);

    const searchButtonDisabled = useMemo(() => {
        if (inputsDisabled) {
            return true;
        }

        if (!isCanisterPrincipalValid(textInputValue)) {
            return true;
        }

        const textHasChanged = (textInputValue ?? '') != (listState.canisterId ?? '');
        if (textHasChanged) {
            return false;
        }

        return true;
    }, [inputsDisabled, textInputValue, listState.canisterId]);

    const resetButtonDisabled = useMemo(() => {
        if (inputsDisabled) {
            return true;
        }

        const textHasChanged = listState.canisterId != initialListState.canisterId;
        return !textHasChanged;
    }, [inputsDisabled, listState.canisterId, initialListState.canisterId]);

    const onlyMyDeploymentsOnChange = useCallback(
        (value: string) => {
            updateListState({
                onlyMyDeployments: getOnlyMyDeploymentsStateValueSafe(value),
                currentPage: 1
            });
        },
        [updateListState]
    );

    const sortingOnChange = useCallback(
        (value: string) => {
            const newSorting: Array<ListSortItem> | undefined = deserializeListSortItem(value);
            const newSortingItem: ListSortItem | undefined = validateListSortItem(newSorting?.[0]);
            updateListState({
                sort: isNullish(newSortingItem) ? undefined : [newSortingItem]
            });
        },
        [updateListState]
    );

    const onPressEnter = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
            if (!searchButtonDisabled && event.key == 'Enter') {
                setFilter();
            }
        },
        [setFilter, searchButtonDisabled]
    );

    const [filterButtonLabel, filterButtonIcon] = useMemo<[string | undefined, ReactNode]>(() => {
        if (isSmallScreen) {
            return [undefined, <FilterOutlined key="icon" />];
        }
        return [i18.deployments.form.searchButton, undefined];
    }, [isSmallScreen]);

    const [resetButtonLabel, resetButtonIcon] = useMemo<[string | undefined, ReactNode]>(() => {
        if (isSmallScreen) {
            return [undefined, <CloseCircleOutlined key="icon" />];
        }
        return [i18.deployments.form.resetButton, undefined];
    }, [isSmallScreen]);

    if (!isAuthenticated) {
        return null;
    }

    return (
        <Flex justify="space-between" wrap={true} gap={8}>
            <Flex gap={8} wrap>
                <OnlyMyDeploymentsSelect onChange={onlyMyDeploymentsOnChange} disabled={inputsDisabled} />
                <SortingSelect onChange={sortingOnChange} disabled={inputsDisabled} />
            </Flex>
            <Flex gap={8} wrap>
                <Input
                    value={textInputValue}
                    placeholder={i18.deployments.form.textPlaceholder}
                    onPressEnter={onPressEnter}
                    onChange={onChange}
                    disabled={inputsDisabled}
                    style={{width: 160}}
                    maxLength={27}
                />
                <Flex gap={8}>
                    <PrimaryButton onClick={setFilter} icon={filterButtonIcon} disabled={searchButtonDisabled}>
                        {filterButtonLabel}
                    </PrimaryButton>
                    <DefaultButton onClick={resetFilter} icon={resetButtonIcon} disabled={resetButtonDisabled}>
                        {resetButtonLabel}
                    </DefaultButton>
                </Flex>
            </Flex>
        </Flex>
    );
};
