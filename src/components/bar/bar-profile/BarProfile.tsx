"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";

const Container = styled.div`
  padding: 1.5rem 0;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1f2937;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  color: #6b7280;
  margin-bottom: 2rem;
  font-size: 1rem;
`;

const Form = styled.form`
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  overflow: hidden;
`;

const FormSection = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const SectionDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #374151;
  font-size: 0.875rem;
`;

const Input = styled.input<{ $isDirty?: boolean }>`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${(props) => (props.$isDirty ? "#f59e0b" : "#d1d5db")};
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
  background: ${(props) => (props.disabled ? "#f9fafb" : "white")};

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea<{ $isDirty?: boolean }>`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${(props) => (props.$isDirty ? "#f59e0b" : "#d1d5db")};
  border-radius: 0.5rem;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

const Select = styled.select<{ $isDirty?: boolean }>`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid ${(props) => (props.$isDirty ? "#f59e0b" : "#d1d5db")};
  border-radius: 0.5rem;
  font-size: 1rem;
  background: white;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: flex-end;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const Button = styled.button<{ $variant: "primary" | "secondary" | "outline" }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;

  ${(props) =>
    props.$variant === "primary"
      ? `
    background: #3b82f6;
    color: white;
    &:hover:not(:disabled) { background: #2563eb; }
  `
      : props.$variant === "secondary"
        ? `
    background: #10b981;
    color: white;
    &:hover:not(:disabled) { background: #059669; }
  `
        : `
    background: transparent;
    color: #6b7280;
    border: 1px solid #d1d5db;
    &:hover:not(:disabled) { background: #f3f4f6; }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const SuccessMessage = styled.div`
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  color: #166534;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  color: #dc2626;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ReadOnlyBadge = styled.div`
  display: inline-block;
  background: #fef3c7;
  color: #92400e;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.5rem;
`;

const DirtyIndicator = styled.div`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  margin-left: 0.5rem;
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

const UnsavedChangesBar = styled.div`
  background: #fef3c7;
  border-bottom: 1px solid #fde68a;
  padding: 0.75rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    flex-direction: column;
    text-align: center;
  }
`;

const UnsavedText = styled.span`
  color: #92400e;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SmallButton = styled.button`
  background: transparent;
  border: 1px solid #f59e0b;
  color: #92400e;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #fde68a;
  }
`;

interface BarProfileProps {
  barId: string;
  userRole: string;
}

interface BarData {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  district: string;
  type: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  priceRange: string;
  capacity: number;
  amenities: string[];
  coverImage: string;
  logoUrl: string;
  vipEnabled: boolean;
}

const BarProfile = ({ barId, userRole }: BarProfileProps) => {
  const [bar, setBar] = useState<BarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<BarData>>({});
  const [originalData, setOriginalData] = useState<Partial<BarData>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());

  const canEdit = ["OWNER", "MANAGER"].includes(userRole);
  const isReadOnly = !canEdit;

  useEffect(() => {
    fetchBarProfile();
  }, [barId]);

  // Check for changes whenever formData changes
  useEffect(() => {
    if (Object.keys(originalData).length > 0) {
      const hasChanges =
        JSON.stringify(formData) !== JSON.stringify(originalData);
      setIsDirty(hasChanges);

      // Track which fields have changed
      const changed = new Set<string>();
      Object.keys(formData).forEach((key) => {
        if (
          formData[key as keyof BarData] !== originalData[key as keyof BarData]
        ) {
          changed.add(key);
        }
      });
      setDirtyFields(changed);
    }
  }, [formData, originalData]);

  const fetchBarProfile = async () => {
    try {
      const token = localStorage.getItem("hoppr_token");
      const response = await fetch(`/api/auth/bar/${barId}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBar(data);
        setFormData(data);
        setOriginalData(data);
        setIsDirty(false);
        setDirtyFields(new Set());
      }
    } catch (error) {
      console.error("Failed to fetch bar profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof BarData,
    value: string | number | boolean | string[],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFormData(originalData);
    setIsDirty(false);
    setDirtyFields(new Set());
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !isDirty) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("hoppr_token");
      const response = await fetch(`/api/auth/bar/${barId}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess("✅ Bar profile updated successfully!");
        setOriginalData(formData);
        setIsDirty(false);
        setDirtyFields(new Set());
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update profile",
      );
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const isFieldDirty = (fieldName: string): boolean => {
    return dirtyFields.has(fieldName);
  };

  if (loading) {
    return (
      <Container>
        <Title>Bar Profile</Title>
        <Subtitle>Loading your bar information...</Subtitle>
      </Container>
    );
  }

  return (
    <Container>
      <Title>
        Bar Profile
        {isReadOnly && <ReadOnlyBadge>View Only</ReadOnlyBadge>}
        {canEdit && isDirty && <DirtyIndicator />}
      </Title>
      <Subtitle>
        {canEdit
          ? "Manage your bar's public information"
          : "View your bar's information (contact an owner to make changes)"}
      </Subtitle>

      {/* Unsaved Changes Bar */}
      {canEdit && isDirty && (
        <UnsavedChangesBar>
          <UnsavedText>
            <span>✏️</span>
            You have unsaved changes
          </UnsavedText>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <SmallButton type="button" onClick={handleReset}>
              Discard Changes
            </SmallButton>
          </div>
        </UnsavedChangesBar>
      )}

      {error && <ErrorMessage>❌ {error}</ErrorMessage>}
      {success && <SuccessMessage>✅ {success}</SuccessMessage>}

      <Form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <FormSection>
          <SectionTitle>Basic Information</SectionTitle>
          <SectionDescription>
            This information appears on your bar&apos;s public profile
          </SectionDescription>

          <FormGroup>
            <Label>Bar Name *</Label>
            <Input
              type="text"
              value={formData.name || ""}
              onChange={(e) => handleInputChange("name", e.target.value)}
              disabled={isReadOnly}
              $isDirty={isFieldDirty("name")}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Description</Label>
            <TextArea
              value={formData.description || ""}
              onChange={(e) => handleInputChange("description", e.target.value)}
              disabled={isReadOnly}
              $isDirty={isFieldDirty("description")}
              placeholder="Describe your bar..."
            />
          </FormGroup>

          <Row>
            <FormGroup>
              <Label>Bar Type</Label>
              <Select
                value={formData.type || "PUB"}
                onChange={(e) => handleInputChange("type", e.target.value)}
                disabled={isReadOnly}
                $isDirty={isFieldDirty("type")}
              >
                <option value="PUB">Pub</option>
                <option value="CLUB">Club</option>
                <option value="LOUNGE">Lounge</option>
                <option value="COCKTAIL_BAR">Cocktail Bar</option>
                <option value="RESTAURANT_BAR">Restaurant Bar</option>
                <option value="SPORTS_BAR">Sports Bar</option>
                <option value="KARAOKE">Karaoke</option>
                <option value="LIVE_MUSIC">Live Music</option>
              </Select>
            </FormGroup>

            <FormGroup>
              <Label>Price Range</Label>
              <Select
                value={formData.priceRange || "MODERATE"}
                onChange={(e) =>
                  handleInputChange("priceRange", e.target.value)
                }
                disabled={isReadOnly}
                $isDirty={isFieldDirty("priceRange")}
              >
                <option value="BUDGET">Budget ($)</option>
                <option value="MODERATE">Moderate ($$)</option>
                <option value="PREMIUM">Premium ($$$)</option>
                <option value="LUXURY">Luxury ($$$$)</option>
              </Select>
            </FormGroup>
          </Row>

          <FormGroup>
            <Label>Capacity</Label>
            <Input
              type="number"
              value={formData.capacity || ""}
              onChange={(e) =>
                handleInputChange("capacity", parseInt(e.target.value))
              }
              disabled={isReadOnly}
              $isDirty={isFieldDirty("capacity")}
              placeholder="Maximum capacity"
            />
          </FormGroup>
        </FormSection>

        {/* Location */}
        <FormSection>
          <SectionTitle>Location</SectionTitle>
          <SectionDescription>Where to find your bar</SectionDescription>

          <FormGroup>
            <Label>Address *</Label>
            <Input
              type="text"
              value={formData.address || ""}
              onChange={(e) => handleInputChange("address", e.target.value)}
              disabled={isReadOnly}
              $isDirty={isFieldDirty("address")}
              required
            />
          </FormGroup>

          <Row>
            <FormGroup>
              <Label>City</Label>
              <Input
                type="text"
                value={formData.city || ""}
                onChange={(e) => handleInputChange("city", e.target.value)}
                disabled={isReadOnly}
                $isDirty={isFieldDirty("city")}
              />
            </FormGroup>

            <FormGroup>
              <Label>District</Label>
              <Input
                type="text"
                value={formData.district || ""}
                onChange={(e) => handleInputChange("district", e.target.value)}
                disabled={isReadOnly}
                $isDirty={isFieldDirty("district")}
                placeholder="e.g., Kallio, Kamppi"
              />
            </FormGroup>
          </Row>
        </FormSection>

        {/* Contact Information */}
        <FormSection>
          <SectionTitle>Contact Information</SectionTitle>
          <SectionDescription>How customers can reach you</SectionDescription>

          <Row>
            <FormGroup>
              <Label>Phone</Label>
              <Input
                type="tel"
                value={formData.phone || ""}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={isReadOnly}
                $isDirty={isFieldDirty("phone")}
                placeholder="+358 40 123 4567"
              />
            </FormGroup>

            <FormGroup>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={isReadOnly}
                $isDirty={isFieldDirty("email")}
                placeholder="info@yourbar.com"
              />
            </FormGroup>
          </Row>

          <Row>
            <FormGroup>
              <Label>Website</Label>
              <Input
                type="url"
                value={formData.website || ""}
                onChange={(e) => handleInputChange("website", e.target.value)}
                disabled={isReadOnly}
                $isDirty={isFieldDirty("website")}
                placeholder="https://yourbar.com"
              />
            </FormGroup>

            <FormGroup>
              <Label>Instagram</Label>
              <Input
                type="text"
                value={formData.instagram || ""}
                onChange={(e) => handleInputChange("instagram", e.target.value)}
                disabled={isReadOnly}
                $isDirty={isFieldDirty("instagram")}
                placeholder="@yourbar"
              />
            </FormGroup>
          </Row>
        </FormSection>

        {/* VIP Settings */}
        <FormSection>
          <SectionTitle>VIP Features</SectionTitle>
          <SectionDescription>
            Configure VIP and premium options
          </SectionDescription>

          <FormGroup>
            <Label>
              <input
                type="checkbox"
                checked={formData.vipEnabled || false}
                onChange={(e) =>
                  handleInputChange("vipEnabled", e.target.checked)
                }
                disabled={isReadOnly}
                style={{ marginRight: "0.5rem" }}
              />
              Enable VIP Passes
            </Label>
          </FormGroup>
        </FormSection>

        {canEdit && (
          <FormSection>
            <ButtonGroup>
              <Button
                $variant="outline"
                type="button"
                onClick={handleReset}
                disabled={!isDirty || saving}
              >
                Discard Changes
              </Button>
              <Button
                $variant="primary"
                type="submit"
                disabled={!isDirty || saving}
              >
                {saving ? "💾 Saving..." : "💾 Save Changes"}
              </Button>
            </ButtonGroup>
          </FormSection>
        )}
      </Form>
    </Container>
  );
};

export default BarProfile;
