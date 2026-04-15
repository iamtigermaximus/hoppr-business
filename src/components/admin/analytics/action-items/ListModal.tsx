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
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  padding: 2rem;
  color: #6b7280;
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #ef4444;
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
      default:
        return "#374151";
    }
  }};
`;

const ScoreBadge = styled.span<{ $score: number }>`
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 500;
  background: ${(props) => {
    if (props.$score >= 80) return "#d1fae5";
    if (props.$score >= 50) return "#fef3c7";
    return "#fee2e2";
  }};
  color: ${(props) => {
    if (props.$score >= 80) return "#065f46";
    if (props.$score >= 50) return "#92400e";
    return "#991b1b";
  }};
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

interface Bar {
  id: string;
  name: string;
  type: string;
  city: string;
  district: string | null;
  address?: string;
  updatedAt?: string;
  completionScore?: number;
  missingFields?: Record<string, boolean>;
}

interface ListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: "no-staff" | "inactive" | "completion-scores";
}

const ListModal = ({ isOpen, onClose, title, type }: ListModalProps) => {
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

  const getApiUrl = (): string => {
    switch (type) {
      case "no-staff":
        return "/api/auth/admin/analytics/bars-with-no-staff";
      case "inactive":
        return "/api/auth/admin/analytics/inactive-bars";
      case "completion-scores":
        return "/api/auth/admin/analytics/bar-completion-scores";
      default:
        return "";
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchBars = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = getToken();
        const url = getApiUrl();

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch data");
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
  }, [isOpen, type]);

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
            (bar.district && bar.district.toLowerCase().includes(term)),
        ),
      );
    }
  }, [searchTerm, bars]);

  const getDaysSinceUpdate = (dateString?: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
    return `${diffDays} days ago`;
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
          {loading && <LoadingState>Loading...</LoadingState>}
          {error && <ErrorState>Error: {error}</ErrorState>}
          {!loading && !error && bars.length === 0 && (
            <LoadingState>No bars found</LoadingState>
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
                  placeholder="Search by name, city, or district..."
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
                        {type === "completion-scores" &&
                          bar.completionScore !== undefined && (
                            <ScoreBadge $score={bar.completionScore}>
                              {bar.completionScore}% complete
                            </ScoreBadge>
                          )}
                        {type === "inactive" && bar.updatedAt && (
                          <span style={{ color: "#f59e0b" }}>
                            Last updated: {getDaysSinceUpdate(bar.updatedAt)}
                          </span>
                        )}
                      </BarDetails>
                    </BarInfo>
                  </BarItem>
                ))}
              </BarsList>
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

export default ListModal;
