import {Flex} from 'antd';
import {DefaultButton} from 'frontend/src/components/widgets/button/DefaultButton';
import {ReloadIconButton} from 'frontend/src/components/widgets/button/ReloadIconButton';
import {PanelCard} from 'frontend/src/components/widgets/PanelCard';
import {PanelHeader} from 'frontend/src/components/widgets/PanelHeader';
import {useLoggerEventsProviderContext} from 'frontend/src/context/logger/LoggerEventsProvider';
import {i18} from 'frontend/src/i18';
import {formatDateTime} from 'frontend/src/utils/core/date/format';
import {downloadStringsAsFile} from 'frontend/src/utils/core/file/downloadStringsAsFile';
import {jsonStringify} from 'frontend/src/utils/core/json/json';
import {safeSerializeLogEntry} from 'frontend/src/utils/logger/Logger';
import {useCallback, useEffect} from 'react';
import {LoggerEventsTable} from './LoggerEventsTable';

export const LoggerEventsPanel = () => {
    const {fetchLoggerEvents} = useLoggerEventsProviderContext();

    useEffect(() => {
        fetchLoggerEvents();
    }, [fetchLoggerEvents]);

    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <Flex justify="space-between">
                    <PanelHeader title={i18.status.loggerEvents.panelTitle} />
                    <Flex gap={8}>
                        <ExportButton />
                        <RefreshButton />
                    </Flex>
                </Flex>
                <div>{i18.status.loggerEvents.panelDescription}</div>
                <LoggerEventsTable />
            </Flex>
        </PanelCard>
    );
};

const ExportButton = () => {
    const {loggerEvents, feature} = useLoggerEventsProviderContext();

    const onClick = useCallback(() => {
        const lines = loggerEvents.map(safeSerializeLogEntry).map((entry) =>
            jsonStringify({
                uid: entry.uid,
                timestamp: entry.timestamp,
                date: formatDateTime(entry.timestamp),
                level: entry.level,
                prefix: entry.prefix,
                message: entry.message,
                args: entry.args
            })
        );
        downloadStringsAsFile(lines);
    }, [loggerEvents]);

    if (feature.error.isError) {
        return null;
    }

    const {inProgress, loaded} = feature.status;
    const disabled = inProgress || !loaded;
    return (
        <DefaultButton onClick={onClick} disabled={disabled} loading={inProgress}>
            Export
        </DefaultButton>
    );
};

const RefreshButton = () => {
    const {feature, fetchLoggerEvents} = useLoggerEventsProviderContext();
    if (feature.error.isError) {
        return null;
    }
    const {inProgress, loaded} = feature.status;
    const disabled = inProgress || !loaded;
    return <ReloadIconButton onClick={() => fetchLoggerEvents()} disabled={disabled} loading={inProgress} />;
};
