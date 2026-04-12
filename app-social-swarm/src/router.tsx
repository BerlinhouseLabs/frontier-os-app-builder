import { createBrowserRouter } from 'react-router-dom';
import { Layout } from './views/Layout';
import { Home } from './views/Home';
import { CampaignList } from './views/CampaignList';
import { CampaignCreator } from './views/CampaignCreator';
import { CampaignDetail } from './views/CampaignDetail';
import { ContentFeed } from './views/ContentFeed';
import { ContentDetail } from './views/ContentDetail';
import { SwarmAgents } from './views/SwarmAgents';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'campaigns', element: <CampaignList /> },
      { path: 'campaigns/new', element: <CampaignCreator /> },
      { path: 'campaigns/:campaignId', element: <CampaignDetail /> },
      { path: 'content', element: <ContentFeed /> },
      { path: 'content/:contentId', element: <ContentDetail /> },
      { path: 'agents', element: <SwarmAgents /> },
    ],
  },
]);
