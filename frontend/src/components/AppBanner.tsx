import {useConfigDataContext} from '../context/hub/config/ConfigDataProvider';
import {i18} from '../i18';
import {WarningAlert} from './widgets/alert/WarningAlert';

export const AppBanner = () => {
    const {hubDataAvailability} = useConfigDataContext();

    if (hubDataAvailability.type !== 'available') {
        return null;
    }

    const {hubConfig} = hubDataAvailability;
    if (hubConfig.is_deployment_available) {
        return null;
    }

    return (
        <div className="skBannerRow">
            <WarningAlert message={i18.banner.title} description={i18.banner.description} large />
        </div>
    );
};
