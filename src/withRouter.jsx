import { useLocation, useNavigate, useParams } from 'react-router-dom';

/**
 * react-router v6 stopped injecting location/history props into components, and
 * class components can't call hooks. This restores the pieces this app uses.
 */
export default function withRouter(Wrapped) {
    function WithRouter(props) {
        const location = useLocation();
        const navigate = useNavigate();
        const params = useParams();
        return <Wrapped {...props} location={location} navigate={navigate} params={params} />;
    }
    WithRouter.displayName = `withRouter(${Wrapped.displayName || Wrapped.name || 'Component'})`;
    return WithRouter;
}
