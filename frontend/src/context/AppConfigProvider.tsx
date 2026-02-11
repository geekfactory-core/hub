import {App, ConfigProvider, theme, type ThemeConfig} from 'antd';
import type {PropsWithChildren} from 'react';
import {useMemo} from 'react';
import {useMediaTheme} from './mediaTheme/MediaThemeProvider';

export const AppConfigProvider = (props: PropsWithChildren) => {
    const {resolvedTheme} = useMediaTheme();

    const tokenValue = useMemo<ThemeConfig['token']>(() => {
        const mainColor: string | undefined = resolvedTheme == 'light' ? '#000000' : '#FFFFFF';
        return {
            fontSize: 14,
            colorPrimary: mainColor,
            colorInfo: mainColor,
            fontFamily: 'var(--ant-font-family-code)',
            borderRadius: 0
        };
    }, [resolvedTheme]);

    const componentsValue = useMemo<ThemeConfig['components']>(() => {
        return {
            Form: {
                labelColor: 'var(--ant-color-text-description)',
                verticalLabelPadding: '0 0 2px'
            },
            Typography: {
                titleMarginTop: 0,
                titleMarginBottom: 0
            },
            Menu: {
                colorBgContainer: 'transparent'
            },
            Result: {
                iconFontSize: 48,
                titleFontSize: 16
            },
            Select: {
                optionSelectedColor: 'white'
            },
            Steps: {
                descriptionMaxWidth: 400
            }
        };
    }, []);

    const lightTheme = useMemo<ThemeConfig>(() => {
        return {
            algorithm: theme.defaultAlgorithm,
            cssVar: true,
            hashed: false,
            token: tokenValue,
            components: {
                ...componentsValue,
                Button: {
                    primaryShadow: 'none'
                }
            }
        };
    }, [componentsValue, tokenValue]);

    const darkTheme = useMemo<ThemeConfig>(() => {
        return {
            algorithm: theme.darkAlgorithm,
            cssVar: true,
            hashed: false,
            token: tokenValue,
            components: {
                ...componentsValue,
                Button: {
                    primaryColor: '#000000',
                    primaryShadow: 'none'
                },
                Checkbox: {
                    colorWhite: '#000000'
                }
            }
        };
    }, [componentsValue, tokenValue]);

    const currentThemeConfig = useMemo(() => {
        return resolvedTheme == 'dark' ? darkTheme : lightTheme;
    }, [resolvedTheme, darkTheme, lightTheme]);

    return (
        <ConfigProvider theme={currentThemeConfig}>
            <App className="antdAppComponent">{props.children}</App>
        </ConfigProvider>
    );
};
