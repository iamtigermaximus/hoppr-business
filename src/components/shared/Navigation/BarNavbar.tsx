"use client";

import { useRouter, usePathname } from "next/navigation";
import styled from "styled-components";
import { useState } from "react";

// Bar Navbar Component
const BarNavContainer = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  position: relative;

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    flex-wrap: wrap;
  }
`;

const BarLogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 20;
  max-width: 300px;
  overflow: hidden;
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

// Define interfaces for BarNavbar props
interface BarMobileMenuButtonProps {
  $isOpen: boolean;
}

const BarMobileMenuButton = styled.button<BarMobileMenuButtonProps>`
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 24px;
  height: 18px;
  background: transparent;
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

interface BarNavItemsContainerProps {
  $isOpen: boolean;
}

const BarNavItemsContainer = styled.div<BarNavItemsContainerProps>`
  display: flex;
  gap: 1rem;
  align-items: center;

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
  }
`;

const BarNavItems = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
  }
`;

interface BarNavItemProps {
  $active?: boolean;
}

const BarNavItem = styled.a<BarNavItemProps>`
  padding: 0.5rem 1rem;
  color: ${(props) => (props.$active ? "#10b981" : "#6b7280")};
  font-weight: ${(props) => (props.$active ? "600" : "500")};
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

const BarUserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: 1rem;
  padding-left: 1rem;
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

interface BarNavbarProps {
  barName: string;
  barId: string;
  userRole: string;
}

const BarNavbar = ({ barName, barId, userRole }: BarNavbarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { href: `/bar/${barId}/dashboard`, label: "📊 Dashboard" },
    {
      href: `/bar/${barId}/users`,
      label: "👥 Users",
      restricted: ["OWNER", "MANAGER"],
    },
    { href: `/bar/${barId}/promotions`, label: "🎯 Promotions" },
    { href: `/bar/${barId}/scanner`, label: "📱 QR Scanner" },
    { href: `/bar/${barId}/analytics`, label: "📈 Analytics" },
  ];

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

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (!item.restricted) return true;
    return item.restricted.includes(userRole);
  });

  const handleNavClick = (href: string) => {
    router.push(href);
    setIsMenuOpen(false);
  };

  return (
    <BarNavContainer>
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

      <BarMobileMenuButton
        $isOpen={isMenuOpen}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </BarMobileMenuButton>

      <BarNavItemsContainer $isOpen={isMenuOpen}>
        <BarNavItems>
          {filteredNavItems.map((item) => (
            <BarNavItem
              key={item.href}
              $active={pathname === item.href}
              onClick={() => handleNavClick(item.href)}
            >
              {item.label}
            </BarNavItem>
          ))}

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
