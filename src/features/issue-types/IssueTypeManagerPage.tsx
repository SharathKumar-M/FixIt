import React, { useState, useEffect } from 'react';
import styles from './IssueTypeManagerPage.module.css';
import {
  getIssueTypes,
  createIssueType,
  updateIssueType,
  deleteIssueType,
} from '@/api/fixit.api';
import type { IssueType } from '@/api/types';
import {
  Button,
  Input,
  Textarea,
  Modal,
  ConfirmDialog,
  EmptyState,
  Skeleton,
} from '@/components/ui';
import { PlusIcon, EditIcon, TrashIcon, TagIcon, AlertTriangleIcon } from '@/components/icons';

export const IssueTypeManagerPage: React.FC = () => {
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<IssueType | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirm State
  const [deletingType, setDeletingType] = useState<IssueType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTypes = async (signal?: AbortSignal) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await getIssueTypes(signal);
      setIssueTypes(data);
    } catch (err: any) {
      if (err?.code !== 'ABORTED') {
        setErrorMsg(err?.message || 'Failed to load issue categories.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchTypes(controller.signal);
    return () => controller.abort();
  }, []);

  const openCreateModal = () => {
    setEditingType(null);
    setName('');
    setDescription('');
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: IssueType) => {
    setEditingType(item);
    setName(item.name);
    setDescription(item.description || '');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError('Issue category name is required.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);
    try {
      if (editingType) {
        const updated = await updateIssueType(editingType.id, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
        setIssueTypes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const created = await createIssueType({
          name: name.trim(),
          description: description.trim() || undefined,
        });
        setIssueTypes((prev) => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err?.message || 'Failed to save issue type.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingType) return;
    setIsDeleting(true);
    try {
      await deleteIssueType(deletingType.id);
      setIssueTypes((prev) => prev.filter((t) => t.id !== deletingType.id));
      setDeletingType(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete issue category.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Infrastructure Issue Categories</h1>
          <p className={styles.subtitle}>
            Define and manage maintenance classifications available across the student and faculty reporting portals.
          </p>
        </div>
        <Button variant="primary" onClick={openCreateModal} icon={<PlusIcon size={16} />}>
          New Category
        </Button>
      </div>

      {isLoading ? (
        <div className={styles.typesGrid}>
          <Skeleton width="100%" height={160} borderRadius={16} />
          <Skeleton width="100%" height={160} borderRadius={16} />
          <Skeleton width="100%" height={160} borderRadius={16} />
        </div>
      ) : errorMsg ? (
        <EmptyState
          icon={<AlertTriangleIcon size={28} />}
          title="Could Not Load Categories"
          description={errorMsg}
          action={
            <Button variant="outline" size="sm" onClick={() => fetchTypes()}>
              Retry
            </Button>
          }
        />
      ) : issueTypes.length === 0 ? (
        <EmptyState
          icon={<TagIcon size={32} />}
          title="No Categories Defined"
          description="Create your first maintenance category so campus members can report issues."
          action={
            <Button variant="primary" onClick={openCreateModal} icon={<PlusIcon size={16} />}>
              Create Category
            </Button>
          }
        />
      ) : (
        <div className={styles.typesGrid}>
          {issueTypes.map((type) => (
            <div key={type.id} className={styles.typeCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.typeName}>{type.name}</h3>
                <span style={{ color: 'var(--color-electric-blue)' }}>
                  <TagIcon size={18} />
                </span>
              </div>

              <p className={styles.typeDescription}>
                {type.description || 'General campus maintenance classification.'}
              </p>

              <div className={styles.cardActions}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(type)}
                  icon={<EditIcon size={14} />}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeletingType(type)}
                  icon={<TrashIcon size={14} />}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingType ? 'Edit Issue Category' : 'Create New Issue Category'}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={isSubmitting}>
              {editingType ? 'Save Changes' : 'Create Category'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {modalError && (
            <div style={{ color: 'var(--status-overdue-text)', fontSize: '0.8125rem' }}>
              {modalError}
            </div>
          )}

          <Input
            label="Category Name"
            placeholder="e.g. Electrical & Lighting, Plumbing & Water, HVAC"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <Textarea
            label="Scope Description"
            placeholder="Describe what kinds of infrastructure faults or campus facilities fall under this category..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      {deletingType && (
        <ConfirmDialog
          isOpen={Boolean(deletingType)}
          onClose={() => setDeletingType(null)}
          onConfirm={handleDelete}
          title="Delete Category"
          message={`Are you sure you want to permanently delete category "${deletingType.name}"? Active tickets will retain their historical records.`}
          confirmText="Delete Category"
          variant="danger"
          loading={isDeleting}
        />
      )}
    </div>
  );
};
