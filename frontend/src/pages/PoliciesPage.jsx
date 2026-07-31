import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, RefreshCcw, Filter, Shield } from 'lucide-react';
import { useAsync } from '../hooks/useAsync';
import { policyService } from '../services/policyService';
import { useToast } from '../components/ui/Toast';

import { PageContainer } from '../components/ui/PageContainer';
import { Button } from '../components/ui/Button';
import { Card, CardHeader } from '../components/ui/Card';
import { ErrorState } from '../components/ui/States';
import { SearchBar } from '../components/ui/SearchBar';
import { Pagination } from '../components/ui/Pagination';

import { PolicyTable } from '../components/policies/PolicyTable';
import { PolicyFormModal } from '../components/policies/PolicyFormModal';
import { PolicyDetailsModal } from '../components/policies/PolicyDetailsModal';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';

import './PoliciesPage.css';

export function PoliciesPage() {
  const { addToast } = useToast();
  const { data, loading, error, execute } = useAsync(policyService.getAll);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPolicies = useCallback(() => {
    execute().catch(() => {});
  }, [execute]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Extract policy array
  const rawPolicies = useMemo(() => {
    return data?.policies || (Array.isArray(data) ? data : []);
  }, [data]);

  // Search, Filter & Sort pipeline
  const filteredPolicies = useMemo(() => {
    return rawPolicies
      .filter((p) => {
        // Search filter
        const query = searchTerm.toLowerCase();
        const matchesSearch =
          p.name.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query)) ||
          p.algorithm.toLowerCase().includes(query);

        // Status filter
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && p.isActive) ||
          (statusFilter === 'inactive' && !p.isActive);

        return matchesSearch && matchesStatus;
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
  }, [rawPolicies, searchTerm, statusFilter, sortField, sortOrder]);

  // Paginated subset
  const totalPages = Math.ceil(filteredPolicies.length / itemsPerPage);
  const paginatedPolicies = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPolicies.slice(start, start + itemsPerPage);
  }, [filteredPolicies, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Handlers
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleOpenCreate = () => {
    setSelectedPolicy(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (policy) => {
    setSelectedPolicy(policy);
    setIsFormModalOpen(true);
  };

  const handleOpenView = (policy) => {
    setSelectedPolicy(policy);
    setIsDetailsModalOpen(true);
  };

  const handleOpenDelete = (policy) => {
    setSelectedPolicy(policy);
    setIsDeleteModalOpen(true);
  };

  const handleToggleStatus = async (policy) => {
    try {
      if (policy.isActive) {
        await policyService.deactivate(policy._id);
        addToast(`Policy "${policy.name}" deactivated`, 'info');
      } else {
        await policyService.activate(policy._id);
        addToast(`Policy "${policy.name}" activated`, 'success');
      }
      fetchPolicies();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to change policy status', 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPolicy) return;
    setDeleteLoading(true);
    try {
      await policyService.remove(selectedPolicy._id);
      addToast(`Policy "${selectedPolicy.name}" deleted permanently`, 'success');
      setIsDeleteModalOpen(false);
      fetchPolicies();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete policy', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <PageContainer className="policy-management-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header__row">
          <div>
            <h1 className="page-header__title">Policy Management</h1>
            <p className="page-header__desc">
              Configure rate limiting algorithms, capacity thresholds, and status rules.
            </p>
          </div>
          <Button variant="primary" icon={Plus} size="sm" onClick={handleOpenCreate}>
            Create Policy
          </Button>
        </div>
      </div>

      {/* Main Table Card Container */}
      <Card padding="none">
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-brand" />
              <span>Policies ({filteredPolicies.length})</span>
            </div>
          }
          action={
            <div className="flex items-center gap-3">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search policies..."
              />

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
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>

              <Button
                variant="ghost"
                icon={RefreshCcw}
                size="sm"
                onClick={fetchPolicies}
                loading={loading}
                title="Refresh Table"
                aria-label="Refresh Table"
              />
            </div>
          }
        />

        {error && <ErrorState message={error} onRetry={fetchPolicies} />}

        {!error && (
          <>
            <PolicyTable
              policies={paginatedPolicies}
              loading={loading}
              onView={handleOpenView}
              onEdit={handleOpenEdit}
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
              totalItems={filteredPolicies.length}
              itemsPerPage={itemsPerPage}
            />
          </>
        )}
      </Card>

      {/* Modals */}
      <PolicyFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        policy={selectedPolicy}
        onSuccess={fetchPolicies}
      />

      <PolicyDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        policy={selectedPolicy}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Policy"
        message={
          selectedPolicy
            ? `Are you sure you want to delete policy "${selectedPolicy.name}"? API keys bound to this policy will lose rate limiting rules.`
            : ''
        }
        loading={deleteLoading}
      />
    </PageContainer>
  );
}
