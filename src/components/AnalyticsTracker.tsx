import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '../lib/analytics';

const toolByPath: Record<string, string> = {
  '/expenses': 'expenses',
  '/income': 'income',
  '/budget': 'budget',
  '/bills': 'bills',
  '/savings': 'savings',
  '/debts': 'debts',
  '/reports': 'reports',
};

export function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    void analytics.pageView(path);

    const toolName = toolByPath[path];
    if (toolName) void analytics.event('tool_used', { tool_name: toolName, action: 'open' });
    if (path === '/planner') void analytics.event('planner_used', { action: 'open' });
    if (path === '/insights') void analytics.event('insights_viewed', { period: 'current' });
  }, [location.pathname]);

  return null;
}
