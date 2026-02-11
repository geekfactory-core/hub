import {Flex} from 'antd';
import {ReloadIconButton} from 'frontend/src/components/widgets/button/ReloadIconButton';
import {KeyValueVertical} from 'frontend/src/components/widgets/KeyValueVertical';
import {PanelCard} from 'frontend/src/components/widgets/PanelCard';
import {PanelHeader} from 'frontend/src/components/widgets/PanelHeader';
import {useCanisterStatusContext} from 'frontend/src/context/ic/canisterStatus/CanisterStatusProvider';
import {i18} from 'frontend/src/i18';
import {type ReactNode, useCallback, useEffect} from 'react';
import {CanisterId} from './CanisterId';
import {Controllers} from './Controllers';
import {Cycles} from './Cycles';
import {IdleCyclesBurnedPerDay} from './IdleCyclesBurnedPerDay';
import {LogVisibilityValue} from './LogVisibilityValue';
import {MemorySize} from './MemorySize';
import {ModuleHash} from './ModuleHash';
import {NumCallsTotal} from './NumCallsTotal';
import {NumInstructionsTotal} from './NumInstructionsTotal';
import {RequestPayloadTotal} from './RequestPayloadTotal';
import {ReservedCycles} from './ReservedCycles';
import {ResponsePayloadTotal} from './ResponsePayloadTotal';
import {SubnetId} from './SubnetId';

type Props = {
    panelTitle: ReactNode;
};

export const CanisterStatusPanel = (props: Props) => {
    const {panelTitle} = props;
    const {
        canisterStatus: {fetchCanisterStatus},
        canisterMetadataStatus: {fetchCanisterMetadataStatus}
    } = useCanisterStatusContext();

    useEffect(() => {
        fetchCanisterStatus();
    }, [fetchCanisterStatus]);

    useEffect(() => {
        fetchCanisterMetadataStatus();
    }, [fetchCanisterMetadataStatus]);

    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <Header panelTitle={panelTitle} />
                <Flex vertical gap={8}>
                    <CanisterStatusContent />
                    <CanisterMetadataStatusContent />
                </Flex>
            </Flex>
        </PanelCard>
    );
};

const CanisterStatusContent = () => {
    return (
        <>
            <Flex vertical gap={8}>
                <KeyValueVertical label={i18.status.canisterStatus.canisterId} value={<CanisterId />} />
                <KeyValueVertical label={i18.status.canisterStatus.cycles} value={<Cycles />} />
                <KeyValueVertical label={i18.status.canisterStatus.memory} value={<MemorySize />} />
                <KeyValueVertical label={i18.status.canisterStatus.idleCyclesBurnedPerDay} value={<IdleCyclesBurnedPerDay />} />
                <KeyValueVertical label={i18.status.canisterStatus.reservedCycles} value={<ReservedCycles />} />
                <KeyValueVertical label={i18.status.canisterStatus.requestPayloadTotal} value={<RequestPayloadTotal />} />
                <KeyValueVertical label={i18.status.canisterStatus.responsePayloadTotal} value={<ResponsePayloadTotal />} />
                <KeyValueVertical label={i18.status.canisterStatus.numberOfCalls} value={<NumCallsTotal />} />
                <KeyValueVertical label={i18.status.canisterStatus.numberOfInstructions} value={<NumInstructionsTotal />} />
                <KeyValueVertical label={i18.status.canisterStatus.logVisibility.label} value={<LogVisibilityValue />} />
            </Flex>
        </>
    );
};

const CanisterMetadataStatusContent = () => {
    return (
        <Flex vertical gap={8}>
            <KeyValueVertical label={i18.status.canisterStatus.controllers} value={<Controllers />} />
            <KeyValueVertical label={i18.status.canisterStatus.moduleHash} value={<ModuleHash />} />
            <KeyValueVertical label={i18.status.canisterStatus.subnetId} value={<SubnetId />} />
        </Flex>
    );
};

const Header = (props: {panelTitle: ReactNode}) => {
    const {panelTitle} = props;

    return (
        <Flex justify="space-between">
            <PanelHeader title={panelTitle} />
            <RefreshButton />
        </Flex>
    );
};

const RefreshButton = () => {
    const {
        canisterStatus: {feature: canisterStatusFeature, fetchCanisterStatus},
        canisterMetadataStatus: {feature: canisterMetadataStatusFeature, fetchCanisterMetadataStatus}
    } = useCanisterStatusContext();
    const inProgress = canisterStatusFeature.status.inProgress || canisterMetadataStatusFeature.status.inProgress;
    const loaded = canisterStatusFeature.status.loaded && canisterMetadataStatusFeature.status.loaded;

    const fetchAll = useCallback(() => {
        fetchCanisterStatus();
        fetchCanisterMetadataStatus();
    }, [fetchCanisterMetadataStatus, fetchCanisterStatus]);

    const disabled = inProgress || !loaded;
    return <ReloadIconButton onClick={fetchAll} disabled={disabled} loading={inProgress} />;
};
