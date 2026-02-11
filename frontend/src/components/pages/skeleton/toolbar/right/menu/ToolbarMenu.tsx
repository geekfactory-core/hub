import {ExportOutlined, MenuOutlined} from '@ant-design/icons';
import type {DropdownProps, MenuProps} from 'antd';
import {Dropdown, Flex, Modal, Switch} from 'antd';
import type {SwitchClickEventHandler} from 'antd/es/switch';
import {sendOpenConnectModalNotification} from 'frontend/src/components/pages/auth/ConnectModalRenderer';
import {DefaultButton} from 'frontend/src/components/widgets/button/DefaultButton';
import {ExternalLink} from 'frontend/src/components/widgets/ExternalLink';
import {useAuthContext} from 'frontend/src/context/auth/AuthProvider';
import {useMediaTheme} from 'frontend/src/context/mediaTheme/MediaThemeProvider';
import {i18} from 'frontend/src/i18';
import {compactArray} from 'frontend/src/utils/core/array/array';
import type {MenuInfo} from 'rc-menu/lib/interface';
import {useCallback, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {PATH_CONTRACT_TEMPLATES, PATH_HOME, PATH_MY_DEPLOYMENTS, PATH_STATUS, PATH_VALIDATE_CONTRACT, RouterPaths} from '../../../Router';

const menuConnectKey = 'connect';
const menuDisconnectKey = 'disconnect';
const menuDarkModeKey = 'darkMode';

export const ToolbarMenu = () => {
    const {logout, isAuthenticated} = useAuthContext();
    const [disconnectModal, disconnectModalContextHolder] = Modal.useModal();
    const {toggleTheme} = useMediaTheme();

    const [open, setOpen] = useState(false);

    const handleDisconnect = useCallback(() => {
        disconnectModal.confirm({
            open: true,
            title: i18.auth.disconnect.confirmationModal.title,
            icon: null,
            content: i18.auth.disconnect.confirmationModal.description,
            onOk: logout,
            okText: i18.auth.disconnect.confirmationModal.button,
            okButtonProps: {
                danger: true,
                className: 'gf-flex-auto'
            },
            cancelButtonProps: {className: 'gf-flex-auto'},
            autoFocusButton: null,
            closable: false,
            maskClosable: false,
            keyboard: false
        });
    }, [logout, disconnectModal]);

    const handleMenuClick: MenuProps['onClick'] = useCallback(
        (info: MenuInfo) => {
            switch (info.key) {
                case menuConnectKey: {
                    sendOpenConnectModalNotification();
                    setOpen(false);
                    break;
                }
                case menuDisconnectKey: {
                    handleDisconnect();
                    setOpen(false);
                    break;
                }
                case menuDarkModeKey: {
                    toggleTheme();
                    break;
                }
                default: {
                    setOpen(false);
                }
            }
        },
        [handleDisconnect, toggleTheme]
    );

    const handleOpenChange: DropdownProps['onOpenChange'] = (nextOpen, info) => {
        if (info.source == 'trigger' || nextOpen) {
            setOpen(nextOpen);
        }
    };

    const items: MenuProps['items'] = useMemo(() => {
        return compactArray([
            {
                key: 'home',
                label: <Link to={PATH_HOME}>{i18.toolbar.menu.home}</Link>
            },
            {
                key: 'contractTemplates',
                label: <Link to={PATH_CONTRACT_TEMPLATES}>{i18.toolbar.menu.contractTemplates}</Link>
            },
            {
                key: 'validate',
                label: <Link to={PATH_VALIDATE_CONTRACT}>{i18.toolbar.menu.validateContract}</Link>
            },
            {
                key: 'status',
                label: <Link to={PATH_STATUS}>{i18.toolbar.menu.status}</Link>
            },
            isAuthenticated ? {type: 'divider'} : undefined,
            isAuthenticated
                ? {
                      key: 'myDeployments',
                      label: <Link to={PATH_MY_DEPLOYMENTS}>{i18.toolbar.menu.myDeployments}</Link>
                  }
                : undefined,
            {type: 'divider'},
            {key: menuDarkModeKey, label: <DarkMode />},
            {type: 'divider'},
            {
                key: 'terms',
                label: (
                    <ExternalLink href={RouterPaths.externalTermsOfUsePage()}>
                        {i18.toolbar.menu.termsOfUse} <ExportOutlined className="gf-font-size-smaller" />
                    </ExternalLink>
                )
            },
            {
                key: 'sourceCode',
                label: (
                    <ExternalLink href={RouterPaths.externalRepositoryPage()}>
                        {i18.toolbar.menu.sourceCode} <ExportOutlined className="gf-font-size-smaller" />
                    </ExternalLink>
                )
            },
            {
                key: 'faq',
                label: (
                    <ExternalLink href={RouterPaths.externalFAQPage()}>
                        {i18.toolbar.menu.faq} <ExportOutlined className="gf-font-size-smaller" />
                    </ExternalLink>
                )
            },
            {type: 'divider'},
            isAuthenticated
                ? {
                      key: menuDisconnectKey,
                      label: i18.auth.disconnect.disconnectButton
                  }
                : {
                      key: menuConnectKey,
                      label: i18.auth.connect.connectButton,
                      type: 'primary'
                  }
        ]) as MenuProps['items'];
    }, [isAuthenticated]);

    return (
        <>
            <Dropdown menu={{items, style: {minWidth: '200px'}, onClick: handleMenuClick}} placement="bottomRight" trigger={['click']} open={open} onOpenChange={handleOpenChange}>
                <DefaultButton icon={<MenuOutlined />} />
            </Dropdown>
            {disconnectModalContextHolder}
        </>
    );
};

const DarkMode = () => {
    const {resolvedTheme, toggleTheme} = useMediaTheme();
    const checked = resolvedTheme == 'dark';

    const onClick: SwitchClickEventHandler = useCallback(
        (_checked, event) => {
            event.stopPropagation();
            event.preventDefault();
            toggleTheme();
            return false;
        },
        [toggleTheme]
    );

    return (
        <Flex gap={8} align="center" justify="space-between">
            <span>{i18.toolbar.menu.darkMode}</span>
            <Switch checked={checked} onClick={onClick} size="small" />
        </Flex>
    );
};
