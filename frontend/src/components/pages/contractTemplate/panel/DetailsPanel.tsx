import {ExportOutlined} from '@ant-design/icons';
import {Flex} from 'antd';
import {ExternalLink} from 'frontend/src/components/widgets/ExternalLink';
import {KeyValueVertical} from 'frontend/src/components/widgets/KeyValueVertical';
import {PanelCard} from 'frontend/src/components/widgets/PanelCard';
import {PanelHeader} from 'frontend/src/components/widgets/PanelHeader';
import {QuestionPopover} from 'frontend/src/components/widgets/QuestionPopover';
import {CopyableUIDComponent} from 'frontend/src/components/widgets/uid/CopyableUIDComponent';
import {useContractTemplateContextSafe} from 'frontend/src/context/contractTemplate/ContractTemplateProvider';
import {i18} from 'frontend/src/i18';
import {formatDateTime, formatDuration} from 'frontend/src/utils/core/date/format';
import {useMemo} from 'react';

export const DetailsPanel = () => {
    const {
        contractTemplateInformation: {definition, registered, registrar}
    } = useContractTemplateContextSafe();

    const registeredText = useMemo(() => formatDateTime(Number(registered)), [registered]);

    const certificateDuration = useMemo(() => {
        const durationMillis = Number(definition.certificate_duration);
        return formatDuration(durationMillis);
    }, [definition.certificate_duration]);

    return (
        <PanelCard>
            <Flex vertical gap={16}>
                <PanelHeader title={i18.contractTemplate.details.panelDescription} />
                <Flex vertical gap={8}>
                    <KeyValueVertical label={i18.contractTemplate.details.status.title} value={<StatusValue />} />
                    <KeyValueVertical
                        label={i18.contractTemplate.details.certificateDuration}
                        value={
                            <span>
                                {`${certificateDuration} `}
                                <span className="gf-ant-color-secondary">
                                    <QuestionPopover content={`${definition.certificate_duration.toString()} milliseconds`} />
                                </span>
                            </span>
                        }
                    />
                    <KeyValueVertical label={i18.contractTemplate.details.registered} value={registeredText} />
                    <KeyValueVertical label={i18.contractTemplate.details.registrar} value={<CopyableUIDComponent uid={registrar.toString()} />} />
                    <KeyValueVertical
                        label={i18.contractTemplate.details.source}
                        value={
                            <Flex vertical>
                                <span>
                                    {i18.contractTemplate.details.sourceUrl}:{' '}
                                    <ExternalLink href={definition.source_url} className="gf-underline gf-underline-hover">
                                        {definition.source_url}
                                    </ExternalLink>{' '}
                                    <ExportOutlined className="gf-font-size-smaller" />
                                </span>
                                <span>
                                    {i18.contractTemplate.details.sourceTag}: {definition.source_tag}
                                </span>
                            </Flex>
                        }
                    />
                    <KeyValueVertical
                        label={i18.contractTemplate.details.documentationUrl}
                        value={
                            <span>
                                <ExternalLink href={definition.documentation_url} className="gf-underline gf-underline-hover">
                                    {definition.documentation_url}
                                </ExternalLink>{' '}
                                <ExportOutlined className="gf-font-size-smaller" />
                            </span>
                        }
                    />
                    <KeyValueVertical
                        label={i18.contractTemplate.details.termsOfUseUrl}
                        value={
                            <span>
                                <ExternalLink href={definition.terms_of_use_url} className="gf-underline gf-underline-hover">
                                    {definition.terms_of_use_url}
                                </ExternalLink>{' '}
                                <ExportOutlined className="gf-font-size-smaller" />
                            </span>
                        }
                    />
                    <KeyValueVertical label={i18.contractTemplate.details.wasmHash} value={<CopyableUIDComponent uid={definition.wasm_hash} />} />
                    <KeyValueVertical label={i18.contractTemplate.details.activationRequired} value={definition.activation_required ? 'Yes' : 'No'} />
                </Flex>
            </Flex>
        </PanelCard>
    );
};

const StatusValue = () => {
    const {dataAvailability} = useContractTemplateContextSafe();
    const contractTemplateBlocked = dataAvailability.type == 'blocked';

    if (contractTemplateBlocked) {
        return (
            <span>
                {`${i18.contractTemplate.details.status.blocked} `}
                <span className="gf-ant-color-secondary">
                    <QuestionPopover content={dataAvailability.reason} title={i18.contractTemplate.details.status.modal.blocked.title} />
                </span>
            </span>
        );
    }
    return i18.contractTemplate.details.status.active;
};
