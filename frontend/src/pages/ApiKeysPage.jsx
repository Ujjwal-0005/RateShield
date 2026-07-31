import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, RefreshCcw, Filter, Key } from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { apiKeyService } from '../services/apiKeyService';
import { policyService } from '../services/policyService';
import { useToast } from '../components/ui/Toast';

import { PageContainer } from '../components/ui/PageContainer';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { ErrorState } from '../components/ui/States';
import { SearchBar } from '../components/ui/SearchBar';
import { Pagination } from '../components/ui/Pagination';

import { ApiKeyTable } from '../components/apikeys/ApiKeyTable';
import { ApiKeyFormModal } from '../components/apikeys/ApiKeyFormModal';
import { ApiKeyDetailsModal } from '../components/apikeys/ApiKeyDetailsModal';
import { SecureKeyDialog } from '../components/apikeys/SecureKeyDialog';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';

import './ApiKeysPage.css';

export function ApiKeysPage() {
  const { addToast } = useToast();
  const { data, loading, error, execute } = useAsync(apiKeyService.getAll);

  // Policies data for filter dropdown
  const [policiesList, setPoliciesList] = useState([]);

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [envFilter, setEnvFilter] = useState('all');
  const [policyFilter, setPolicyFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRegenerateConfirmOpen, setIsRegenerateConfirmOpen] = useState(false);
  const [isSecureDialogOpen, setIsSecureDialogOpen] = useState(false);

  const [selectedKey, setSelectedKey] = useState(null);
  const [newlyGeneratedKey, setNewlyGeneratedKey] = useState('');
  const [dialogTitle, setDialogTitle] = useState('API Key Generated');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchKeys = useCallback(() => {
    execute().catch(() => {});
  }, [execute]);

  useEffect(() => {
    fetchKeys();
    policyService.getAll()
      .then(({ data: resData }) => {
        const list = resData?.policies || (Array.isArray(resData) ? resData : []);
        setPoliciesList(list);
      })
      .catch(() => {});
  }, [fetchKeys]);

  const rawKeys = useMemo(() => {
    return data?.apiKeys || (Array.isArray(data) ? data : []);
  }, [data]);

  // Search, Filter & Sort pipeline
  const filteredKeys = useMemo(() => {
    return rawKeys
      .filter((k) => {
        const query = searchTerm.toLowerCase();
        const matchesSearch =
          k.name.toLowerCase().includes(query) ||
          (k.maskedKey && k.maskedKey.toLowerCase().includes(query)) ||
          (k.description && k.description.toLowerCase().includes(query));

        const matchesStatus =
          statusFilter === 'all' || k.status?.toLowerCase() === statusFilter;

        const matchesEnv =
          envFilter === 'all' || k.keyType?.toLowerCase() === envFilter;

        const matchesPolicy =
          policyFilter === 'all' || k.policy?._id === policyFilter || k.policy === policyFilter;

        return matchesSearch && matchesStatus && matchesEnv && matchesPolicy;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [rawKeys, searchTerm, statusFilter, envFilter, policyFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredKeys.length / itemsPerPage);
  const paginatedKeys = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredKeys.slice(start, start + itemsPerPage);
  }, [filteredKeys, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, envFilter, policyFilter]);

  // Handlers
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleKeyCreated = (generatedKey) => {
    setNewlyGeneratedKey(generatedKey);
    setDialogTitle('API Key Created Successfully');
    setIsSecureDialogOpen(true);
    fetchKeys();
  };

  const handleOpenRegenerate = (key) => {
    setSelectedKey(key);
    setIsRegenerateConfirmOpen(true);
  };

  const handleConfirmRegenerate = async () => {
    if (!selectedKey) return;
    setActionLoading(true);
    try {
      const res = await apiKeyService.regenerate(selectedKey._id);
      const resData = res.data?.data || res.data;
      const regeneratedRawKey = resData.rawKey || resData.key || 'rs_live_regeneratedsecret';

      addToast(`API Key "${selectedKey.name}" regenerated`, 'success');
      setIsRegenerateConfirmOpen(false);
      setNewlyGeneratedKey(regeneratedRawKey);
      setDialogTitle('API Key Regenerated');
      setIsSecureDialogOpen(true);
      fetchKeys();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to regenerate API Key', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (key) => {
    try {
      if (key.status === 'active') {
        await apiKeyService.disable(key._id);
        addToast(`API Key "${key.name}" disabled`, 'info');
      } else {
        await apiKeyService.enable(key._id);
        addToast(`API Key "${key.name}" enabled`, 'success');
      }
      fetchKeys();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to change API Key status', 'error');
    }
  };

  const handleOpenDelete = (key) => {
    setSelectedKey(key);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedKey) return;
    setActionLoading(true);
    try {
      await apiKeyService.revoke(selectedKey._id);
      addToast(`API Key "${selectedKey.name}" revoked permanently`, 'success');
      setIsDeleteModalOpen(false);
      fetchKeys();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to revoke API Key', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <PageContainer className="apikeys-management-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header__row">
          <div>
            <h1 className="page-header__title">API Key Management</h1>
            <p className="page-header__desc">
              Generate, monitor usage, regenerate, and manage environment access keys.
            </p>
          </div>
          <Button variant="primary" icon={Plus} size="sm" onClick={() => setIsFormModalOpen(true)}>
            Create API Key
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card padding="none">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Key size={18} className="text-purple" />
              <span>API Keys ({filteredKeys.length})</span>
            </div>
          }
          action={
            <div className="flex items-center gap-3 flex-wrap">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search key name or token..."
              />

              {/* Status Filter */}
              <div className="filter-dropdown-wrap">
                <Filter size={14} className="filter-icon" />
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter status"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="disabled">Disabled Only</option>
                  <option value="expired">Expired Only</option>
                </select>
              </div>

              {/* Environment Filter */}
              <div className="filter-dropdown-wrap">
                <select
                  className="filter-select"
                  value={envFilter}
                  onChange={(e) => setEnvFilter(e.target.value)}
                  aria-label="Filter environment"
                  style={{ paddingLeft: '12px' }}
                >
                  <option value="all">All Environments</option>
                  <option value="live">Live (Production)</option>
                  <option value="test">Test (Sandbox)</option>
                </select>
              </div>

              {/* Policy Filter */}
              <div className="filter-dropdown-wrap">
                <select
                  className="filter-select"
                  value={policyFilter}
                  onChange={(e) => setPolicyFilter(e.target.value)}
                  aria-label="Filter policy"
                  style={{ paddingLeft: '12px' }}
                >
                  <option value="all">All Policies</option>
                  {policiesList.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="ghost"
                icon={RefreshCcw}
                size="sm"
                onClick={fetchKeys}
                loading={loading}
                title="Refresh Table"
                aria-label="Refresh Table"
              />
            </div>
          }
        />

        {error && <ErrorState message={error} onRetry={fetchKeys} />}

        {!error && (
          <>
            <ApiKeyTable
              apiKeys={paginatedKeys}
              loading={loading}
              onView={(key) => {
                setSelectedKey(key);
                setIsDetailsModalOpen(true);
              }}
              onRegenerate={handleOpenRegenerate}
              onToggleStatus={handleToggleStatus}
              onDelete={handleOpenDelete}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredKeys.length}
              itemsPerPage={itemsPerPage}
            />
          </>
        )}
      </Card>

      {/* Modals & Dialogs */}
      <ApiKeyFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleKeyCreated}
      />

      <ApiKeyDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        apiKey={selectedKey}
      />

      <SecureKeyDialog
        isOpen={isSecureDialogOpen}
        onClose={() => setIsSecureDialogOpen(false)}
        rawKey={newlyGeneratedKey}
        title={dialogTitle}
      />

      <DeleteConfirmationModal
        isOpen={isRegenerateConfirmOpen}
        onClose={() => setIsRegenerateConfirmOpen(false)}
        onConfirm={handleConfirmRegenerate}
        title="Regenerate API Key"
        message={
          selectedKey
            ? `Are you sure you want to regenerate API Key "${selectedKey.name}"? The current active secret token will stop working immediately.`
            : ''
        }
        loading={actionLoading}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Revoke & Delete API Key"
        message={
          selectedKey
            ? `Are you sure you want to revoke API Key "${selectedKey.name}"? Clients using this key will immediately receive HTTP 401 Unauthorized errors.`
            : ''
        }
        loading={actionLoading}
      />
    </PageContainer>
  );
}
