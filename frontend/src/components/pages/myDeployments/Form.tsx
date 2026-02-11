import {CloseCircleOutlined, FilterOutlined} from '@ant-design/icons';
import {isNullish} from '@dfinity/utils';
import {Flex, Input} from 'antd';
import {useMyDeploymentsProviderContext} from 'frontend/src/context/myDeployments/MyDeploymentsProvider';
import {useWindowSize} from 'frontend/src/hook/useWindowSize';
import {i18} from 'frontend/src/i18';
import {getCanisterPrincipalStringIfValid, isCanisterPrincipalValid} from 'frontend/src/utils/ic/principal';
import {useCallback, useEffect, useMemo, useState, type ChangeEvent, type KeyboardEvent, type ReactNode} from 'react';
import {deserializeListSortItem, type ListSortItem} from '../../../hook/useRemoteListWithUrlState';
import {DefaultButton} from '../../widgets/button/DefaultButton';
import {PrimaryButton} from '../../widgets/button/PrimaryButton';
import {SortingSelect, validateListSortItem} from './SortingSelect';

export const Form = () => {
    const {width: screenWidth} = useWindowSize(50);
    const isSmallScreen = screenWidth < 560;

    const {
        listState,
        updateListState,
        initialListState,
        feature: {
            status: {inProgress, loaded},
            error: {isError}
        }
    } = useMyDeploymentsProviderContext();

    const [textInputValue, setTextInputValue] = useState<string | undefined>(listState.canisterId);

    useEffect(() => {
        setTextInputValue(listState.canisterId);
    }, [listState.canisterId]);

    const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setTextInputValue(event.target.value);
    }, []);

    const setFilter = useCallback(() => {
        const textValueSafe = getCanisterPrincipalStringIfValid(textInputValue);
        setTextInputValue(textValueSafe);
        updateListState({
            canisterId: textValueSafe,
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
        return [i18.myDeployments.form.searchButton, undefined];
    }, [isSmallScreen]);

    const [resetButtonLabel, resetButtonIcon] = useMemo<[string | undefined, ReactNode]>(() => {
        if (isSmallScreen) {
            return [undefined, <CloseCircleOutlined key="icon" />];
        }
        return [i18.myDeployments.form.resetButton, undefined];
    }, [isSmallScreen]);

    const inputWidth = useMemo<number>(() => {
        const diff = Math.min(680, screenWidth) - 420;
        return Math.max(150, diff);
    }, [screenWidth]);

    return (
        <Flex gap={8} justify="space-between" wrap>
            <SortingSelect onChange={sortingOnChange} disabled={inputsDisabled} />
            <Flex gap={8} align="center">
                <Input
                    value={textInputValue}
                    placeholder={i18.myDeployments.form.textPlaceholder}
                    onPressEnter={onPressEnter}
                    onChange={onChange}
                    disabled={inputsDisabled}
                    style={{width: inputWidth}}
                    maxLength={27}
                />
                <PrimaryButton onClick={setFilter} icon={filterButtonIcon} disabled={searchButtonDisabled}>
                    {filterButtonLabel}
                </PrimaryButton>
                <DefaultButton onClick={resetFilter} icon={resetButtonIcon} disabled={resetButtonDisabled}>
                    {resetButtonLabel}
                </DefaultButton>
            </Flex>
        </Flex>
    );
};
