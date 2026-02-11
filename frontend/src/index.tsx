import ReactDOM from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {AppEntryPoint} from './components/AppEntryPoint';

import 'antd/dist/reset.css';
import './css/alert.css';
import './css/antd_overrides.css';
import './css/colors.css';
import './css/skeleton.css';
import './css/typography.css';
import './css/widget.css';

import './css/projectSpecific.css';

const rootElement = document.getElementById('root');
if (rootElement != undefined) {
    ReactDOM.createRoot(rootElement).render(
        <BrowserRouter
            future={{
                v7_startTransition: false,
                v7_relativeSplatPath: false
            }}>
            <AppEntryPoint />
        </BrowserRouter>
    );
} else {
    console.error('Root element not found');
}
