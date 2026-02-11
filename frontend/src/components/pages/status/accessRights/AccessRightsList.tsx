import {fromNullable, isNullish, nonNullish} from '@dfinity/utils';
import {Flex, List} from 'antd';
import type {PaginationConfig} from 'antd/es/pagination';
import {AlertActionButton} from 'frontend/src/components/widgets/alert/AlertActionButton';
import {ErrorAlertWithAction} from 'frontend/src/components/widgets/alert/ErrorAlertWithAction';
import {KeyValueVertical} from 'frontend/src/components/widgets/KeyValueVertical';
import {PanelLoadingComponent} from 'frontend/src/components/widgets/PanelLoadingComponent';
import {spinLoading} from 'frontend/src/components/widgets/spinUtils';
import {DataEmptyStub} from 'frontend/src/components/widgets/stub/DataEmptyStub';
import {CopyableUIDComponent} from 'frontend/src/components/widgets/uid/CopyableUIDComponent';
import {PAGE_SIZE} from 'frontend/src/constants';
import {useAccessRightsContext} from 'frontend/src/context/hub/accessRights/AccessRightsProvider';
import {useDefaultPaginationConfig} from 'frontend/src/hook/useDefaultPaginationConfig';
import {i18} from 'frontend/src/i18';
import {compactArray, isEmptyArray} from 'frontend/src/utils/core/array/array';
import type {KeysOfUnion} from 'frontend/src/utils/core/typescript/typescriptAddons';
import {getICFirstKey} from 'frontend/src/utils/ic/did';
import {useCallback, useMemo} from 'react';
import type {AccessRight, Permission} from 'src/declarations/hub/hub.did';
import {allAccessRightPermissions} from './accessRightsUtils';

type ItemType = AccessRight;

const paginationConfig: PaginationConfig = {
    defaultPageSize: PAGE_SIZE.accessRights
};

export const AccessRightsList = () => {
    const {accessRights, feature, fetchAccessRights} = useAccessRightsContext();
    const {loaded, inProgress} = feature.status;
    const isError = feature.error.isError || isNullish(accessRights);

    const rowKey = useCallback((record: ItemType) => record.caller.toText(), []);

    const pagination = useDefaultPaginationConfig(paginationConfig);

    const componentLoading = useMemo(() => spinLoading(inProgress), [inProgress]);

    if (loaded) {
        if (isError) {
            return <ErrorAlertWithAction message={i18.status.accessRights.stub.error} action={<AlertActionButton onClick={fetchAccessRights} loading={inProgress} />} />;
        }
        if (isEmptyArray(accessRights)) {
            return <DataEmptyStub description={i18.status.accessRights.stub.empty} />;
        }
        return (
            <List<ItemType>
                rowKey={rowKey}
                dataSource={accessRights}
                pagination={pagination}
                loading={componentLoading}
                size="small"
                renderItem={(item, _index) => (
                    <List.Item>
                        <AccessRightsListItem item={item} />
                    </List.Item>
                )}
                split={true}
            />
        );
    } else {
        return <PanelLoadingComponent message={i18.status.accessRights.stub.loading} />;
    }
};

const AccessRightsListItem = ({item}: {item: AccessRight}) => {
    const description = fromNullable(item.description);
    return (
        <Flex vertical gap={16}>
            <KeyValueVertical label={i18.status.accessRights.principal} value={<CopyableUIDComponent uid={item.caller.toText()} />} />
            {nonNullish(description) ? <KeyValueVertical label={i18.status.accessRights.description} value={description} /> : null}
            <KeyValueVertical label={i18.status.accessRights.permissions} value={<ListOfPermissionsComponent permissions={item.permissions} />} />
        </Flex>
    );
};

const ListOfPermissionsComponent = (props: {permissions: AccessRight['permissions']}) => {
    const permissions: Array<KeysOfUnion<Permission>> = useMemo(() => {
        const permissionsValue = fromNullable(props.permissions);
        if (nonNullish(permissionsValue)) {
            const values = compactArray(permissionsValue.map((v) => getICFirstKey(v)));
            if (values.length > 0) {
                return values;
            }
        }
        return allAccessRightPermissions;
    }, [props.permissions]);

    return (
        <Flex vertical>
            {permissions.map((permissionType, i) => {
                return (
                    <Flex gap={8} key={i}>
                        - <span>{`${permissionType} `}</span>
                    </Flex>
                );
            })}
        </Flex>
    );
};
