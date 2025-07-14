import React, { useState, useEffect } from 'react';
import AdminNavigation from './AdminNavigation';
import AdminDashboard from '../features/admin/AdminDashboard';
import AnalyticsDashboard from '../features/admin/AnalyticsDashboard';
import DocumentUpload from '../features/admin/DocumentUpload';
import PlayerProfile from '../features/player/PlayerProfile';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, FileText, Search, Plus, Eye, Edit, Trash2 } from 'lucide-react';

const AdminLayout = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load user data from localStorage or API
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }

    // Load initial page data
    loadPageData(currentPage);
  }, [currentPage]);

  const loadPageData = async (page) => {
    setLoading(true);
    setError(null);

    try {
      switch (page) {
        case 'users':
          await loadUsers();
          break;
        case 'documents':
          await loadDocuments();
          break;
        default:
          // Dashboard and analytics load their own data
          break;
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load users');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      // Mock data for demo
      setUsers([
        { id: 1, name: 'John Smith', email: 'john@example.com', role: 'player', status: 'active', createdAt: '2024-01-15' },
        { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', role: 'coach', status: 'active', createdAt: '2024-01-14' },
        { id: 3, name: 'Mike Davis', email: 'mike@example.com', role: 'player', status: 'pending', createdAt: '2024-01-13' }
      ]);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/admin/documents', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load documents');
      }
      
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      // Mock data for demo
      setDocuments([
        { id: 1, filename: 'player_id_001.jpg', user: { name: 'John Smith' }, documentType: 'player_id', status: 'completed', createdAt: '2024-01-15' },
        { id: 2, filename: 'birth_certificate.pdf', user: { name: 'Sarah Johnson' }, documentType: 'birth_certificate', status: 'pending', createdAt: '2024-01-14' },
        { id: 3, filename: 'medical_clearance.pdf', user: { name: 'Mike Davis' }, documentType: 'medical', status: 'processing', createdAt: '2024-01-13' }
      ]);
    }
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const renderPageContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    switch (currentPage) {
      case 'dashboard':
        return <AdminDashboard />;
      
      case 'analytics':
        return <AnalyticsDashboard />;
      
      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Users</h1>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === 'active' ? 'success' : 'secondary'}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'documents':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold">Documents</h1>
              <DocumentUpload />
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>All Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {doc.filename}
                          </div>
                        </TableCell>
                        <TableCell>{doc.user?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.documentType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            doc.status === 'completed' ? 'success' :
                            doc.status === 'processing' ? 'default' :
                            doc.status === 'pending' ? 'secondary' : 'destructive'
                          }>
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'settings':
        return (
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Settings</h1>
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Settings panel coming soon...</p>
              </CardContent>
            </Card>
          </div>
        );
      
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AdminNavigation 
      currentUser={currentUser}
      onNavigate={handleNavigate}
      currentPage={currentPage}
    >
      {renderPageContent()}
    </AdminNavigation>
  );
};

export default AdminLayout;
