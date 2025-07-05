import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/components/layout/AdminLayout';
import GlobalAdminDashboard from '@/components/features/admin/GlobalAdminDashboard';
import AnalyticsDashboard from '@/components/features/admin/AnalyticsDashboard';
import DocumentUpload from '@/components/features/admin/DocumentUpload';
import PlayerProfile from '@/components/features/player/PlayerProfile';

const ComponentShowcase = () => {
  const [selectedComponent, setSelectedComponent] = useState('admin-layout');

  const components = [
    {
      id: 'admin-layout',
      title: 'Admin Layout',
      description: 'Complete admin interface with navigation and routing',
      component: <AdminLayout />
    },
    {
      id: 'admin-dashboard',
      title: 'Global Admin Dashboard',
      description: 'Modern global-ready dashboard with i18n, dark mode, and premium features',
      component: <GlobalAdminDashboard />
    },
    {
      id: 'analytics-dashboard',
      title: 'Analytics Dashboard',
      description: 'Analytics and metrics visualization',
      component: <AnalyticsDashboard />
    },
    {
      id: 'document-upload',
      title: 'Document Upload',
      description: 'File upload with drag & drop and progress tracking',
      component: <DocumentUpload onUploadComplete={(result) => console.log('Upload complete:', result)} />
    },
    {
      id: 'player-profile',
      title: 'Player Profile',
      description: 'Player information and document management',
      component: <PlayerProfile playerId="demo-player" isEditable={true} />
    }
  ];

  const currentComponent = components.find(c => c.id === selectedComponent);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              AthletiQ Component Showcase
            </h1>
            <p className="text-gray-600">
              Explore the components built for the AthletiQ platform
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Component List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Components</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {components.map((component) => (
                    <Button
                      key={component.id}
                      variant={selectedComponent === component.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedComponent(component.id)}
                    >
                      {component.title}
                    </Button>
                  ))}
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>UI Components</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Installed shadcn/ui components:</h4>
                      <div className="flex flex-wrap gap-1">
                        {['Button', 'Card', 'Input', 'Form', 'Table', 'Badge', 'Alert', 'Progress', 'Select', 'Dropdown', 'Textarea', 'Sheet'].map(comp => (
                          <Badge key={comp} variant="secondary" className="text-xs">
                            {comp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Custom components:</h4>
                      <div className="flex flex-wrap gap-1">
                        {['DocumentUpload', 'PlayerProfile', 'AdminDashboard', 'AnalyticsDashboard', 'AdminNavigation'].map(comp => (
                          <Badge key={comp} variant="outline" className="text-xs">
                            {comp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Component Display */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>{currentComponent?.title}</CardTitle>
                  <p className="text-gray-600">{currentComponent?.description}</p>
                </CardHeader>
                <CardContent>
                  {selectedComponent === 'admin-layout' ? (
                    <div className="h-screen -m-6">
                      {currentComponent?.component}
                    </div>
                  ) : (
                    <div className="border rounded-lg p-6 bg-white">
                      {currentComponent?.component}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Features Overview */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>🎨 Design System</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• shadcn/ui components</li>
                  <li>• Tailwind CSS styling</li>
                  <li>• Consistent design tokens</li>
                  <li>• Responsive layouts</li>
                  <li>• Dark mode support</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>⚡ Functionality</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• File upload with drag & drop</li>
                  <li>• Real-time progress tracking</li>
                  <li>• Document management</li>
                  <li>• User profile editing</li>
                  <li>• Admin dashboard</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🔧 Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Backend API integration</li>
                  <li>• Authentication handling</li>
                  <li>• Error boundary management</li>
                  <li>• Loading states</li>
                  <li>• Form validation</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentShowcase;
