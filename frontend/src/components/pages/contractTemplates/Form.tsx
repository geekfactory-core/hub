import {CloseCircleOutlined, FilterOutlined} from '@ant-design/icons';
import {Flex, Input} from 'antd';
import {getContractTemplatesStateValueSafe, useContractTemplatesProviderContext} from 'frontend/src/context/contractTemplates/ContractTemplatesProvider';
import {formRules, getFilterStateValueSafe} from 'frontend/src/context/myDeployments/MyDeploymentsProvider';
import {useWindowSize} from 'frontend/src/hook/useWindowSize';
import {i18} from 'frontend/src/i18';
import {type ChangeEvent, type KeyboardEvent, type ReactNode, useCallback, useEffect, useMemo, useState} from 'react';
import {type ListSortItem, deserializeListSortItem} from '../../../hook/useRemoteListWithUrlState';
import {DefaultButton} from '../../widgets/button/DefaultButton';
import {PrimaryButton} from '../../widgets/button/PrimaryButton';
import {ActiveBlockedSelect} from './ActiveBlockedSelect';
import {SortingSelect} from './SortingSelect';

export const Form = () => {
    const {width: screenWidth} = useWindowSize(50);
    const isSmallScreen = screenWidth < 500;

    const {
        listState,
        initialListState,
        updateListState,
        feature: {
            status: {inProgress, loaded},
            error: {isError}
        }
    } = useContractTemplatesProviderContext();

    const [filterInputValue, setFilterInputValue] = useState<string | undefined>(listState.filter);

    useEffect(() => {
        setFilterInputValue(listState.filter);
    }, [listState.filter]);

    const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setFilterInputValue(event.target.value);
    }, []);

    const activeBlockedOnChange = useCallback(
        (value: string) => {
            const stateValue = getContractTemplatesStateValueSafe(value);
            updateListState({
                state: stateValue,
                currentPage: 1
            });
        },
        [updateListState]
    );

    const setFilter = useCallback(() => {
        const filterSafeValue = getFilterStateValueSafe(filterInputValue);
        setFilterInputValue(filterSafeValue);
        updateListState({
            filter: filterSafeValue,
            currentPage: 1
        });
    }, [filterInputValue, updateListState]);

    const resetFilter = useCallback(() => {
        setFilterInputValue(undefined);
        updateListState({
            filter: undefined,
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

        const filterLength = filterInputValue?.length ?? 0;

        const isFilterLengthValid = filterLength >= formRules.filterMinLength && filterLength <= formRules.filterMaxLength;
        if (!isFilterLengthValid) {
            return true;
        }

        const filterHasChanged = (filterInputValue ?? '') != (listState.filter ?? '');
        if (filterHasChanged) {
            return false;
        }

        return true;
    }, [inputsDisabled, filterInputValue, listState.filter]);

    const resetButtonDisabled = useMemo(() => {
        if (inputsDisabled) {
            return true;
        }

        const filterHasChanged = listState.filter != initialListState.filter;
        return !filterHasChanged;
    }, [inputsDisabled, listState.filter, initialListState.filter]);

    const sortingOnChange = useCallback(
        (value: string) => {
            const newSorting: Array<ListSortItem> | undefined = deserializeListSortItem(value);
            updateListState({
                sort: newSorting
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
        return [i18.contractTemplates.form.searchButton, undefined];
    }, [isSmallScreen]);

    const [resetButtonLabel, resetButtonIcon] = useMemo<[string | undefined, ReactNode]>(() => {
        if (isSmallScreen) {
            return [undefined, <CloseCircleOutlined key="icon" />];
        }
        return [i18.contractTemplates.form.resetButton, undefined];
    }, [isSmallScreen]);

    return (
        <Flex gap={8} align="center" justify="space-between" wrap>
            <Flex gap={8} align="center">
                <ActiveBlockedSelect onChange={activeBlockedOnChange} disabled={inputsDisabled} />
                <SortingSelect onChange={sortingOnChange} disabled={inputsDisabled} />
            </Flex>
            <Flex gap={8} wrap>
                <Input
                    value={filterInputValue}
                    placeholder={i18.contractTemplates.form.filterPlaceholder}
                    onPressEnter={onPressEnter}
                    onChange={onChange}
                    disabled={inputsDisabled}
                    style={{width: 200}}
                    maxLength={formRules.filterMaxLength}
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
