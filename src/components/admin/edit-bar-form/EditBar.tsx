"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import ImageUpload from "@/components/admin/image-upload/ImageUpload";

const Container = styled.div`
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;

  @media (min-width: 768px) {
    padding: 2rem;
  }
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

const Breadcrumb = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const BreadcrumbLink = styled(Link)`
  color: #3b82f6;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const BreadcrumbText = styled.span`
  color: #6b7280;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;

  @media (min-width: 640px) {
    flex-wrap: nowrap;
  }
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" | "danger" }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  white-space: nowrap;
  min-height: 44px;

  ${({ $variant }) => {
    switch ($variant) {
      case "primary":
        return `
          background: #10b981;
          color: white;
          &:hover { 
            background: #059669;
            transform: translateY(-1px);
          }
        `;
      case "danger":
        return `
          background: #ef4444;
          color: white;
          &:hover { 
            background: #dc2626;
            transform: translateY(-1px);
          }
        `;
      default:
        return `
          background: #6b7280;
          color: white;
          &:hover { 
            background: #4b5563;
            transform: translateY(-1px);
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const FormSection = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const Required = styled.span`
  color: #ef4444;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: all 0.2s;
  min-height: 44px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background-color: #f9fafb;
    color: #6b7280;
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 44px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Checkbox = styled.input`
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.25rem;
  border: 1px solid #d1d5db;
  cursor: pointer;

  &:checked {
    background-color: #3b82f6;
    border-color: #3b82f6;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.25rem;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
  text-align: center;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const ErrorState = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1.5rem;
  border-radius: 0.5rem;
  text-align: center;
  margin: 2rem 0;
`;

const ImagePreview = styled.div`
  position: relative;
  display: inline-block;
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

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;
`;

const GalleryImageContainer = styled.div`
  position: relative;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  aspect-ratio: 4 / 3;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const GalleryImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const HelperText = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.5rem;
`;

// Responsive Hours Grid
const HoursGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const HoursRow = styled.div`
  display: grid;
  grid-template-columns: 100px 1fr auto 1fr;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 640px) {
    grid-template-columns: 80px 1fr auto 1fr;
    gap: 0.5rem;
  }

  @media (max-width: 480px) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #f9fafb;
    border-radius: 0.5rem;
  }
`;

const HoursDay = styled.div`
  font-weight: 500;
  font-size: 0.875rem;

  @media (max-width: 480px) {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
`;

const HoursInput = styled.input`
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  width: 100%;
  min-width: 0;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const HoursSeparator = styled.span`
  text-align: center;
  color: #6b7280;

  @media (max-width: 480px) {
    display: none;
  }
`;

const HoursInputsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

// Default operating hours
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

// Types based on your Prisma schema
interface Bar {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  district: string | null;
  type: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  instagram: string | null;
  operatingHours: OperatingHours | null;
  priceRange: string | null;
  capacity: number | null;
  amenities: string[];
  coverImage: string | null;
  imageUrls: string[];
  logoUrl: string | null;
  status: string;
  isVerified: boolean;
  isActive: boolean;
  vipEnabled: boolean;
}

// Form data type
interface BarFormData {
  name: string;
  description: string;
  address: string;
  city: string;
  district: string;
  type: string;
  latitude: string;
  longitude: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  priceRange: string;
  capacity: string;
  amenities: string[];
  isActive: boolean;
  vipEnabled: boolean;
}

// Options for dropdowns
const BAR_TYPES = [
  "PUB",
  "CLUB",
  "LOUNGE",
  "COCKTAIL_BAR",
  "RESTAURANT_BAR",
  "SPORTS_BAR",
  "KARAOKE",
  "LIVE_MUSIC",
] as const;

const PRICE_RANGES = ["BUDGET", "MODERATE", "PREMIUM", "LUXURY"] as const;

const AMENITIES_OPTIONS = [
  "DANCE_FLOOR",
  "LIVE_MUSIC",
  "SPORTS_TV",
  "OUTDOOR_SEATING",
  "ROOFTOP",
  "VIP_SECTION",
  "KARAOKE",
  "POOL_TABLE",
  "DART_BOARD",
  "FREE_WIFI",
  "WHEELCHAIR_ACCESSIBLE",
  "VALET_PARKING",
  "COAT_CHECK",
  "HOOKAH",
  "CIGAR_LOUNGE",
] as const;

const EditBar = () => {
  const params = useParams();
  const router = useRouter();
  const [bar, setBar] = useState<Bar | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Operating Hours state
  const [operatingHours, setOperatingHours] = useState<OperatingHours>(
    DEFAULT_OPERATING_HOURS,
  );

  // Image states
  const [coverImage, setCoverImage] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  const barId = params.id as string;

  const [formData, setFormData] = useState<BarFormData>({
    name: "",
    description: "",
    address: "",
    city: "",
    district: "",
    type: "PUB",
    latitude: "",
    longitude: "",
    phone: "",
    email: "",
    website: "",
    instagram: "",
    priceRange: "",
    capacity: "",
    amenities: [],
    isActive: true,
    vipEnabled: false,
  });

  useEffect(() => {
    fetchBar();
  }, [barId]);

  const fetchBar = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("hoppr_token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/auth/admin/bars/${barId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bar: ${response.status}`);
      }

      const result = await response.json();
      const barData: Bar = result.bar || result.data || result;
      setBar(barData);

      // Populate form data
      setFormData({
        name: barData.name,
        description: barData.description || "",
        address: barData.address,
        city: barData.city,
        district: barData.district || "",
        type: barData.type,
        latitude: barData.latitude?.toString() || "",
        longitude: barData.longitude?.toString() || "",
        phone: barData.phone || "",
        email: barData.email || "",
        website: barData.website || "",
        instagram: barData.instagram || "",
        priceRange: barData.priceRange || "",
        capacity: barData.capacity?.toString() || "",
        amenities: barData.amenities || [],
        isActive: barData.isActive,
        vipEnabled: barData.vipEnabled,
      });

      // Populate operating hours
      if (
        barData.operatingHours &&
        Object.keys(barData.operatingHours).length > 0
      ) {
        setOperatingHours(barData.operatingHours);
      } else {
        setOperatingHours(DEFAULT_OPERATING_HOURS);
      }

      // Populate image states
      setCoverImage(barData.coverImage || "");
      setLogoUrl(barData.logoUrl || "");
      setImageUrls(barData.imageUrls || []);
    } catch (error) {
      console.error("Error fetching bar:", error);
      setError(error instanceof Error ? error.message : "Failed to load bar");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleHourChange = (
    day: string,
    type: "open" | "close",
    value: string,
  ): void => {
    setOperatingHours((prev) => ({
      ...prev,
      [day]: { ...prev[day as keyof OperatingHours], [type]: value },
    }));
  };

  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleAmenityChange = (amenity: string): void => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  // Image handlers
  const handleAddImage = (): void => {
    if (newImageUrl.trim()) {
      setImageUrls([...imageUrls, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };

  const handleRemoveImage = (index: number): void => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleRemoveLogo = (): void => {
    setLogoUrl("");
  };

  const handleRemoveCoverImage = (): void => {
    setCoverImage("");
  };

  const handleMultipleUpload = (urls: string[]): void => {
    setImageUrls([...imageUrls, ...urls]);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.address.trim()) {
      errors.address = "Address is required";
    }

    if (!formData.city.trim()) {
      errors.city = "City is required";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website)) {
      errors.website = "Please enter a valid website URL";
    }

    if (formData.capacity && isNaN(Number(formData.capacity))) {
      errors.capacity = "Capacity must be a number";
    }

    if (formData.latitude && isNaN(Number(formData.latitude))) {
      errors.latitude = "Latitude must be a number";
    }

    if (formData.longitude && isNaN(Number(formData.longitude))) {
      errors.longitude = "Longitude must be a number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const token = localStorage.getItem("hoppr_token");

      const finalImageUrls = Array.isArray(imageUrls) ? imageUrls : [];

      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        operatingHours: operatingHours,
        coverImage: coverImage || null,
        logoUrl: logoUrl || null,
        imageUrls: finalImageUrls,
      };

      const response = await fetch(`/api/auth/admin/bars/${barId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to update bar: ${response.status}`,
        );
      }

      router.push(`/admin/bars/${barId}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating bar:", error);
      setError(error instanceof Error ? error.message : "Failed to update bar");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (): void => {
    router.push(`/admin/bars/${barId}`);
  };

  if (loading) {
    return (
      <Container>
        <LoadingState>
          <LoadingSpinner />
          <p>Loading bar details...</p>
        </LoadingState>
      </Container>
    );
  }

  if (error && !bar) {
    return (
      <Container>
        <ErrorState>
          <h3>Error</h3>
          <p>{error}</p>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              marginTop: "1rem",
            }}
          >
            <Button
              $variant="primary"
              onClick={() => router.push("/admin/bars")}
            >
              ← Back to Bars
            </Button>
            <Button $variant="secondary" onClick={fetchBar}>
              🔄 Try Again
            </Button>
          </div>
        </ErrorState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <TitleSection>
          <Breadcrumb>
            <BreadcrumbLink href="/admin/bars">Bars Database</BreadcrumbLink>
            <BreadcrumbText>/</BreadcrumbText>
            <BreadcrumbLink href={`/admin/bars/${barId}`}>
              {bar?.name}
            </BreadcrumbLink>
            <BreadcrumbText>/</BreadcrumbText>
            <BreadcrumbText>Edit</BreadcrumbText>
          </Breadcrumb>
          <Title>Edit Bar: {bar?.name}</Title>
        </TitleSection>
        <ActionButtons>
          <Button $variant="secondary" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button $variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : "💾 Save Changes"}
          </Button>
        </ActionButtons>
      </Header>

      {error && (
        <ErrorState>
          <p>{error}</p>
        </ErrorState>
      )}

      <Form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <FormSection>
          <SectionTitle>Basic Information</SectionTitle>
          <FormGrid>
            <FormGroup>
              <Label htmlFor="name">
                Bar Name <Required>*</Required>
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              {formErrors.name && (
                <ErrorMessage>{formErrors.name}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="type">Bar Type</Label>
              <Select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
              >
                {BAR_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.replace("_", " ")}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup style={{ gridColumn: "1 / -1" }}>
              <Label htmlFor="description">Description</Label>
              <TextArea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="priceRange">Price Range</Label>
              <Select
                id="priceRange"
                name="priceRange"
                value={formData.priceRange}
                onChange={handleInputChange}
              >
                <option value="">Select price range</option>
                {PRICE_RANGES.map((range) => (
                  <option key={range} value={range}>
                    {range.charAt(0) + range.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                type="number"
                id="capacity"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                min="0"
              />
              {formErrors.capacity && (
                <ErrorMessage>{formErrors.capacity}</ErrorMessage>
              )}
            </FormGroup>
          </FormGrid>
        </FormSection>

        {/* Location Information */}
        <FormSection>
          <SectionTitle>Location Information</SectionTitle>
          <FormGrid>
            <FormGroup style={{ gridColumn: "1 / -1" }}>
              <Label htmlFor="address">
                Address <Required>*</Required>
              </Label>
              <Input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
              {formErrors.address && (
                <ErrorMessage>{formErrors.address}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="city">
                City <Required>*</Required>
              </Label>
              <Input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
              />
              {formErrors.city && (
                <ErrorMessage>{formErrors.city}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="district">District/Area</Label>
              <Input
                type="text"
                id="district"
                name="district"
                value={formData.district}
                onChange={handleInputChange}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                type="number"
                step="any"
                id="latitude"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
              />
              {formErrors.latitude && (
                <ErrorMessage>{formErrors.latitude}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                type="number"
                step="any"
                id="longitude"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
              />
              {formErrors.longitude && (
                <ErrorMessage>{formErrors.longitude}</ErrorMessage>
              )}
            </FormGroup>
          </FormGrid>
        </FormSection>

        {/* Contact Information */}
        <FormSection>
          <SectionTitle>Contact Information</SectionTitle>
          <FormGrid>
            <FormGroup>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="email">Email Address</Label>
              <Input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
              {formErrors.email && (
                <ErrorMessage>{formErrors.email}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="website">Website</Label>
              <Input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
              />
              {formErrors.website && (
                <ErrorMessage>{formErrors.website}</ErrorMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                type="text"
                id="instagram"
                name="instagram"
                value={formData.instagram}
                onChange={handleInputChange}
              />
            </FormGroup>
          </FormGrid>
        </FormSection>

        {/* Operating Hours - Responsive */}
        <FormSection>
          <SectionTitle>Operating Hours</SectionTitle>
          <HoursGrid>
            {[
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
              "Sunday",
            ].map((day) => (
              <HoursRow key={day}>
                <HoursDay>{day}</HoursDay>
                <HoursInput
                  type="text"
                  value={
                    operatingHours[day as keyof OperatingHours]?.open || ""
                  }
                  onChange={(e) =>
                    handleHourChange(day, "open", e.target.value)
                  }
                  placeholder="Open"
                />
                <HoursSeparator>-</HoursSeparator>
                <HoursInput
                  type="text"
                  value={
                    operatingHours[day as keyof OperatingHours]?.close || ""
                  }
                  onChange={(e) =>
                    handleHourChange(day, "close", e.target.value)
                  }
                  placeholder="Close"
                />
              </HoursRow>
            ))}
          </HoursGrid>
          <HelperText>
            Use "Closed" to mark as closed. Format like "16:00" or "4:00 PM"
          </HelperText>
        </FormSection>

        {/* Images Section */}
        <FormSection>
          <SectionTitle>Images & Media</SectionTitle>

          {/* Cover Image */}
          <FormGroup style={{ marginBottom: "1.5rem" }}>
            <Label>Cover Image</Label>
            {coverImage ? (
              <div>
                <ImagePreview>
                  <ImagePreviewImg src={coverImage} alt="Cover" />
                  <RemoveImageButton onClick={handleRemoveCoverImage}>
                    ✕
                  </RemoveImageButton>
                </ImagePreview>
                <div style={{ marginTop: "0.5rem" }}>
                  <ImageUpload
                    onUpload={(url: string) => setCoverImage(url)}
                    buttonText="Change Cover Image"
                  />
                </div>
              </div>
            ) : (
              <div>
                <Input
                  type="url"
                  placeholder="https://example.com/cover-image.jpg"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                />
                <div style={{ marginTop: "0.5rem" }}>
                  <ImageUpload
                    onUpload={(url: string) => setCoverImage(url)}
                    buttonText="Or Upload Cover Image"
                  />
                </div>
              </div>
            )}
            <HelperText>Recommended size: 1200 x 600 pixels</HelperText>
          </FormGroup>

          {/* Logo Image */}
          <FormGroup style={{ marginBottom: "1.5rem" }}>
            <Label>Logo Image</Label>
            {logoUrl ? (
              <div>
                <ImagePreview>
                  <ImagePreviewImg
                    src={logoUrl}
                    alt="Logo"
                    style={{ maxWidth: "150px", maxHeight: "150px" }}
                  />
                  <RemoveImageButton onClick={handleRemoveLogo}>
                    ✕
                  </RemoveImageButton>
                </ImagePreview>
                <div style={{ marginTop: "0.5rem" }}>
                  <ImageUpload
                    onUpload={(url: string) => setLogoUrl(url)}
                    buttonText="Change Logo"
                  />
                </div>
              </div>
            ) : (
              <div>
                <Input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
                <div style={{ marginTop: "0.5rem" }}>
                  <ImageUpload
                    onUpload={(url: string) => setLogoUrl(url)}
                    buttonText="Or Upload Logo"
                  />
                </div>
              </div>
            )}
            <HelperText>Recommended size: 400 x 400 pixels (square)</HelperText>
          </FormGroup>

          {/* Gallery Images */}
          <FormGroup>
            <Label>Gallery Images</Label>
            <ImageUpload
              onUpload={(url: string) => {
                setImageUrls([...imageUrls, url]);
              }}
              onMultipleUpload={handleMultipleUpload}
              buttonText="Upload Images"
              multiple={true}
              existingImages={imageUrls}
            />
            <div style={{ marginTop: "0.5rem" }}>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                }}
              >
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  style={{ flex: 1 }}
                />
                <Button
                  type="button"
                  $variant="secondary"
                  onClick={handleAddImage}
                  disabled={!newImageUrl.trim()}
                >
                  Add URL
                </Button>
              </div>
            </div>
            {imageUrls.length > 0 && (
              <GalleryGrid>
                {imageUrls.map((url, index) => (
                  <GalleryImageContainer key={index}>
                    <GalleryImage
                      src={url}
                      alt={`Gallery ${index + 1}`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://placehold.co/400x300?text=Invalid+Image";
                      }}
                    />
                    <RemoveImageButton
                      onClick={() => handleRemoveImage(index)}
                      style={{ top: "4px", right: "4px" }}
                    >
                      ✕
                    </RemoveImageButton>
                  </GalleryImageContainer>
                ))}
              </GalleryGrid>
            )}
            <HelperText>
              {imageUrls.length > 0
                ? `${imageUrls.length} image(s) in gallery. Click ✕ to remove.`
                : "Upload multiple images or paste URLs to showcase your bar's atmosphere"}
            </HelperText>
          </FormGroup>
        </FormSection>

        {/* Amenities */}
        <FormSection>
          <SectionTitle>Amenities & Features</SectionTitle>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            {AMENITIES_OPTIONS.map((amenity) => (
              <CheckboxLabel key={amenity}>
                <Checkbox
                  type="checkbox"
                  checked={formData.amenities.includes(amenity)}
                  onChange={() => handleAmenityChange(amenity)}
                />
                {amenity.replace("_", " ")}
              </CheckboxLabel>
            ))}
          </div>
        </FormSection>

        {/* Settings */}
        <FormSection>
          <SectionTitle>Settings</SectionTitle>
          <FormGrid>
            <FormGroup>
              <CheckboxLabel>
                <Checkbox
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleCheckboxChange}
                />
                Bar is active and visible to users
              </CheckboxLabel>
            </FormGroup>
            <FormGroup>
              <CheckboxLabel>
                <Checkbox
                  type="checkbox"
                  name="vipEnabled"
                  checked={formData.vipEnabled}
                  onChange={handleCheckboxChange}
                />
                Enable VIP passes and features
              </CheckboxLabel>
            </FormGroup>
          </FormGrid>
        </FormSection>
      </Form>
    </Container>
  );
};

export default EditBar;
