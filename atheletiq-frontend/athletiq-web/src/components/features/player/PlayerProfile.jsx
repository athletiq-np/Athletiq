import React, { useState, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Calendar, 
  Trophy, 
  FileText, 
  Upload, 
  Edit,
  Save,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import DocumentUpload from './DocumentUpload';

const PlayerProfile = ({ playerId, isEditable = false }) => {
  const [player, setPlayer] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [error, setError] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (playerId) {
      fetchPlayerData();
    }
  }, [playerId]);

  const fetchPlayerData = async () => {
    try {
      setLoading(true);
      
      // Fetch player profile
      const playerResponse = await fetch(`/api/players/${playerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!playerResponse.ok) {
        throw new Error('Failed to fetch player data');
      }

      const playerData = await playerResponse.json();
      setPlayer(playerData);
      setEditForm(playerData);

      // Fetch player documents
      const docsResponse = await fetch(`/api/players/${playerId}/documents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (docsResponse.ok) {
        const docsData = await docsResponse.json();
        setDocuments(docsData.documents || []);
      }

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/players/${playerId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error('Failed to update player');
      }

      const updatedPlayer = await response.json();
      setPlayer(updatedPlayer);
      setEditing(false);
      setError(null);

    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm(player);
    setEditing(false);
  };

  const handleUploadComplete = (result) => {
    setDocuments(prev => [...prev, result.document]);
    setShowUpload(false);
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
      suspended: 'destructive',
      pending: 'default'
    };
    
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getDocumentStatusBadge = (status) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      completed: 'success',
      approved: 'success',
      rejected: 'destructive',
      error: 'destructive'
    };
    
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!player) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Player not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {editing ? (
                <Input
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="text-2xl font-bold"
                />
              ) : (
                player.name
              )}
            </h1>
            <p className="text-gray-600">{player.email}</p>
          </div>
        </div>
        
        {isEditable && (
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Player Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Full Name</Label>
              {editing ? (
                <Input
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                />
              ) : (
                <p className="text-lg">{player.name}</p>
              )}
            </div>

            <div>
              <Label>Date of Birth</Label>
              {editing ? (
                <Input
                  type="date"
                  value={editForm.dateOfBirth || ''}
                  onChange={(e) => setEditForm({...editForm, dateOfBirth: e.target.value})}
                />
              ) : (
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {player.dateOfBirth ? new Date(player.dateOfBirth).toLocaleDateString() : 'Not provided'}
                </p>
              )}
            </div>

            <div>
              <Label>Location</Label>
              {editing ? (
                <Input
                  value={editForm.location || ''}
                  onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                />
              ) : (
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {player.location || 'Not provided'}
                </p>
              )}
            </div>

            <div>
              <Label>Status</Label>
              {editing ? (
                <Select
                  value={editForm.status || ''}
                  onValueChange={(value) => setEditForm({...editForm, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                getStatusBadge(player.status)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Athletic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Sport</Label>
              {editing ? (
                <Input
                  value={editForm.sport || ''}
                  onChange={(e) => setEditForm({...editForm, sport: e.target.value})}
                />
              ) : (
                <p className="text-lg">{player.sport || 'Not specified'}</p>
              )}
            </div>

            <div>
              <Label>Position</Label>
              {editing ? (
                <Input
                  value={editForm.position || ''}
                  onChange={(e) => setEditForm({...editForm, position: e.target.value})}
                />
              ) : (
                <p>{player.position || 'Not specified'}</p>
              )}
            </div>

            <div>
              <Label>Team/Club</Label>
              {editing ? (
                <Input
                  value={editForm.team || ''}
                  onChange={(e) => setEditForm({...editForm, team: e.target.value})}
                />
              ) : (
                <p>{player.team || 'Not specified'}</p>
              )}
            </div>

            <div>
              <Label>Athlete ID</Label>
              <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                {player.athleteId || 'Not generated'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </CardTitle>
            {isEditable && !showUpload && (
              <Button onClick={() => setShowUpload(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showUpload && (
            <div className="mb-6">
              <DocumentUpload onUploadComplete={handleUploadComplete} />
              <Button 
                variant="outline" 
                onClick={() => setShowUpload(false)}
                className="mt-4"
              >
                Cancel Upload
              </Button>
            </div>
          )}

          {documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">{doc.filename}</p>
                      <p className="text-sm text-gray-500">
                        {doc.documentType} • Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getDocumentStatusBadge(doc.status)}
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No documents uploaded yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerProfile;
