import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './views/Layout';
import { Home } from './views/Home';
import { AgentList } from './views/AgentList';
import { AgentDetail } from './views/AgentDetail';
import { RegisterAgent } from './views/RegisterAgent';
import { MyAgents } from './views/MyAgents';
import { PaymentHistory } from './views/PaymentHistory';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'market', element: <AgentList /> },
      { path: 'agent/:agentId', element: <AgentDetail /> },
      { path: 'register', element: <RegisterAgent /> },
      { path: 'my-agents', element: <MyAgents /> },
      { path: 'payments', element: <PaymentHistory /> },
    ],
  },
]);
