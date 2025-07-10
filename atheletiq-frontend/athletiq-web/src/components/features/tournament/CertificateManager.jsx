import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Download, 
  Eye, 
  Plus, 
  Filter, 
  Search, 
  CheckCircle, 
  XCircle,
  Award,
  Users,
  Calendar,
  FileText,
  BarChart3,
  Settings
} from 'lucide-react';
import {
  getTournamentCertificates,
  getCertificateTemplates,
  createCertificateTemplate,
  generateCertificate,
  bulkGenerateCertificates,
  createCertificateDownloadLink,
  getCertificateStats
} from '../../../api/certificateApi';
import CertificateTemplateModal from './CertificateTemplateModal';
import CertificateGenerationModal from './CertificateGenerationModal';
import CertificateStatsWidget from './CertificateStatsWidget';

const CertificateManager = ({ tournamentId, tournamentName }) => {
  // State management
  const [certificates, setCertificates] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterParticipant, setFilterParticipant] = useState('all');

  // Load data on component mount
  useEffect(() => {
    if (tournamentId) {
      loadCertificateData();
    }
  }, [tournamentId]);

  const loadCertificateData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [certificatesRes, templatesRes, statsRes] = await Promise.all([
        getTournamentCertificates(tournamentId),
        getCertificateTemplates(tournamentId),
        getCertificateStats(tournamentId)
      ]);
      
      setCertificates(certificatesRes.data.certificates || []);
      setTemplates(templatesRes.data.templates || []);
      setStats(statsRes.data || {});
    } catch (err) {
      setError(err.message || 'Failed to load certificate data');
      console.error('Error loading certificate data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle template creation
  const handleCreateTemplate = async (templateData) => {
    try {
      await createCertificateTemplate(tournamentId, templateData);
      await loadCertificateData(); // Refresh data
      setShowTemplateModal(false);
    } catch (err) {
      setError(err.message || 'Failed to create template');
    }
  };

  // Handle certificate generation
  const handleGenerateCertificate = async (certificateData) => {
    try {
      if (Array.isArray(certificateData)) {
        // Bulk generation
        await bulkGenerateCertificates(tournamentId, certificateData);
      } else {
        // Single generation
        await generateCertificate(tournamentId, certificateData);
      }
      await loadCertificateData(); // Refresh data
      setShowGenerationModal(false);
    } catch (err) {
      setError(err.message || 'Failed to generate certificate');
    }
  };

  // Handle certificate download
  const handleDownloadCertificate = async (certificate) => {
    try {
      const filename = `${certificate.participant_name}_${certificate.certificate_type}_certificate.pdf`;
      await createCertificateDownloadLink(certificate.id, filename);
    } catch (err) {
      setError(err.message || 'Failed to download certificate');
    }
  };

  // Filter certificates
  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = cert.participant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.certificate_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || cert.certificate_type === filterType;
    const matchesParticipant = filterParticipant === 'all' || cert.participant_type === filterParticipant;
    
    return matchesSearch && matchesType && matchesParticipant;
  });

  // Certificate type options
  const certificateTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'participation', label: 'Participation' },
    { value: 'winner', label: 'Winner' },
    { value: 'runner_up', label: 'Runner Up' },
    { value: 'achievement', label: 'Achievement' }
  ];

  // Participant type options
  const participantTypes = [
    { value: 'all', label: 'All Participants' },
    { value: 'player', label: 'Players' },
    { value: 'team', label: 'Teams' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading certificate data...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Award className="mr-2 h-6 w-6 text-yellow-500" />
              Certificate Management
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage certificates for {tournamentName}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </button>
            <button
              onClick={() => setShowGenerationModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <Trophy className="mr-2 h-4 w-4" />
              Generate Certificates
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mt-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'certificates', label: 'Certificates', icon: Award },
            { id: 'templates', label: 'Templates', icon: FileText },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg flex items-center ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-800">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <CertificateOverview 
            stats={stats} 
            certificates={certificates}
            templates={templates}
          />
        )}

        {activeTab === 'certificates' && (
          <CertificatesList
            certificates={filteredCertificates}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterType={filterType}
            setFilterType={setFilterType}
            filterParticipant={filterParticipant}
            setFilterParticipant={setFilterParticipant}
            certificateTypes={certificateTypes}
            participantTypes={participantTypes}
            onDownload={handleDownloadCertificate}
            onRefresh={loadCertificateData}
          />
        )}

        {activeTab === 'templates' && (
          <TemplatesList
            templates={templates}
            onEdit={setSelectedTemplate}
            onRefresh={loadCertificateData}
          />
        )}

        {activeTab === 'settings' && (
          <CertificateSettings
            tournamentId={tournamentId}
            onRefresh={loadCertificateData}
          />
        )}
      </div>

      {/* Modals */}
      {showTemplateModal && (
        <CertificateTemplateModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          onSubmit={handleCreateTemplate}
          template={selectedTemplate}
        />
      )}

      {showGenerationModal && (
        <CertificateGenerationModal
          isOpen={showGenerationModal}
          onClose={() => setShowGenerationModal(false)}
          onSubmit={handleGenerateCertificate}
          templates={templates}
          tournamentId={tournamentId}
        />
      )}
    </div>
  );
};

// Certificate Overview Component
const CertificateOverview = ({ stats, certificates, templates }) => {
  const statCards = [
    {
      title: 'Total Certificates',
      value: stats.total_certificates || 0,
      icon: Award,
      color: 'blue'
    },
    {
      title: 'Active Templates',
      value: templates.filter(t => t.is_active).length,
      icon: FileText,
      color: 'green'
    },
    {
      title: 'Downloads Today',
      value: stats.downloads_today || 0,
      icon: Download,
      color: 'purple'
    },
    {
      title: 'Verifications',
      value: stats.total_verifications || 0,
      icon: CheckCircle,
      color: 'yellow'
    }
  ];

  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <CertificateStatsWidget
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Certificate Activity</h3>
        <div className="space-y-3">
          {certificates.slice(0, 5).map((cert, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex items-center">
                <Award className="h-5 w-5 text-yellow-500 mr-3" />
                <div>
                  <p className="font-medium">{cert.participant_name}</p>
                  <p className="text-sm text-gray-600">
                    {cert.certificate_type} certificate • {new Date(cert.issued_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                cert.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {cert.is_verified ? 'Verified' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Certificates List Component
const CertificatesList = ({
  certificates,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterParticipant,
  setFilterParticipant,
  certificateTypes,
  participantTypes,
  onDownload,
  onRefresh
}) => {
  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search certificates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {certificateTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        
        <select
          value={filterParticipant}
          onChange={(e) => setFilterParticipant(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {participantTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        <button
          onClick={onRefresh}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Certificates Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Participant</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Category</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Issued</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {certificates.map((cert) => (
              <tr key={cert.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    {cert.participant_type === 'team' ? (
                      <Users className="h-5 w-5 text-blue-500 mr-2" />
                    ) : (
                      <Award className="h-5 w-5 text-green-500 mr-2" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{cert.participant_name}</p>
                      <p className="text-sm text-gray-600 capitalize">{cert.participant_type}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="capitalize font-medium">{cert.certificate_type}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {cert.achievement_details?.category || 'General'}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(cert.issued_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    cert.is_verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {cert.is_verified ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Pending
                      </>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onDownload(cert)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Download Certificate"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      className="text-gray-600 hover:text-gray-800 p-1"
                      title="View Certificate"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {certificates.length === 0 && (
        <div className="text-center py-12">
          <Award className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No certificates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by generating certificates for tournament participants.
          </p>
        </div>
      )}
    </div>
  );
};

// Templates List Component
const TemplatesList = ({ templates, onEdit, onRefresh }) => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-600 capitalize">{template.template_type} Certificate</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${
                template.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {template.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Created: {new Date(template.created_at).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(template)}
                className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 text-sm"
              >
                Edit
              </button>
              <button className="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm">
                Preview
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first certificate template to get started.
          </p>
        </div>
      )}
    </div>
  );
};

// Certificate Settings Component
const CertificateSettings = ({ tournamentId, onRefresh }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Certificate Settings</h3>
        <p className="text-gray-600">Certificate settings and configuration will be available here.</p>
      </div>
    </div>
  );
};

export default CertificateManager;
