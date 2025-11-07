// src/components/bar/BarNavbar.tsx - WITH USERS LINK
"use client";

import { useRouter, usePathname } from "next/navigation";
import styled from "styled-components";

const Nav = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
`;

const Logo = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
`;

const NavItems = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const NavItem = styled.a<{ $active?: boolean }>`
  padding: 0.5rem 1rem;
  color: ${(props) => (props.$active ? "#10b981" : "#6b7280")};
  font-weight: ${(props) => (props.$active ? "600" : "500")};
  text-decoration: none;
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;

  &:hover {
    color: #374151;
    background: #f3f4f6;
  }
`;

const UserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserName = styled.span`
  color: #6b7280;
  font-size: 0.875rem;
`;

const LogoutButton = styled.button`
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #dc2626;
  }
`;

interface BarNavbarProps {
  barName: string;
  barId: string;
  userRole: string;
}

export default function BarNavbar({
  barName,
  barId,
  userRole,
}: BarNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: `/bar/${barId}/dashboard`, label: "📊 Dashboard" },
    {
      href: `/bar/${barId}/users`,
      label: "👥 Users",
      restricted: ["OWNER", "MANAGER"],
    }, // ✅ USERS PAGE
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

  return (
    <Nav>
      <Logo>{barName}</Logo>

      <NavItems>
        {filteredNavItems.map((item) => (
          <NavItem
            key={item.href}
            $active={pathname === item.href}
            onClick={() => router.push(item.href)}
          >
            {item.label}
          </NavItem>
        ))}

        <UserMenu>
          <UserName>Welcome, {getUserName()}</UserName>
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </UserMenu>
      </NavItems>
    </Nav>
  );
}
