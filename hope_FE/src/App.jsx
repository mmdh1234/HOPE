import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/route.jsx';

const App = () => {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
};

export default App;