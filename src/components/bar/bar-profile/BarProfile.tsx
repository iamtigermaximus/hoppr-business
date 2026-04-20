"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import ImageUpload from "@/components/admin/image-upload/ImageUpload";
import Image from "next/image";

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

const ImagePreview = styled.div`
  position: relative;
  display: inline-block;
  margin-top: 0.5rem;
`;

const ImagePreviewImg = styled.img`
  max-width: 100%;
  max-height: 200px;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
`;

const RemoveImageButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #dc2626;
    transform: scale(1.1);
  }
`;

const HelperText = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.5rem;
`;

const AMENITIES_OPTIONS = [
  "WIFI",
  "TOILETS",
  "HEATING",
  "DANCE_FLOOR",
  "LIVE_MUSIC",
  "SPORTS_TV",
  "OUTDOOR_SEATING",
  "ROOFTOP",
  "VIP_SECTION",
  "KARAOKE",
  "POOL_TABLE",
  "DART_BOARD",
  "VALET_PARKING",
  "COAT_CHECK",
  "TERRACE",
  "SAUNA",
  "FIREPLACE",
];

const DEFAULT_OPERATING_HOURS = {
  Monday: { open: "16:00", close: "02:00" },
  Tuesday: { open: "16:00", close: "02:00" },
  Wednesday: { open: "16:00", close: "02:00" },
  Thursday: { open: "16:00", close: "02:00" },
  Friday: { open: "16:00", close: "04:00" },
  Saturday: { open: "14:00", close: "04:00" },
  Sunday: { open: "14:00", close: "02:00" },
};

interface OperatingHours {
  Monday: { open: string; close: string };
  Tuesday: { open: string; close: string };
  Wednesday: { open: string; close: string };
  Thursday: { open: string; close: string };
  Friday: { open: string; close: string };
  Saturday: { open: string; close: string };
  Sunday: { open: string; close: string };
}

interface BarData {
  id: string;
  name: string;
  description: string | null;
  address: string;
  cityName: string;
  district: string | null;
  type: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  priceRange: string | null;
  capacity: number | null;
  amenities: string[];
  coverImage: string | null;
  imageUrls: string[];
  logoUrl: string | null;
  vipEnabled: boolean;
  operatingHours: OperatingHours | null;
}

interface BarProfileProps {
  barId: string;
  userRole: string;
}

const cleanCityName = (city: string): string => {
  if (!city) return "";
  return city.replace(/^\d+\s+/, "").trim();
};

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
  const [operatingHours, setOperatingHours] = useState<OperatingHours>(
    DEFAULT_OPERATING_HOURS,
  );
  const [coverImage, setCoverImage] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const canEdit = ["OWNER", "MANAGER"].includes(userRole);
  const isReadOnly = !canEdit;

  useEffect(() => {
    fetchBarProfile();
  }, [barId]);

  useEffect(() => {
    if (bar && Object.keys(originalData).length > 0) {
      const hasChanges =
        JSON.stringify(formData) !== JSON.stringify(originalData) ||
        JSON.stringify(operatingHours) !== JSON.stringify(bar.operatingHours) ||
        coverImage !== (bar.coverImage || "") ||
        logoUrl !== (bar.logoUrl || "");

      setIsDirty(hasChanges);

      const changed = new Set<string>();
      Object.keys(formData).forEach((key) => {
        if (
          formData[key as keyof BarData] !== originalData[key as keyof BarData]
        ) {
          changed.add(key);
        }
      });
      if (
        JSON.stringify(operatingHours) !== JSON.stringify(bar.operatingHours)
      ) {
        changed.add("operatingHours");
      }
      if (coverImage !== (bar.coverImage || "")) changed.add("coverImage");
      if (logoUrl !== (bar.logoUrl || "")) changed.add("logoUrl");
      if (JSON.stringify(imageUrls) !== JSON.stringify(bar.imageUrls || []))
        changed.add("imageUrls");

      setDirtyFields(changed);
    }
  }, [
    formData,
    originalData,
    operatingHours,
    coverImage,
    logoUrl,
    imageUrls,
    bar,
  ]);

  const fetchBarProfile = async () => {
    try {
      const token = localStorage.getItem("hoppr_token");
      const response = await fetch(`/api/auth/bar/${barId}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const barData = await response.json();

        setBar(barData);

        const cleanCity = cleanCityName(barData.cityName || "");

        const newFormData = {
          name: barData.name || "",
          description: barData.description || "",
          address: barData.address || "",
          cityName: cleanCity,
          district: barData.district || "",
          type: barData.type || "PUB",
          phone: barData.phone || "",
          email: barData.email || "",
          website: barData.website || "",
          instagram: barData.instagram || "",
          priceRange: barData.priceRange || "MODERATE",
          capacity: barData.capacity || null,
          amenities: barData.amenities || [],
          vipEnabled: barData.vipEnabled || false,
        };

        setFormData(newFormData);
        setOriginalData(newFormData);

        if (
          barData.operatingHours &&
          Object.keys(barData.operatingHours).length > 0
        ) {
          setOperatingHours(barData.operatingHours);
        }

        setCoverImage(barData.coverImage || "");
        setLogoUrl(barData.logoUrl || "");
        setImageUrls(barData.imageUrls || []);
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

  const handleHourChange = (
    day: string,
    type: "open" | "close",
    value: string,
  ) => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day as keyof OperatingHours], [type]: value },
    }));
  };

  const handleAmenityChange = (amenity: string) => {
    const currentAmenities = formData.amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a) => a !== amenity)
      : [...currentAmenities, amenity];
    handleInputChange("amenities", newAmenities);
  };

  const handleCoverUpload = (url: string) => {
    setCoverImage(url);
    setIsDirty(true);
    setDirtyFields((prev) => new Set([...prev, "coverImage"]));
  };

  const handleLogoUpload = (url: string) => {
    setLogoUrl(url);
    setIsDirty(true);
    setDirtyFields((prev) => new Set([...prev, "logoUrl"]));
  };

  const handleGalleryUpload = (url: string) => {
    setImageUrls((prev) => [...prev, url]);
    setIsDirty(true);
    setDirtyFields((prev) => new Set([...prev, "imageUrls"]));
  };

  const handleMultipleGalleryUpload = (urls: string[]) => {
    setImageUrls((prev) => [...prev, ...urls]);
    setIsDirty(true);
    setDirtyFields((prev) => new Set([...prev, "imageUrls"]));
    setSuccess(`✅ ${urls.length} image(s) uploaded successfully!`);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleReset = () => {
    if (bar) {
      const cleanCity = cleanCityName(bar.cityName || "");

      setFormData({
        name: bar.name || "",
        description: bar.description || "",
        address: bar.address || "",
        cityName: cleanCity,
        district: bar.district || "",
        type: bar.type || "PUB",
        phone: bar.phone || "",
        email: bar.email || "",
        website: bar.website || "",
        instagram: bar.instagram || "",
        priceRange: bar.priceRange || "MODERATE",
        capacity: bar.capacity || null,
        amenities: bar.amenities || [],
        vipEnabled: bar.vipEnabled || false,
      });

      setOperatingHours(bar.operatingHours || DEFAULT_OPERATING_HOURS);
      setCoverImage(bar.coverImage || "");
      setLogoUrl(bar.logoUrl || "");
      setImageUrls(bar.imageUrls || []);

      setIsDirty(false);
      setDirtyFields(new Set());
      setError(null);
      setSuccess(null);
    }
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
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          address: formData.address,
          city: formData.cityName,
          district: formData.district,
          type: formData.type,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          instagram: formData.instagram,
          priceRange: formData.priceRange,
          capacity: formData.capacity,
          amenities: formData.amenities,
          coverImage: coverImage,
          logoUrl: logoUrl,
          imageUrls: imageUrls,
          vipEnabled: formData.vipEnabled,
          operatingHours: operatingHours,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const updatedBar = result.bar;

        setBar(updatedBar);

        const cleanCity = cleanCityName(updatedBar.cityName || "");

        const newFormData = {
          name: updatedBar.name || "",
          description: updatedBar.description || "",
          address: updatedBar.address || "",
          cityName: cleanCity,
          district: updatedBar.district || "",
          type: updatedBar.type || "PUB",
          phone: updatedBar.phone || "",
          email: updatedBar.email || "",
          website: updatedBar.website || "",
          instagram: updatedBar.instagram || "",
          priceRange: updatedBar.priceRange || "MODERATE",
          capacity: updatedBar.capacity || null,
          amenities: updatedBar.amenities || [],
          vipEnabled: updatedBar.vipEnabled || false,
        };

        setFormData(newFormData);
        setOriginalData(newFormData);
        setOperatingHours(updatedBar.operatingHours || DEFAULT_OPERATING_HOURS);
        setCoverImage(updatedBar.coverImage || "");
        setLogoUrl(updatedBar.logoUrl || "");
        setImageUrls(updatedBar.imageUrls || []);

        setIsDirty(false);
        setDirtyFields(new Set());
        setSuccess("✅ Bar profile updated successfully!");
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
              placeholder="Describe your bar, atmosphere, specialties..."
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
                value={formData.cityName || ""}
                onChange={(e) => handleInputChange("cityName", e.target.value)}
                disabled={isReadOnly}
                $isDirty={isFieldDirty("cityName")}
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

        <FormSection>
          <SectionTitle>Images & Media</SectionTitle>
          <SectionDescription>
            Showcase your bar&apos;s atmosphere
          </SectionDescription>

          <FormGroup>
            <Label>Cover Image</Label>
            {coverImage ? (
              <div>
                <ImagePreview>
                  <ImagePreviewImg src={coverImage} alt="Cover" />
                  {canEdit && (
                    <RemoveImageButton onClick={() => setCoverImage("")}>
                      ✕
                    </RemoveImageButton>
                  )}
                </ImagePreview>
                {canEdit && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <ImageUpload
                      onUpload={handleCoverUpload}
                      buttonText="Change Cover Image"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                {canEdit ? (
                  <>
                    <Input
                      type="url"
                      placeholder="https://example.com/cover-image.jpg"
                      value={coverImage}
                      onChange={(e) => setCoverImage(e.target.value)}
                      disabled={isReadOnly}
                    />
                    <div style={{ marginTop: "0.5rem" }}>
                      <ImageUpload
                        onUpload={handleCoverUpload}
                        buttonText="Or Upload Cover Image"
                      />
                    </div>
                  </>
                ) : (
                  <Input value="No cover image" disabled />
                )}
              </div>
            )}
            <HelperText>Recommended size: 1200 x 600 pixels</HelperText>
          </FormGroup>

          <FormGroup>
            <Label>Logo Image</Label>
            {logoUrl ? (
              <div>
                <ImagePreview>
                  <ImagePreviewImg
                    src={logoUrl}
                    alt="Logo"
                    style={{ maxWidth: "150px", maxHeight: "150px" }}
                  />
                  {canEdit && (
                    <RemoveImageButton onClick={() => setLogoUrl("")}>
                      ✕
                    </RemoveImageButton>
                  )}
                </ImagePreview>
                {canEdit && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <ImageUpload
                      onUpload={handleLogoUpload}
                      buttonText="Change Logo"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div>
                {canEdit ? (
                  <>
                    <Input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      disabled={isReadOnly}
                    />
                    <div style={{ marginTop: "0.5rem" }}>
                      <ImageUpload
                        onUpload={handleLogoUpload}
                        buttonText="Or Upload Logo"
                      />
                    </div>
                  </>
                ) : (
                  <Input value="No logo image" disabled />
                )}
              </div>
            )}
            <HelperText>Recommended size: 400 x 400 pixels (square)</HelperText>
          </FormGroup>

          <FormGroup>
            <Label>Gallery Images</Label>
            {canEdit && (
              <ImageUpload
                onUpload={handleGalleryUpload}
                onMultipleUpload={handleMultipleGalleryUpload}
                buttonText="Upload Images"
                multiple={true}
                existingImages={imageUrls}
              />
            )}

            {imageUrls.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                {imageUrls.map((url, index) => (
                  <div
                    key={`${url}-${index}`}
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "120px",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "0.5rem",
                      overflow: "hidden",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <Image
                      src={url}
                      alt={`Gallery ${index + 1}`}
                      fill
                      sizes="150px"
                      style={{
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "https://placehold.co/400x300?text=Invalid+Image";
                      }}
                    />
                    {canEdit && (
                      <RemoveImageButton
                        onClick={() => {
                          setImageUrls(imageUrls.filter((_, i) => i !== index));
                          setIsDirty(true);
                          setDirtyFields(
                            (prev) => new Set([...prev, "imageUrls"]),
                          );
                        }}
                        style={{ top: "4px", right: "4px" }}
                      >
                        ✕
                      </RemoveImageButton>
                    )}
                  </div>
                ))}
              </div>
            )}
            <HelperText>
              {imageUrls.length > 0
                ? `${imageUrls.length} image(s) in gallery. Click ✕ to remove.`
                : "Upload multiple images to showcase your bar's atmosphere"}
            </HelperText>
          </FormGroup>
        </FormSection>

        <FormSection>
          <SectionTitle>Operating Hours</SectionTitle>
          <SectionDescription>
            When your bar is open for business
          </SectionDescription>

          {[
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ].map((day) => (
            <FormGroup key={day}>
              <Label>{day}</Label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Input
                  type="text"
                  value={
                    operatingHours[day as keyof OperatingHours]?.open || ""
                  }
                  onChange={(e) =>
                    handleHourChange(day, "open", e.target.value)
                  }
                  disabled={isReadOnly}
                  placeholder="Open time"
                  style={{ flex: 1 }}
                  $isDirty={isFieldDirty("operatingHours")}
                />
                <span style={{ alignSelf: "center" }}>-</span>
                <Input
                  type="text"
                  value={
                    operatingHours[day as keyof OperatingHours]?.close || ""
                  }
                  onChange={(e) =>
                    handleHourChange(day, "close", e.target.value)
                  }
                  disabled={isReadOnly}
                  placeholder="Close time"
                  style={{ flex: 1 }}
                  $isDirty={isFieldDirty("operatingHours")}
                />
              </div>
            </FormGroup>
          ))}
          <HelperText>
            Use &quot;Closed&quot; to mark as closed. Format like
            &quot;16:00&quot; or &quot;4:00 PM&quot;
          </HelperText>
        </FormSection>

        <FormSection>
          <SectionTitle>Amenities & Features</SectionTitle>
          <SectionDescription>What makes your bar special</SectionDescription>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {AMENITIES_OPTIONS.map((amenity) => (
              <label
                key={amenity}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.875rem",
                  cursor: isReadOnly ? "default" : "pointer",
                  opacity: isReadOnly ? 0.7 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={(formData.amenities || []).includes(amenity)}
                  onChange={() => handleAmenityChange(amenity)}
                  disabled={isReadOnly}
                  style={{ width: "1rem", height: "1rem" }}
                />
                {amenity.replace(/_/g, " ")}
              </label>
            ))}
          </div>
        </FormSection>

        <FormSection>
          <SectionTitle>VIP Features</SectionTitle>
          <SectionDescription>
            Configure VIP and premium options
          </SectionDescription>

          <FormGroup>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: isReadOnly ? "default" : "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={formData.vipEnabled || false}
                onChange={(e) =>
                  handleInputChange("vipEnabled", e.target.checked)
                }
                disabled={isReadOnly}
                style={{ width: "1rem", height: "1rem" }}
              />
              Enable VIP Passes
            </label>
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
