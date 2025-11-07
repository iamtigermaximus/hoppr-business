// // src/components/shared/Navigation/AdminNavbar.tsx - WITH LOGOUT
// "use client";

// import { useRouter, usePathname } from "next/navigation";
// import styled from "styled-components";

// const Nav = styled.nav`
//   display: flex;
//   align-items: center;
//   justify-content: space-between;
//   padding: 1rem 2rem;
//   background: white;
//   border-bottom: 1px solid #e5e7eb;
// `;

// const Logo = styled.div`
//   font-size: 1.25rem;
//   font-weight: 700;
//   color: #1f2937;
// `;

// const NavItems = styled.div`
//   display: flex;
//   gap: 1rem;
//   align-items: center;
// `;

// // Use transient prop with $ prefix
// const NavItem = styled.a<{ $active?: boolean }>`
//   padding: 0.5rem 1rem;
//   color: ${(props) => (props.$active ? "#7c3aed" : "#6b7280")};
//   font-weight: ${(props) => (props.$active ? "600" : "500")};
//   text-decoration: none;
//   cursor: pointer;

//   &:hover {
//     color: #374151;
//   }
// `;

// const UserMenu = styled.div`
//   display: flex;
//   align-items: center;
//   gap: 1rem;
// `;

// const UserName = styled.span`
//   color: #6b7280;
//   font-size: 0.875rem;
// `;

// const LogoutButton = styled.button`
//   padding: 0.5rem 1rem;
//   background: #ef4444;
//   color: white;
//   border: none;
//   border-radius: 0.375rem;
//   font-size: 0.875rem;
//   font-weight: 500;
//   cursor: pointer;
//   transition: background-color 0.2s;

//   &:hover {
//     background: #dc2626;
//   }
// `;

// export default function AdminNavbar() {
//   const router = useRouter();
//   const pathname = usePathname();

//   const navItems = [
//     { href: "/admin/dashboard", label: "📊 Dashboard" },
//     { href: "/admin/bars", label: "🏢 Bars" },
//     { href: "/admin/analytics", label: "📈 Analytics" },
//   ];

//   const handleLogout = () => {
//     // Clear cookies
//     document.cookie =
//       "hoppr_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
//     document.cookie =
//       "hoppr_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

//     // Clear localStorage
//     localStorage.removeItem("hoppr_token");
//     localStorage.removeItem("hoppr_user");

//     // Redirect to login
//     router.push("/login");
//   };

//   // Get user data from localStorage for display
//   const getUserName = () => {
//     if (typeof window !== "undefined") {
//       const userData = localStorage.getItem("hoppr_user");
//       if (userData) {
//         try {
//           const user = JSON.parse(userData);
//           return user.name || "Admin";
//         } catch {
//           return "Admin";
//         }
//       }
//     }
//     return "Admin";
//   };

//   return (
//     <Nav>
//       <Logo>Hoppr Admin</Logo>

//       <NavItems>
//         {navItems.map((item) => (
//           <NavItem
//             key={item.href}
//             href={item.href}
//             $active={pathname === item.href}
//           >
//             {item.label}
//           </NavItem>
//         ))}

//         <UserMenu>
//           <UserName>Welcome, {getUserName()}</UserName>
//           <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
//         </UserMenu>
//       </NavItems>
//     </Nav>
//   );
// }
// src/components/shared/Navigation/AdminNavbar.tsx - ADD USERS LINK
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

// Use transient prop with $ prefix
const NavItem = styled.a<{ $active?: boolean }>`
  padding: 0.5rem 1rem;
  color: ${(props) => (props.$active ? "#7c3aed" : "#6b7280")};
  font-weight: ${(props) => (props.$active ? "600" : "500")};
  text-decoration: none;
  cursor: pointer;

  &:hover {
    color: #374151;
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

export default function AdminNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: "/admin/dashboard", label: "📊 Dashboard" },
    { href: "/admin/users", label: "👥 Users" }, // ADD THIS LINE
    { href: "/admin/bars", label: "🏢 Bars" },
    { href: "/admin/analytics", label: "📈 Analytics" },
  ];

  const handleLogout = () => {
    // Clear cookies
    document.cookie =
      "hoppr_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "hoppr_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // Clear localStorage
    localStorage.removeItem("hoppr_token");
    localStorage.removeItem("hoppr_user");

    // Redirect to login
    router.push("/login");
  };

  // Get user data from localStorage for display
  const getUserName = () => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("hoppr_user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          return user.name || "Admin";
        } catch {
          return "Admin";
        }
      }
    }
    return "Admin";
  };

  return (
    <Nav>
      <Logo>Hoppr Admin</Logo>

      <NavItems>
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            $active={pathname === item.href}
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
