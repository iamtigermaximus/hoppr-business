// src/app/admin/bars/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import styled from "styled-components";

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

  a {
    color: #3b82f6;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
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
  operatingHours: Record<string, unknown> | null;
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

interface StatusUpdateData {
  status?: string;
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

      const token =
        localStorage.getItem("hoppr_token") ||
        localStorage.getItem("admin_token") ||
        localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/api/auth/admin/bars/${barId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        throw new Error("Authentication required");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch bar: ${response.status}`);
      }

      const result = await response.json();
      const barData: Bar = result.bar;
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
    >
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>
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

      const token =
        localStorage.getItem("hoppr_token") ||
        localStorage.getItem("admin_token") ||
        localStorage.getItem("token");

      const payload = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
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
          errorData.error || `Failed to update bar: ${response.status}`
        );
      }

      // Redirect to bar details page
      router.push(`/admin/bars/${barId}`);
      router.refresh(); // Refresh the page to show updated data
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
            <a href="/admin/bars">Bars Database</a> /{" "}
            <a href={`/admin/bars/${barId}`}>{bar?.name}</a> / Edit
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
                placeholder="Describe your bar, atmosphere, specialties..."
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
                placeholder="Maximum capacity"
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
                placeholder="e.g., 40.7128"
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
                placeholder="e.g., -74.0060"
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
                placeholder="+1 (555) 123-4567"
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
                placeholder="contact@bar.com"
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
                placeholder="https://example.com"
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
                placeholder="@username"
              />
            </FormGroup>
          </FormGrid>
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

        {/* Form Actions */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "flex-end",
            padding: "1rem 0",
          }}
        >
          <Button $variant="secondary" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button $variant="primary" type="submit" disabled={saving}>
            {saving ? "Saving Changes..." : "💾 Save Changes"}
          </Button>
        </div>
      </Form>
    </Container>
  );
};
export default EditBar;
