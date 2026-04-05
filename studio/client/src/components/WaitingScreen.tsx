import { useState } from 'react';

interface Template {
  name: string;
  description: string;
  modules: string[];
  command: string;
}

const TEMPLATES: Template[] = [
  {
    name: 'Tip Jar',
    description: 'Send quick FND tips to other Frontier members',
    modules: ['Wallet', 'User', 'Storage'],
    command: '/fos:new-app "a tip jar where Frontier members send quick FND tips to each other"',
  },
  {
    name: 'Food Market',
    description: 'Peer-to-peer food marketplace for the community',
    modules: ['Wallet', 'User', 'Communities'],
    command: '/fos:new-app "a peer-to-peer food marketplace for Frontier Tower citizens"',
  },
  {
    name: 'Event Booker',
    description: 'Browse and book community events and meetups',
    modules: ['Events', 'User', 'Storage'],
    command: '/fos:new-app "an event booking app for Frontier community events and meetups"',
  },
  {
    name: 'Office Access',
    description: 'Manage building access passes and room bookings',
    modules: ['Offices', 'User', 'Storage'],
    command: '/fos:new-app "a building access and room booking app for Frontier Tower offices"',
  },
  {
    name: 'NFT Gallery',
    description: 'Showcase and trade community NFT collections',
    modules: ['Wallet', 'User', 'Chain'],
    command: '/fos:new-app "an NFT gallery where members showcase and trade community collections"',
  },
  {
    name: 'Task Board',
    description: 'Collaborative task management with bounty rewards',
    modules: ['Wallet', 'User', 'Storage'],
    command: '/fos:new-app "a collaborative task board with FND bounty rewards for completed tasks"',
  },
];

function TemplateCard({ template }: { template: Template }) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(template.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <button
      onClick={handleClick}
      className="text-left p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-gray-600 hover:bg-gray-800 transition-all group"
    >
      <h3 className="text-sm font-semibold text-gray-200 group-hover:text-white">
        {template.name}
      </h3>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
        {template.description}
      </p>
      <div className="flex flex-wrap gap-1 mt-2">
        {template.modules.map(m => (
          <span key={m} className="text-xs px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-400">
            {m}
          </span>
        ))}
      </div>
      {copied && (
        <p className="text-xs text-green-400 mt-1.5">Command copied!</p>
      )}
    </button>
  );
}

export function WaitingScreen() {
  return (
    <div className="h-full overflow-auto flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Frontier Studio</h1>
          <p className="text-sm text-gray-400">Build Frontier OS apps with AI</p>
        </div>

        {/* Getting started */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-3">To get started, open a terminal and run:</p>
          <div className="bg-gray-900 rounded-lg px-4 py-3 font-mono text-sm">
            <p className="text-gray-500">$ <span className="text-blue-400">claude</span></p>
            <p className="text-gray-500">&gt; <span className="text-green-400">/fos:new-app "describe your app idea"</span></p>
          </div>
        </div>

        {/* Templates */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-3">
            Example apps you can build <span className="text-gray-600 normal-case font-normal">(click to copy command)</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TEMPLATES.map(t => (
              <TemplateCard key={t.name} template={t} />
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="text-center">
          <p className="text-xs text-gray-600 leading-relaxed">
            Frontier Studio watches your project and shows real-time updates as Claude Code builds.
            <br />
            The workflow: <span className="text-gray-500">new-app</span> &rarr; <span className="text-gray-500">discuss</span> &rarr; <span className="text-gray-500">plan</span> &rarr; <span className="text-gray-500">execute</span> &rarr; <span className="text-gray-500">ship</span>
          </p>
        </div>
      </div>
    </div>
  );
}
