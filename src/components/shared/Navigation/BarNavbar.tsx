"use client";

import { useRouter, usePathname } from "next/navigation";
import styled from "styled-components";
import { useState, useRef, useEffect, useCallback } from "react";

// ── Styled Components ──────────────────────────────────────────

const BarNavContainer = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
  gap: 0.5rem;

  @media (max-width: 1024px) {
    padding: 0.75rem 1rem;
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    flex-wrap: wrap;
    gap: 0;
  }
`;

const BarLogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 20;
  max-width: 300px;
  overflow: hidden;
  flex-shrink: 0;

  @media (max-width: 768px) {
    max-width: 200px;
  }
`;

const BarLogoImage = styled.img`
  height: 50px;
  width: 50px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    height: 40px;
    width: 40px;
  }

  @media (max-width: 480px) {
    height: 30px;
    width: 30px;
  }
`;

const BarName = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 1.1rem;
    max-width: 150px;
  }

  @media (max-width: 480px) {
    font-size: 1rem;
    max-width: 120px;
  }
`;

// ── Mobile hamburger ───────────────────────────────────────────

interface BarMobileMenuButtonProps {
  $isOpen: boolean;
}

const BarMobileMenuButton = styled.button<BarMobileMenuButtonProps>`
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 24px;
  height: 18px;
  background: white;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 20;

  @media (max-width: 768px) {
    display: flex;
  }

  span {
    display: block;
    height: 2px;
    width: 100%;
    background-color: #374151;
    border-radius: 2px;
    transition: all 0.3s ease;

    &:nth-child(1) {
      transform: ${(props) =>
        props.$isOpen ? "rotate(45deg) translate(6px, 6px)" : "none"};
    }

    &:nth-child(2) {
      opacity: ${(props) => (props.$isOpen ? "0" : "1")};
    }

    &:nth-child(3) {
      transform: ${(props) =>
        props.$isOpen ? "rotate(-45deg) translate(6px, -6px)" : "none"};
    }
  }
`;

// ── Nav items container ────────────────────────────────────────

interface BarNavItemsContainerProps {
  $isOpen: boolean;
}

const BarNavItemsContainer = styled.div<BarNavItemsContainerProps>`
  display: flex;
  gap: 0.25rem;
  align-items: center;
  flex: 1;
  justify-content: center;

  @media (max-width: 768px) {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    flex-direction: column;
    padding: ${(props) => (props.$isOpen ? "1rem 1.5rem" : "0 1.5rem")};
    border-bottom: ${(props) => (props.$isOpen ? "1px solid #e5e7eb" : "none")};
    max-height: ${(props) => (props.$isOpen ? "500px" : "0")};
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: ${(props) =>
      props.$isOpen ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none"};
    align-items: stretch;
  }
`;

const BarNavItems = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
  }
`;

// ── Nav item (top-level link) ──────────────────────────────────

interface BarNavItemProps {
  $active?: boolean;
}

const BarNavItem = styled.a<BarNavItemProps>`
  padding: 0.5rem 0.75rem;
  color: ${(props) => (props.$active ? "#10b981" : "#6b7280")};
  font-weight: ${(props) => (props.$active ? "600" : "500")};
  font-size: 0.875rem;
  text-decoration: none;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    color: #374151;
    background: ${(props) => (props.$active ? "transparent" : "#f3f4f6")};
  }

  @media (max-width: 768px) {
    padding: 0.75rem 0;
    width: 100%;
    text-align: center;
    border-bottom: 1px solid #f3f4f6;

    &:last-child {
      border-bottom: none;
    }
  }
`;

// ── Create button (prominent CTA) ──────────────────────────────

const CreateButton = styled.a<{ $active?: boolean }>`
  padding: 0.5rem 1rem;
  color: white;
  background: ${(props) => (props.$active ? "#059669" : "#10b981")};
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &:hover {
    background: #059669;
    color: white;
  }

  @media (max-width: 768px) {
    justify-content: center;
    padding: 0.75rem 0;
    width: 100%;
  }
`;

// ── Dropdown shared components ─────────────────────────────────

const DropdownWrapper = styled.div`
  position: relative;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const DropdownTrigger = styled.a<{ $active?: boolean; $isOpen: boolean }>`
  padding: 0.5rem 0.75rem;
  color: ${(props) => (props.$active ? "#10b981" : "#6b7280")};
  font-weight: ${(props) => (props.$active ? "600" : "500")};
  font-size: 0.875rem;
  text-decoration: none;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  user-select: none;

  &:hover {
    color: #374151;
    background: ${(props) => (props.$active ? "transparent" : "#f3f4f6")};
  }

  svg {
    transition: transform 0.2s;
    transform: ${(props) => (props.$isOpen ? "rotate(180deg)" : "rotate(0deg)")};
  }

  @media (max-width: 768px) {
    padding: 0.75rem 0;
    width: 100%;
    text-align: center;
    border-bottom: 1px solid #f3f4f6;
    justify-content: center;
  }
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 180px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 0.375rem;
  display: ${(props) => (props.$isOpen ? "flex" : "none")};
  flex-direction: column;
  gap: 2px;
  z-index: 100;

  @media (max-width: 768px) {
    position: static;
    box-shadow: none;
    border: none;
    background: #f9fafb;
    border-radius: 0;
    padding: 0.25rem 0;
    margin: 0;
  }
`;

const DropdownItem = styled.a<{ $active?: boolean }>`
  padding: 0.5rem 0.75rem;
  color: ${(props) => (props.$active ? "#10b981" : "#374151")};
  font-weight: ${(props) => (props.$active ? "600" : "400")};
  font-size: 0.875rem;
  text-decoration: none;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.15s;
  white-space: nowrap;

  &:hover {
    background: #f3f4f6;
  }

  @media (max-width: 768px) {
    padding: 0.625rem 0.75rem;
    width: 100%;
    text-align: center;
  }
`;

// ── User area ──────────────────────────────────────────────────

const BarUserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: 0.5rem;
  padding-left: 0.75rem;
  border-left: 1px solid #e5e7eb;

  @media (max-width: 768px) {
    margin-left: 0;
    padding-left: 0;
    border-left: none;
    border-top: 1px solid #e5e7eb;
    padding-top: 1rem;
    width: 100%;
    justify-content: center;
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const BarUserName = styled.span`
  color: #6b7280;
  font-size: 0.875rem;
  white-space: nowrap;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const BarLogoutButton = styled.button`
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;

  &:hover {
    background: #dc2626;
  }

  @media (max-width: 768px) {
    width: 100%;
    max-width: 200px;
  }
`;

// ── Chevron icon ───────────────────────────────────────────────

const ChevronIcon = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 10 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2.5 3.75L5 6.25L7.5 3.75"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ── Types ──────────────────────────────────────────────────────

interface NavDropdown {
  id: string;
  label: string;
  items: NavEntry[];
}

interface NavEntry {
  href: string;
  label: string;
  restricted?: string[];
}

interface BarNavbarProps {
  barName: string;
  barId: string;
  userRole: string;
}

// ── Component ──────────────────────────────────────────────────

const BarNavbar = ({ barName, barId, userRole }: BarNavbarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Refs for outside-click detection on each dropdown
  const manageRef = useRef<HTMLDivElement>(null);
  const insightsRef = useRef<HTMLDivElement>(null);
  const teamRef = useRef<HTMLDivElement>(null);

  const dropdownRefs: Record<string, React.RefObject<HTMLDivElement | null>> = {
    manage: manageRef,
    insights: insightsRef,
    team: teamRef,
  };

  // ── Outside-click handler ──────────────────────────────────

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (openDropdown) {
        const ref = dropdownRefs[openDropdown];
        if (ref?.current && !ref.current.contains(e.target as Node)) {
          setOpenDropdown(null);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [openDropdown],
  );

  useEffect(() => {
    if (openDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown, handleClickOutside]);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
    setIsMenuOpen(false);
  }, [pathname]);

  // ── Nav definitions ────────────────────────────────────────

  const isCreateActive = pathname === `/bar/${barId}/create`;

  // Manage dropdown: list pages + QR scanner
  const manageDropdown: NavDropdown = {
    id: "manage",
    label: "📋 Manage",
    items: [
      { href: `/bar/${barId}/events`, label: "📅 Events" },
      { href: `/bar/${barId}/promotions`, label: "🎁 Promotions" },
      { href: `/bar/${barId}/passes`, label: "🎟️ Passes" },
      { href: `/bar/${barId}/scanner`, label: "📷 QR Scanner" },
    ],
  };

  // Insights dropdown
  const insightsDropdown: NavDropdown = {
    id: "insights",
    label: "📊 Insights",
    items: [
      { href: `/bar/${barId}/intelligence`, label: "🧠 Intelligence" },
      { href: `/bar/${barId}/analytics`, label: "📈 Analytics" },
    ],
  };

  // Team dropdown (restricted)
  const teamDropdown: NavDropdown = {
    id: "team",
    label: "👥 Team",
    items: [
      {
        href: `/bar/${barId}/users`,
        label: "👥 Staff",
        restricted: ["OWNER", "MANAGER"],
      },
      {
        href: `/bar/${barId}/approvals`,
        label: "✅ Approvals",
        restricted: ["OWNER", "MANAGER"],
      },
    ],
  };

  // Filter restricted items
  const filterByRole = (entries: NavEntry[]) =>
    entries.filter((e) => {
      if (!e.restricted) return true;
      return e.restricted.includes(userRole);
    });

  const filteredManageItems = filterByRole(manageDropdown.items);
  const filteredInsightsItems = filterByRole(insightsDropdown.items);
  const filteredTeamItems = filterByRole(teamDropdown.items);

  // Only show team dropdown if user can see at least one item
  const showTeamDropdown = filteredTeamItems.length > 0;

  // Active-state checkers for dropdown triggers
  const isManageActive = filteredManageItems.some(
    (item) => pathname === item.href,
  );
  const isInsightsActive = filteredInsightsItems.some(
    (item) => pathname === item.href,
  );
  const isTeamActive = filteredTeamItems.some(
    (item) => pathname === item.href,
  );

  // ── Toggle handler ─────────────────────────────────────────

  const toggleDropdown = (id: string) => {
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  // ── Click handlers ─────────────────────────────────────────

  const handleNavClick = (href: string) => {
    router.push(href);
    setIsMenuOpen(false);
    setOpenDropdown(null);
  };

  const handleLogout = () => {
    document.cookie =
      "hoppr_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "hoppr_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem("hoppr_token");
    localStorage.removeItem("hoppr_user");
    router.push("/login");
  };

  const getUserName = () => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("hoppr_user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          return user.name || "Staff";
        } catch {
          return "Staff";
        }
      }
    }
    return "Staff";
  };

  // ── Render a dropdown ──────────────────────────────────────

  const renderDropdown = (
    dropdown: NavDropdown,
    isActive: boolean,
    ref: React.RefObject<HTMLDivElement | null>,
  ) => {
    const filtered = filterByRole(dropdown.items);
    if (filtered.length === 0) return null;

    const isOpen = openDropdown === dropdown.id;

    return (
      <DropdownWrapper key={dropdown.id} ref={ref}>
        <DropdownTrigger
          $active={isActive}
          $isOpen={isOpen}
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            toggleDropdown(dropdown.id);
          }}
        >
          {dropdown.label}
          <ChevronIcon />
        </DropdownTrigger>
        <DropdownMenu $isOpen={isOpen}>
          {filtered.map((item) => (
            <DropdownItem
              key={item.href}
              $active={pathname === item.href}
              onClick={() => handleNavClick(item.href)}
            >
              {item.label}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </DropdownWrapper>
    );
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    <BarNavContainer>
      {/* Logo + bar name */}
      <BarLogoContainer>
        <BarLogoImage
          src="/hoppr-neon-nobg.png"
          alt="Hoppr Logo"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <BarName title={barName}>{barName}</BarName>
      </BarLogoContainer>

      {/* Mobile hamburger */}
      <BarMobileMenuButton
        $isOpen={isMenuOpen}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        <span />
        <span />
        <span />
      </BarMobileMenuButton>

      {/* Nav items */}
      <BarNavItemsContainer $isOpen={isMenuOpen}>
        <BarNavItems>
          {/* Dashboard */}
          <BarNavItem
            $active={pathname === `/bar/${barId}/dashboard`}
            onClick={() => handleNavClick(`/bar/${barId}/dashboard`)}
          >
            📊 Dashboard
          </BarNavItem>

          {/* Create (prominent CTA) */}
          <CreateButton
            $active={isCreateActive}
            onClick={() => handleNavClick(`/bar/${barId}/create`)}
          >
            ➕ Create
          </CreateButton>

          {/* Manage dropdown */}
          {renderDropdown(manageDropdown, isManageActive, manageRef)}

          {/* Insights dropdown */}
          {renderDropdown(insightsDropdown, isInsightsActive, insightsRef)}

          {/* Team dropdown (restricted) */}
          {showTeamDropdown &&
            renderDropdown(teamDropdown, isTeamActive, teamRef)}

          {/* Preview */}
          <BarNavItem
            $active={pathname === `/bar/${barId}/preview`}
            onClick={() => handleNavClick(`/bar/${barId}/preview`)}
          >
            👁️ Preview
          </BarNavItem>

          {/* User menu */}
          <BarUserMenu>
            <BarUserName>Welcome, {getUserName()}</BarUserName>
            <BarLogoutButton onClick={handleLogout}>Logout</BarLogoutButton>
          </BarUserMenu>
        </BarNavItems>
      </BarNavItemsContainer>
    </BarNavContainer>
  );
};

export default BarNavbar;
