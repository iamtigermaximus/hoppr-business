"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import Link from "next/link";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
`;

const ModalHeader = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
`;

const ModalTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  line-height: 1;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;

  &:hover {
    color: #1f2937;
    background: #f3f4f6;
  }
`;

const ModalBody = styled.div`
  padding: 1rem 1.5rem;
  overflow-y: auto;
  flex: 1;
`;

const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  background: #f8fafc;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #ef4444;
  background: #fef2f2;
  border-radius: 0.5rem;
`;

const BarsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const BarItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const BarInfo = styled.div`
  flex: 1;
`;

const BarName = styled(Link)`
  font-weight: 600;
  color: #3b82f6;
  text-decoration: none;
  font-size: 0.875rem;
  display: inline-block;

  &:hover {
    text-decoration: underline;
    color: #2563eb;
  }
`;

const BarDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
`;

const Badge = styled.span<{ $type: string }>`
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 500;
  background: ${(props) => {
    switch (props.$type) {
      case "PUB":
        return "#dbeafe";
      case "CLUB":
        return "#fce7f3";
      case "LOUNGE":
        return "#fef3c7";
      case "COCKTAIL_BAR":
        return "#e0e7ff";
      case "RESTAURANT_BAR":
        return "#dcfce7";
      case "SPORTS_BAR":
        return "#fed7aa";
      default:
        return "#f3f4f6";
    }
  }};
  color: ${(props) => {
    switch (props.$type) {
      case "PUB":
        return "#1e40af";
      case "CLUB":
        return "#9d174d";
      case "LOUNGE":
        return "#92400e";
      case "COCKTAIL_BAR":
        return "#3730a3";
      case "RESTAURANT_BAR":
        return "#166534";
      case "SPORTS_BAR":
        return "#9a3412";
      default:
        return "#374151";
    }
  }};
`;

const MissingReason = styled.span`
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 500;
  background: #fef3c7;
  color: #92400e;
`;

const CountBadge = styled.span`
  background: #e5e7eb;
  color: #374151;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  background: #3b82f6;
  color: white;
  border: none;

  &:hover {
    background: #2563eb;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  margin-bottom: 1rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    ring: 2px solid #3b82f6;
  }
`;

const StatsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

interface Bar {
  id: string;
  name: string;
  type: string;
  city: string;
  district: string | null;
  address: string;
  coverImage: string | null;
  description: string | null;
  operatingHours: any;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

interface MissingBarsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingType: string;
  title: string;
}

const MissingBarsModal = ({
  isOpen,
  onClose,
  missingType,
  title,
}: MissingBarsModalProps) => {
  const [bars, setBars] = useState<Bar[]>([]);
  const [filteredBars, setFilteredBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const getToken = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hoppr_token");
    }
    return null;
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchBars = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = getToken();

        const response = await fetch(
          `/api/auth/admin/analytics/missing-bars?type=${missingType}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch bars");
        }

        const result = await response.json();
        setBars(result.data || []);
        setFilteredBars(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchBars();
  }, [isOpen, missingType]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredBars(bars);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredBars(
        bars.filter(
          (bar) =>
            bar.name.toLowerCase().includes(term) ||
            bar.city.toLowerCase().includes(term) ||
            (bar.district && bar.district.toLowerCase().includes(term)) ||
            bar.type.toLowerCase().includes(term),
        ),
      );
    }
  }, [searchTerm, bars]);

  const getMissingReason = (type: string): string => {
    switch (type) {
      case "images":
        return "Missing cover image";
      case "hours":
        return "Missing operating hours";
      case "description":
        return "Missing description";
      case "unverified":
        return "Not verified";
      case "inactive":
        return "Inactive bar";
      default:
        return "Missing data";
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>

        <ModalBody>
          {loading && (
            <LoadingState>
              <div>Loading bars...</div>
            </LoadingState>
          )}

          {error && (
            <ErrorState>
              <div>Error: {error}</div>
            </ErrorState>
          )}

          {!loading && !error && bars.length === 0 && (
            <LoadingState>
              <div>🎉 No bars found with missing data!</div>
              <div style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
                All bars have complete {missingType} data.
              </div>
            </LoadingState>
          )}

          {!loading && !error && bars.length > 0 && (
            <>
              <StatsBar>
                <CountBadge>
                  {filteredBars.length} bar
                  {filteredBars.length !== 1 ? "s" : ""}
                </CountBadge>
                <SearchInput
                  type="text"
                  placeholder="Search by name, city, district, or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </StatsBar>

              <BarsList>
                {filteredBars.map((bar) => (
                  <BarItem key={bar.id}>
                    <BarInfo>
                      <BarName href={`/admin/bars/${bar.id}`}>
                        {bar.name}
                      </BarName>
                      <BarDetails>
                        <Badge $type={bar.type}>{bar.type}</Badge>
                        <span>{bar.city}</span>
                        {bar.district && <span>{bar.district}</span>}
                        <MissingReason>
                          {getMissingReason(missingType)}
                        </MissingReason>
                      </BarDetails>
                    </BarInfo>
                  </BarItem>
                ))}
              </BarsList>

              {filteredBars.length === 0 && searchTerm && (
                <LoadingState>
                  <div>No bars matching &quot;{searchTerm}&quot;</div>
                </LoadingState>
              )}
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <ActionButton onClick={onClose}>Close</ActionButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default MissingBarsModal;
