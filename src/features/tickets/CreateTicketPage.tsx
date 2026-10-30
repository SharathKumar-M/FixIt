import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import styles from './CreateTicketPage.module.css';
import { getIssueTypes, createTicket } from '@/api/fixit.api';
import { MAX_UPLOAD_SIZE_BYTES, MAX_UPLOAD_SIZE_MB } from '@/api/config';
import type { IssueType, Ticket } from '@/api/types';
import { Button, Input, Textarea, Select, Badge } from '@/components/ui';
import {
  UploadIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  TrashIcon,
  AlertCircleIcon,
  CheckCircleIcon,
} from '@/components/icons';
import { formatFileSize } from '@/utils/format';

export const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();

  // Wizard state: 1: Information, 2: Photograph, 3: Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Categories
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [issueTypeId, setIssueTypeId] = useState('');

  // Photograph & Preview
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation & Submission
  const [errors, setErrors] = useState<{ title?: string; description?: string; issueTypeId?: string; photo?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  // Fetch dynamic categories
  useEffect(() => {
    let isMounted = true;
    async function loadTypes() {
      try {
        const types = await getIssueTypes();
        if (isMounted) {
          setIssueTypes(types);
          if (types.length > 0) {
            setIssueTypeId(types[0].id);
          }
        }
      } catch {
        // Fallback or retry
      } finally {
        if (isMounted) setLoadingCategories(false);
      }
    }
    loadTypes();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Photo Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size (limit 10MB)
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, photo: 'Please upload a valid image file (JPEG, PNG, or WebP).' }));
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      setErrors((prev) => ({ ...prev, photo: `Image size exceeds maximum limit of ${MAX_UPLOAD_SIZE_MB}MB.` }));
      return;
    }

    setErrors((prev) => ({ ...prev, photo: undefined }));
    setPhotoFile(file);

    // Generate local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Step 1 validation
  const validateStep1 = (): boolean => {
    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = 'Issue title is required.';
    else if (title.trim().length < 5) newErrors.title = 'Title must be at least 5 characters long.';

    if (!description.trim()) newErrors.description = 'Please provide a detailed description.';
    else if (description.trim().length < 10) newErrors.description = 'Description must be at least 10 characters.';

    if (!issueTypeId) newErrors.issueTypeId = 'Please select a maintenance category.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) setCurrentStep(1);
    else if (currentStep === 3) setCurrentStep(2);
  };

  // Final Submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const ticket = await createTicket({
        title: title.trim(),
        description: description.trim(),
        issue_type_id: issueTypeId,
        photo: photoFile,
      });

      setCreatedTicket(ticket);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit maintenance ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = issueTypes.find((t) => t.id === issueTypeId);

  // If successfully created, show confirmation
  if (createdTicket) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successIconWrapper}>
            <CheckCircleIcon size={44} />
          </div>
          <h1 className={styles.title}>Ticket Successfully Logged</h1>
          <p className={styles.subtitle}>
            Your maintenance issue has been registered into the Campus Maintenance queue.
          </p>
          <div className={styles.ticketBadge}>
            TICKET #{createdTicket.id.slice(-6).toUpperCase()}
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', maxWidth: 440, marginBottom: '2rem' }}>
            Campus staff will review the problem, set an estimated completion date, and notify you as repairs progress.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setCreatedTicket(null);
                setTitle('');
                setDescription('');
                setPhotoFile(null);
                setPhotoPreview(null);
                setCurrentStep(1);
              }}
            >
              Report Another Issue
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate(`/tickets/${createdTicket.id}`)}
              icon={<ArrowRightIcon size={16} />}
            >
              View Ticket Details
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Report a Maintenance Issue</h1>
        <p className={styles.subtitle}>
          Step-by-step reporting to ensure quick triage and dispatch by campus technicians.
        </p>
      </div>

      {/* Stepper Header */}
      <div className={styles.stepper} aria-label="Progress">
        <div className={`${styles.stepItem} ${currentStep === 1 ? styles.stepActive : currentStep > 1 ? styles.stepCompleted : ''}`}>
          <div className={styles.stepNumber}>
            {currentStep > 1 ? <CheckIcon size={14} /> : '1'}
          </div>
          <span>Issue Info</span>
        </div>

        <div className={styles.stepDivider} />

        <div className={`${styles.stepItem} ${currentStep === 2 ? styles.stepActive : currentStep > 2 ? styles.stepCompleted : ''}`}>
          <div className={styles.stepNumber}>
            {currentStep > 2 ? <CheckIcon size={14} /> : '2'}
          </div>
          <span>Photo Evidence</span>
        </div>

        <div className={styles.stepDivider} />

        <div className={`${styles.stepItem} ${currentStep === 3 ? styles.stepActive : ''}`}>
          <div className={styles.stepNumber}>3</div>
          <span>Review & Submit</span>
        </div>
      </div>

      {submitError && (
        <div
          style={{
            backgroundColor: 'var(--status-overdue-bg)',
            border: '1px solid var(--status-overdue-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            color: 'var(--status-overdue-text)',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
          }}
          role="alert"
        >
          <AlertCircleIcon size={20} />
          <span>{submitError}</span>
        </div>
      )}

      {/* Step Content */}
      <div className={styles.card}>
        {currentStep === 1 && (
          <>
            <h2 className={styles.stepTitle}>Step 1: Problem Details & Category</h2>

            <Select
              label="Issue Classification"
              required
              value={issueTypeId}
              onChange={(e) => setIssueTypeId(e.target.value)}
              error={errors.issueTypeId}
              options={issueTypes.map((t) => ({ value: t.id, label: t.name }))}
              helperText={loadingCategories ? 'Loading active issue categories...' : 'Select the matching infrastructure category'}
            />

            <Input
              label="Issue Title"
              placeholder="e.g. Water leakage in 3rd floor restroom sink"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              helperText="A concise summary of what requires maintenance"
            />

            <Textarea
              label="Detailed Description & Location"
              placeholder="Specify the exact building, room number, or landmark, and describe the nature of the damage or malfunction..."
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={errors.description}
              rows={4}
            />

            <div className={styles.actions}>
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleNext} icon={<ArrowRightIcon size={16} />}>
                Continue to Photograph
              </Button>
            </div>
          </>
        )}

        {currentStep === 2 && (
          <>
            <h2 className={styles.stepTitle}>Step 2: Issue Photograph (Optional but Recommended)</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '-0.75rem' }}>
              Photographs dramatically accelerate diagnosis and ensure technicians bring the right tools.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
            />

            {photoPreview ? (
              <div className={styles.previewContainer}>
                <img src={photoPreview} alt="Issue preview" className={styles.previewImage} />
                <div className={styles.previewOverlay}>
                  <Button
                    variant="outline"
                    size="sm"
                    style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Replace Image
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleRemovePhoto}
                    icon={<TrashIcon size={14} />}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={styles.dropzone}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <div className={styles.uploadIconWrapper}>
                  <UploadIcon size={24} />
                </div>
                <div className={styles.uploadText}>Click to upload issue photograph</div>
                <div className={styles.uploadHint}>Accepted formats: JPEG, PNG, WebP (Max 10MB)</div>
              </div>
            )}

            {errors.photo && (
              <div style={{ color: 'var(--status-overdue-text)', fontSize: '0.8125rem' }}>
                {errors.photo}
              </div>
            )}

            {photoFile && (
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Attached: <strong>{photoFile.name}</strong> ({formatFileSize(photoFile.size)})
              </div>
            )}

            <div className={styles.actions}>
              <Button variant="outline" onClick={handleBack} icon={<ArrowLeftIcon size={16} />}>
                Back to Details
              </Button>
              <Button variant="primary" onClick={handleNext} icon={<ArrowRightIcon size={16} />}>
                Review & Confirm
              </Button>
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            <h2 className={styles.stepTitle}>Step 3: Review Ticket Details</h2>

            <div className={styles.reviewSection}>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Category</span>
                <div>
                  <Badge variant="category">{selectedCategory?.name || 'General Maintenance'}</Badge>
                </div>
              </div>

              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Title</span>
                <span className={styles.reviewValue}>{title}</span>
              </div>

              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Description & Location</span>
                <span className={styles.reviewValue}>{description}</span>
              </div>

              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Photograph</span>
                {photoPreview ? (
                  <div style={{ width: 140, height: 100, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border-subtle)', marginTop: 4 }}>
                    <img src={photoPreview} alt="Attached issue" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No photograph attached</span>
                )}
              </div>
            </div>

            <div className={styles.actions}>
              <Button variant="outline" onClick={handleBack} disabled={isSubmitting} icon={<ArrowLeftIcon size={16} />}>
                Edit Information
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                loading={isSubmitting}
                icon={!isSubmitting ? <CheckIcon size={18} /> : undefined}
              >
                Submit Maintenance Ticket
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
