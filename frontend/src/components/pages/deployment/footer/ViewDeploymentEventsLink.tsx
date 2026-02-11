import {RouterPaths} from 'frontend/src/components/pages/skeleton/Router';
import {useContractTemplateContextSafe} from 'frontend/src/context/contractTemplate/ContractTemplateProvider';
import {useDeploymentContextSafe} from 'frontend/src/context/deployment/DeploymentProvider';
import {i18} from 'frontend/src/i18';
import {Link} from 'react-router-dom';

export const ViewDeploymentEventsLink = () => {
    const {contractTemplateId} = useContractTemplateContextSafe();
    const {deployment} = useDeploymentContextSafe();

    return (
        <Link to={RouterPaths.deploymentEvents(contractTemplateId.toString(), deployment.deployment_id.toString())} className="gf-underline gf-underline-hover">
            {i18.deployment.viewAllEvents}
        </Link>
    );
};
