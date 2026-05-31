"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import {
  MapPin,
  Phone,
  Globe,
  Mail,
  Clock,
  Users,
  DollarSign,
  Star,
  Wine,
  Instagram,
  Facebook,
  Navigation,
  Eye,
} from "lucide-react";

// ---- Type labels matching consumer app ----

const typeLabels: Record<string, string> = {
  PUB: "Pub",
  CLUB: "Club",
  COCKTAIL_LOUNGE: "Cocktail Lounge",
  COCKTAIL_BAR: "Cocktail Bar",
  SPORTS_BAR: "Sports Bar",
  KARAOKE_BAR: "Karaoke Bar",
  KARAOKE: "Karaoke",
  WINE_BAR: "Wine Bar",
  BREWERY_TAPROOM: "Brewery Taproom",
  LIVE_MUSIC: "Live Music Venue",
  LOUNGE: "Lounge",
  RESTAURANT_BAR: "Restaurant Bar",
};

const priceLabels: Record<string, string> = {
  BUDGET: "€ · Budget-friendly",
  MODERATE: "€€ · Moderate",
  PREMIUM: "€€€ · Premium",
  LUXURY: "€€€€ · Luxury",
};

const passTypeLabels: Record<string, string> = {
  SKIP_LINE: "Skip Line",
  COVER_INCLUDED: "Cover Included",
  PREMIUM_ENTRY: "Premium Entry",
  DRINK_PACKAGE: "Drink Package",
};

// ---- Styled components (mirroring consumer app VenueDetail) ----

const PreviewWrapper = styled.div`
  background: #0a0a0a;
  min-height: 100vh;
  padding: 16px;
  max-width: 680px;
  margin: 0 auto;
`;

const PreviewBanner = styled.div`
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(124, 58, 237, 0.05));
  border: 1px solid rgba(124, 58, 237, 0.25);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #a78bfa;
  font-size: 12px;
  font-weight: 500;

  @media (max-width: 480px) {
    flex-direction: column;
    text-align: center;
  }
`;

const BannerLink = styled.a`
  color: #c4b5fd;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    color: #ddd6fe;
  }
`;

const SectionCard = styled.div`
  background: #1a1a1a;
  border: 1px solid #262626;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a3a3a3;
  font-size: 13px;
  padding: 6px 0;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const HoursGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const HourRow = styled.div<{ $today?: boolean }>`
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 12px;
  color: ${({ $today }) => ($today ? "#ffffff" : "#a3a3a3")};
  font-weight: ${({ $today }) => ($today ? 600 : 400)};
`;

const AmenityBadge = styled.span`
  background: rgba(124, 58, 237, 0.1);
  color: #a78bfa;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 500;
`;

const Divider = styled.div`
  height: 1px;
  background: #262626;
  margin: 20px 0;
`;

const TypeBadge = styled.span<{ $badgeType: "event" | "promo" | "pass" }>`
  display: inline-block;
  font-size: 9px;
  font-weight: 600;
  border-radius: 4px;
  padding: 2px 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  flex-shrink: 0;
  background: ${({ $badgeType }) =>
    $badgeType === "event"
      ? "rgba(59,130,246,0.15)"
      : $badgeType === "promo"
        ? "rgba(16,185,129,0.15)"
        : "rgba(245,158,11,0.15)"};
  color: ${({ $badgeType }) =>
    $badgeType === "event" ? "#3b82f6" : $badgeType === "promo" ? "#10b981" : "#f59e0b"};
`;

const ContentCard = styled.div`
  background: #1a1a1a;
  border: 1px solid #262626;
  border-radius: 14px;
  padding: 14px;
  cursor: default;

  &:hover {
    border-color: rgba(124, 58, 237, 0.2);
  }
`;

const SectionTitle = styled.h3`
  color: #ffffff;
  font-weight: 700;
  font-size: 14px;
  margin: 0 0 10px 0;
`;

const HeroButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #a3a3a3;
  font-size: 13px;
  font-weight: 500;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-bottom: 12px;

  &:hover {
    color: #ffffff;
  }
`;

const SecondaryButton = styled.button`
  width: 100%;
  padding: 10px 16px;
  background: transparent;
  color: #a3a3a3;
  border: 1px solid #262626;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;

  &:hover {
    background: #1e1e1e;
    color: #ffffff;
  }
`;

const LoadingState = styled.div`
  padding: 40px 16px;
  text-align: center;
  color: #737373;
  font-size: 14px;
`;

const ErrorState = styled.div`
  padding: 40px 16px;
  text-align: center;
  color: #ef4444;
  font-size: 14px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 24px;
  color: #737373;
  font-size: 13px;
`;

// ---- Types ----

interface ConsumerPreview {
  venue: {
    id: string;
    name: string;
    description: string | null;
    address: string;
    cityName: string | null;
    district: string | null;
    type: string;
    phone: string | null;
    email: string | null;
    website: string | null;
    instagram: string | null;
    facebook: string | null;
    priceRange: string | null;
    capacity: number | null;
    amenities: string[];
    imageUrl: string | null;
    imageUrls: string[];
    logoUrl: string | null;
    lat: number | null;
    lng: number | null;
    hours: Record<string, string> | null;
  };
  promotions: Array<{
    id: string;
    title: string;
    description: string | null;
    type: string;
    validFrom: string;
    validTo: string;
    imageUrl: string | null;
  }>;
  events: Array<{
    id: string;
    title: string;
    description: string | null;
    startTime: string;
    endTime: string | null;
    coverImage: string | null;
    participantCount: number;
  }>;
  passes: Array<{
    id: string;
    title: string;
    type: string;
    price: string;
    originalPrice: string | null;
    benefits: string[];
    validUntil: string;
  }>;
}

// ---- Helpers ----

function formatEventTime(date: Date): string {
  const now = new Date();
  const d = new Date(date);
  const dayDiff = Math.floor(
    (d.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86400000,
  );

  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (dayDiff === 0) return `Today at ${time}`;
  if (dayDiff === 1) return `Tomorrow at ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${time}`;
}

// ---- Component ----

interface BarConsumerPreviewProps {
  barId: string;
}

export default function BarConsumerPreview({ barId }: BarConsumerPreviewProps) {
  const [data, setData] = useState<ConsumerPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const token = localStorage.getItem("hoppr_token");
        const res = await fetch(
          `/api/auth/bar/${barId}/consumer-preview`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to load preview");
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [barId]);

  if (loading) {
    return <LoadingState>Loading preview…</LoadingState>;
  }

  if (error || !data) {
    return <ErrorState>{error || "Could not load preview"}</ErrorState>;
  }

  const { venue, promotions, events, passes } = data;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

  const consumerAppUrl = process.env.NEXT_PUBLIC_CONSUMER_URL || "http://localhost:3000";

  return (
    <PreviewWrapper>
      {/* Consumer Preview Banner */}
      <PreviewBanner>
        <Eye size={18} />
        <span>
          This is how your bar appears to customers on Hoppr.{" "}
          <BannerLink
            href={`${consumerAppUrl}/venues/${barId}`}
            target="_blank"
            rel="noopener"
          >
            Open in consumer app ↗
          </BannerLink>
        </span>
      </PreviewBanner>

      {/* Hero Image */}
      {venue.imageUrl && (
        <div
          style={{
            borderRadius: "16px",
            overflow: "hidden",
            height: "200px",
            marginBottom: "16px",
            background: "#1a1a1a",
          }}
        >
          <img
            src={venue.imageUrl}
            alt={venue.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1
              style={{
                fontWeight: 800,
                fontSize: "24px",
                color: "#ffffff",
                marginBottom: "6px",
              }}
            >
              {venue.name}
            </h1>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <TypeBadge $badgeType="event">
                {typeLabels[venue.type] || venue.type}
              </TypeBadge>
              {venue.priceRange && (
                <span style={{ color: "#a3a3a3", fontSize: "12px" }}>
                  {priceLabels[venue.priceRange]?.split("·")[0]}
                </span>
              )}
            </div>
          </div>
          {venue.capacity && (
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ color: "#a3a3a3", fontSize: "10px" }}>Capacity</div>
              <div style={{ color: "#ffffff", fontWeight: 700, fontSize: "18px" }}>
                {venue.capacity}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {venue.description && (
        <SectionCard>
          <p
            style={{
              color: "#a3a3a3",
              fontSize: "13px",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            {venue.description}
          </p>
        </SectionCard>
      )}

      {/* Contact & Location */}
      <SectionCard>
        <SectionTitle>Contact & Location</SectionTitle>
        <InfoGrid>
          <InfoRow>
            <MapPin size={16} color="#737373" />
            {venue.address}
            {venue.district ? `, ${venue.district}` : ""}
            {venue.cityName ? `, ${venue.cityName}` : ""}
          </InfoRow>
          {venue.phone && (
            <InfoRow>
              <Phone size={16} color="#737373" />
              <span style={{ color: "#7c3aed" }}>{venue.phone}</span>
            </InfoRow>
          )}
          {venue.website && (
            <InfoRow>
              <Globe size={16} color="#737373" />
              <span style={{ color: "#7c3aed" }}>
                {venue.website.replace("https://", "").replace("http://", "")}
              </span>
            </InfoRow>
          )}
          {venue.email && (
            <InfoRow>
              <Mail size={16} color="#737373" />
              <span style={{ color: "#7c3aed" }}>{venue.email}</span>
            </InfoRow>
          )}
          {venue.instagram && (
            <InfoRow>
              <Instagram size={16} color="#737373" />
              <span>{venue.instagram}</span>
            </InfoRow>
          )}
          {venue.facebook && (
            <InfoRow>
              <Facebook size={16} color="#737373" />
              <span>{venue.facebook}</span>
            </InfoRow>
          )}
        </InfoGrid>
        {venue.lat != null && venue.lng != null && (
          <SecondaryButton
            onClick={() => {
              window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${venue.lat},${venue.lng}`,
                "_blank",
              );
            }}
          >
            <Navigation size={16} /> Get Directions
          </SecondaryButton>
        )}
      </SectionCard>

      {/* Opening Hours */}
      {venue.hours && (
        <SectionCard>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <Clock size={18} color="#7c3aed" />
            <SectionTitle style={{ margin: 0 }}>Opening Hours</SectionTitle>
          </div>
          <HoursGrid>
            {days.map((day) => (
              <HourRow key={day} $today={day === today}>
                <span style={{ textTransform: "capitalize" }}>{day}</span>
                <span>
                  {venue.hours?.[day] ||
                    venue.hours?.[
                      day.charAt(0).toUpperCase() + day.slice(1)
                    ] ||
                    "Closed"}
                </span>
              </HourRow>
            ))}
          </HoursGrid>
        </SectionCard>
      )}

      {/* Amenities */}
      {venue.amenities && venue.amenities.length > 0 && (
        <SectionCard>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <Star size={18} color="#7c3aed" />
            <SectionTitle style={{ margin: 0 }}>Amenities</SectionTitle>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {venue.amenities.map((a: string) => (
              <AmenityBadge key={a}>{a}</AmenityBadge>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Price + Capacity Overview */}
      {(venue.priceRange || venue.capacity) && (
        <SectionCard>
          <SectionTitle>Overview</SectionTitle>
          <div style={{ display: "flex", gap: "24px" }}>
            {venue.priceRange && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <DollarSign size={18} color="#737373" />
                <span style={{ color: "#a3a3a3", fontSize: "13px" }}>
                  {priceLabels[venue.priceRange] || venue.priceRange}
                </span>
              </div>
            )}
            {venue.capacity && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Users size={18} color="#737373" />
                <span style={{ color: "#a3a3a3", fontSize: "13px" }}>
                  Up to {venue.capacity} people
                </span>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      <Divider />

      {/* Promotions */}
      {promotions.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <h2 style={{ color: "#ffffff", fontWeight: 700, fontSize: "16px", margin: 0 }}>
              Active Promotions
            </h2>
            <span style={{ color: "#737373", fontSize: "11px" }}>{promotions.length} active</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {promotions.map((promo) => (
              <ContentCard key={promo.id}>
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <TypeBadge $badgeType="promo">PROMO</TypeBadge>
                  <div>
                    <div
                      style={{ color: "#ffffff", fontWeight: 600, fontSize: "13px" }}
                    >
                      {promo.title}
                    </div>
                    {promo.description && (
                      <div
                        style={{
                          color: "#a3a3a3",
                          fontSize: "11px",
                          marginTop: "2px",
                        }}
                      >
                        {promo.description}
                      </div>
                    )}
                    <div style={{ color: "#737373", fontSize: "10px", marginTop: "4px" }}>
                      {formatEventTime(new Date(promo.validFrom))} —{" "}
                      {formatEventTime(new Date(promo.validTo))}
                    </div>
                  </div>
                </div>
              </ContentCard>
            ))}
          </div>
        </div>
      )}

      {/* Events */}
      {events.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <h2 style={{ color: "#ffffff", fontWeight: 700, fontSize: "16px", margin: 0 }}>
              Upcoming Events
            </h2>
            <span style={{ color: "#737373", fontSize: "11px" }}>{events.length} upcoming</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {events.map((event) => (
              <ContentCard key={event.id}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <TypeBadge $badgeType="event">EVENT</TypeBadge>
                  <div>
                    <div
                      style={{ color: "#ffffff", fontWeight: 600, fontSize: "13px" }}
                    >
                      {event.title}
                    </div>
                    <div style={{ color: "#a3a3a3", fontSize: "11px" }}>
                      {formatEventTime(new Date(event.startTime))} ·{" "}
                      {event.participantCount} going
                    </div>
                  </div>
                </div>
              </ContentCard>
            ))}
          </div>
        </div>
      )}

      {/* Passes */}
      {passes.length > 0 && (
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <h2 style={{ color: "#ffffff", fontWeight: 700, fontSize: "16px", margin: 0 }}>
              Available Passes
            </h2>
            <span style={{ color: "#737373", fontSize: "11px" }}>{passes.length} available</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {passes.map((pass) => (
              <ContentCard key={pass.id}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        marginBottom: "4px",
                      }}
                    >
                      <TypeBadge $badgeType="pass">PASS</TypeBadge>
                      <span
                        style={{ color: "#ffffff", fontWeight: 600, fontSize: "13px" }}
                      >
                        {pass.title}
                      </span>
                    </div>
                    {pass.benefits && pass.benefits.length > 0 && (
                      <div style={{ color: "#a3a3a3", fontSize: "11px" }}>
                        {pass.benefits.join(" · ")}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: "14px" }}>
                      €{pass.price}
                    </div>
                    {pass.originalPrice &&
                      parseFloat(pass.originalPrice) > parseFloat(pass.price) && (
                        <div
                          style={{
                            color: "#737373",
                            fontSize: "11px",
                            textDecoration: "line-through",
                          }}
                        >
                          €{pass.originalPrice}
                        </div>
                      )}
                  </div>
                </div>
              </ContentCard>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {promotions.length === 0 && events.length === 0 && passes.length === 0 && (
        <EmptyState>
          <Wine size={32} color="#737373" style={{ marginBottom: "8px" }} />
          <p>No active promos, events, or passes right now.</p>
          <p style={{ marginTop: "4px", fontSize: "11px" }}>
            When you create content, it will appear here as customers see it.
          </p>
        </EmptyState>
      )}

      {/* Bottom spacing */}
      <div style={{ height: "40px" }} />
    </PreviewWrapper>
  );
}
