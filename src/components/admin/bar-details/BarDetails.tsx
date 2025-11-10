// src/app/admin/bars/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import styled from "styled-components";
import Link from "next/link";

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
          background: #3b82f6;
          color: white;
          &:hover { 
            background: #2563eb;
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

const LinkButton = styled(Link)<{ $variant?: "primary" | "secondary" }>`
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

  ${({ $variant }) =>
    $variant === "primary"
      ? `
        background: #3b82f6;
        color: white;
        &:hover { 
          background: #2563eb;
          transform: translateY(-1px);
        }
      `
      : `
        background: #6b7280;
        color: white;
        &:hover { 
          background: #4b5563;
          transform: translateY(-1px);
        }
      `}
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: 1024px) {
    grid-template-columns: 2fr 1fr;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
`;

const CardTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const InfoGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InfoLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const InfoValue = styled.div<{ $status?: string }>`
  font-size: 1rem;
  color: #1f2937;
  font-weight: 500;

  ${({ $status }) => {
    switch ($status) {
      case "VERIFIED":
        return "color: #166534;";
      case "CLAIMED":
        return "color: #1e40af;";
      case "UNCLAIMED":
        return "color: #6b7280;";
      default:
        return "color: #1f2937;";
    }
  }}
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;

  ${({ $status }) => {
    switch ($status) {
      case "VERIFIED":
        return "background: #dcfce7; color: #166534;";
      case "CLAIMED":
        return "background: #dbeafe; color: #1e40af;";
      case "UNCLAIMED":
        return "background: #f3f4f6; color: #6b7280;";
      case "SUSPENDED":
        return "background: #fef2f2; color: #dc2626;";
      default:
        return "background: #f3f4f6; color: #6b7280;";
    }
  }}
`;

const Badge = styled.span`
  background: #f3f4f6;
  color: #374151;
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
`;

const AmenitiesGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const Image = styled.img`
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
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
  operatingHours: any;
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
  createdAt: string;
  updatedAt: string;
  claimedAt: string | null;
}

const BarDetails = () => {
  const params = useParams();
  const router = useRouter();
  const [bar, setBar] = useState<Bar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const barId = params.id as string;

  useEffect(() => {
    fetchBar();
  }, [barId]);

  const fetchBar = async () => {
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
      setBar(result.bar);
    } catch (error) {
      console.error("Error fetching bar:", error);
      setError(error instanceof Error ? error.message : "Failed to load bar");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this bar? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token =
        localStorage.getItem("hoppr_token") ||
        localStorage.getItem("admin_token") ||
        localStorage.getItem("token");

      const response = await fetch(`/api/auth/admin/bars/${barId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete bar");
      }

      router.push("/admin/bars");
    } catch (error) {
      console.error("Error deleting bar:", error);
      alert("Failed to delete bar");
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const token =
        localStorage.getItem("hoppr_token") ||
        localStorage.getItem("admin_token") ||
        localStorage.getItem("token");

      const response = await fetch(`/api/auth/admin/bars/${barId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      // Refresh bar data
      fetchBar();
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  if (error) {
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

  if (!bar) {
    return (
      <Container>
        <ErrorState>
          <h3>Bar Not Found</h3>
          <p>
            The bar you&apos;re looking for doesn&apos;t exist or has been
            deleted.
          </p>
          <Button $variant="primary" onClick={() => router.push("/admin/bars")}>
            ← Back to Bars
          </Button>
        </ErrorState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <TitleSection>
          <Breadcrumb>
            <Link href="/admin/bars">Bars Database</Link> / {bar.name}
          </Breadcrumb>
          <Title>{bar.name}</Title>
        </TitleSection>
        <ActionButtons>
          <LinkButton href={`/admin/bars/${barId}/edit`} $variant="primary">
            Edit
          </LinkButton>
          <Button $variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </ActionButtons>
      </Header>

      <ContentGrid>
        <MainContent>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <SectionGrid>
              <InfoGroup>
                <InfoLabel>Name</InfoLabel>
                <InfoValue>{bar.name}</InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Type</InfoLabel>
                <InfoValue>{bar.type.replace("_", " ")}</InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Description</InfoLabel>
                <InfoValue>
                  {bar.description || "No description provided"}
                </InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Price Range</InfoLabel>
                <InfoValue>{bar.priceRange || "Not specified"}</InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Capacity</InfoLabel>
                <InfoValue>{bar.capacity || "Not specified"}</InfoValue>
              </InfoGroup>
            </SectionGrid>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <SectionGrid>
              <InfoGroup>
                <InfoLabel>Address</InfoLabel>
                <InfoValue>{bar.address}</InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>City</InfoLabel>
                <InfoValue>{bar.city}</InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>District</InfoLabel>
                <InfoValue>{bar.district || "Not specified"}</InfoValue>
              </InfoGroup>
              {bar.latitude && bar.longitude && (
                <>
                  <InfoGroup>
                    <InfoLabel>Latitude</InfoLabel>
                    <InfoValue>{bar.latitude}</InfoValue>
                  </InfoGroup>
                  <InfoGroup>
                    <InfoLabel>Longitude</InfoLabel>
                    <InfoValue>{bar.longitude}</InfoValue>
                  </InfoGroup>
                </>
              )}
            </SectionGrid>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <SectionGrid>
              <InfoGroup>
                <InfoLabel>Phone</InfoLabel>
                <InfoValue>{bar.phone || "Not provided"}</InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Email</InfoLabel>
                <InfoValue>{bar.email || "Not provided"}</InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Website</InfoLabel>
                <InfoValue>
                  {bar.website ? (
                    <a
                      href={bar.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {bar.website}
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Instagram</InfoLabel>
                <InfoValue>
                  {bar.instagram ? (
                    <a
                      href={`https://instagram.com/${bar.instagram.replace(
                        "@",
                        ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {bar.instagram}
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </InfoValue>
              </InfoGroup>
            </SectionGrid>
          </Card>

          {/* Amenities */}
          {bar.amenities && bar.amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <AmenitiesGrid>
                {bar.amenities.map((amenity, index) => (
                  <Badge key={index}>{amenity}</Badge>
                ))}
              </AmenitiesGrid>
            </Card>
          )}

          {/* Images */}
          {(bar.coverImage || bar.imageUrls.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Images</CardTitle>
              </CardHeader>
              <ImageGrid>
                {bar.coverImage && <Image src={bar.coverImage} alt="Cover" />}
                {bar.imageUrls.map((url, index) => (
                  <Image key={index} src={url} alt={`Bar image ${index + 1}`} />
                ))}
              </ImageGrid>
            </Card>
          )}
        </MainContent>

        <Sidebar>
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <InfoGroup>
                <InfoLabel>Verification Status</InfoLabel>
                <StatusBadge $status={bar.isVerified ? "VERIFIED" : bar.status}>
                  {bar.isVerified ? "VERIFIED" : bar.status}
                </StatusBadge>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Active Status</InfoLabel>
                <InfoValue $status={bar.isActive ? "ACTIVE" : "INACTIVE"}>
                  {bar.isActive ? "Active" : "Inactive"}
                </InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>VIP Enabled</InfoLabel>
                <InfoValue>{bar.vipEnabled ? "Yes" : "No"}</InfoValue>
              </InfoGroup>
            </div>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <InfoGroup>
                <InfoLabel>Created</InfoLabel>
                <InfoValue>{formatDate(bar.createdAt)}</InfoValue>
              </InfoGroup>
              <InfoGroup>
                <InfoLabel>Last Updated</InfoLabel>
                <InfoValue>{formatDate(bar.updatedAt)}</InfoValue>
              </InfoGroup>
              {bar.claimedAt && (
                <InfoGroup>
                  <InfoLabel>Claimed</InfoLabel>
                  <InfoValue>{formatDate(bar.claimedAt)}</InfoValue>
                </InfoGroup>
              )}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <Button
                $variant="secondary"
                onClick={() => handleStatusUpdate("VERIFIED")}
                disabled={bar.isVerified}
              >
                ✅ Verify Bar
              </Button>
              <Button
                $variant="secondary"
                onClick={() =>
                  handleStatusUpdate(bar.isActive ? "SUSPENDED" : "CLAIMED")
                }
              >
                {bar.isActive ? "⏸️ Suspend" : "▶️ Activate"}
              </Button>
              <LinkButton
                href={`/admin/bars/${barId}/staff`}
                $variant="secondary"
              >
                👥 Manage Staff
              </LinkButton>
              <LinkButton
                href={`/admin/bars/${barId}/promotions`}
                $variant="secondary"
              >
                🎉 View Promotions
              </LinkButton>
              <LinkButton
                href={`/admin/bars/${barId}/vip-passes`}
                $variant="secondary"
              >
                ⭐ VIP Passes
              </LinkButton>
            </div>
          </Card>
        </Sidebar>
      </ContentGrid>
    </Container>
  );
};
export default BarDetails;
