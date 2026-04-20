// // src/components/admin/bars-database/BarsDatabase.tsx
// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import styled from "styled-components";
// import Link from "next/link";

// const Container = styled.div`
//   padding: 1rem;
//   max-width: 1200px;
//   margin: 0 auto;
//   min-height: 100vh;

//   @media (min-width: 768px) {
//     padding: 2rem;
//   }
// `;

// const Header = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 1rem;
//   margin-bottom: 2rem;

//   @media (min-width: 768px) {
//     flex-direction: row;
//     justify-content: space-between;
//     align-items: center;
//   }
// `;

// const Title = styled.h1`
//   font-size: 1.5rem;
//   font-weight: 700;
//   color: #1f2937;
//   margin: 0;

//   @media (min-width: 768px) {
//     font-size: 2rem;
//   }
// `;

// const ActionButtons = styled.div`
//   display: flex;
//   gap: 0.75rem;
//   flex-wrap: wrap;

//   @media (min-width: 640px) {
//     flex-wrap: nowrap;
//   }
// `;

// const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
//   padding: 0.75rem 1.5rem;
//   border: none;
//   border-radius: 0.5rem;
//   font-weight: 600;
//   cursor: pointer;
//   transition: all 0.2s;
//   text-decoration: none;
//   display: inline-flex;
//   align-items: center;
//   gap: 0.5rem;
//   font-size: 0.875rem;
//   white-space: nowrap;
//   min-height: 44px;

//   ${({ $variant }) =>
//     $variant === "primary"
//       ? `
//         background: #3b82f6;
//         color: white;
//         &:hover {
//           background: #2563eb;
//           transform: translateY(-1px);
//         }
//       `
//       : `
//         background: #10b981;
//         color: white;
//         &:hover {
//           background: #059669;
//           transform: translateY(-1px);
//         }
//       `}

//   &:disabled {
//     opacity: 0.6;
//     cursor: not-allowed;
//     transform: none;
//   }

//   @media (min-width: 768px) {
//     font-size: 1rem;
//   }
// `;

// const LinkButton = styled(Link)<{ $variant?: "primary" | "secondary" }>`
//   padding: 0.75rem 1.5rem;
//   border: none;
//   border-radius: 0.5rem;
//   font-weight: 600;
//   cursor: pointer;
//   transition: all 0.2s;
//   text-decoration: none;
//   display: inline-flex;
//   align-items: center;
//   gap: 0.5rem;
//   font-size: 0.875rem;
//   white-space: nowrap;
//   min-height: 44px;

//   ${({ $variant }) =>
//     $variant === "primary"
//       ? `
//         background: #3b82f6;
//         color: white;
//         &:hover {
//           background: #2563eb;
//           transform: translateY(-1px);
//         }
//       `
//       : `
//         background: #10b981;
//         color: white;
//         &:hover {
//           background: #059669;
//           transform: translateY(-1px);
//         }
//       `}

//   @media (min-width: 768px) {
//     font-size: 1rem;
//   }
// `;

// // NEW: Search and Filter Section
// const SearchSection = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 1rem;
//   margin-bottom: 2rem;
//   padding: 1.5rem;
//   background: white;
//   border-radius: 0.5rem;
//   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
//   border: 1px solid #e5e7eb;

//   @media (min-width: 640px) {
//     flex-direction: row;
//     align-items: center;
//   }
// `;

// const SearchInput = styled.input`
//   flex: 1;
//   padding: 0.75rem;
//   border: 1px solid #d1d5db;
//   border-radius: 0.5rem;
//   font-size: 1rem;
//   min-width: 0;
//   min-height: 44px;

//   &:focus {
//     outline: none;
//     border-color: #3b82f6;
//     box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
//   }

//   &::placeholder {
//     color: #9ca3af;
//   }
// `;

// const FilterSelect = styled.select`
//   padding: 0.75rem;
//   border: 1px solid #d1d5db;
//   border-radius: 0.5rem;
//   font-size: 0.875rem;
//   background: white;
//   min-width: 140px;
//   min-height: 44px;
//   cursor: pointer;

//   &:focus {
//     outline: none;
//     border-color: #3b82f6;
//     box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
//   }

//   @media (min-width: 768px) {
//     font-size: 1rem;
//   }
// `;

// const StatsGrid = styled.div`
//   display: grid;
//   grid-template-columns: repeat(2, 1fr);
//   gap: 1rem;
//   margin-bottom: 2rem;

//   @media (min-width: 640px) {
//     grid-template-columns: repeat(4, 1fr);
//     gap: 1.5rem;
//   }
// `;

// const StatCard = styled.div`
//   background: white;
//   padding: 1.25rem;
//   border-radius: 0.5rem;
//   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
//   border: 1px solid #e5e7eb;
//   text-align: center;
//   transition: transform 0.2s, box-shadow 0.2s;

//   &:hover {
//     transform: translateY(-2px);
//     box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
//   }
// `;

// const StatValue = styled.div`
//   font-size: 1.5rem;
//   font-weight: 700;
//   color: #1f2937;
//   margin-bottom: 0.5rem;

//   @media (min-width: 768px) {
//     font-size: 2rem;
//   }
// `;

// const StatLabel = styled.div`
//   color: #6b7280;
//   font-size: 0.75rem;
//   font-weight: 500;

//   @media (min-width: 768px) {
//     font-size: 0.875rem;
//   }
// `;

// // NEW: Results Count
// const ResultsCount = styled.div`
//   color: #6b7280;
//   font-size: 0.875rem;
//   margin-bottom: 1rem;
//   padding: 0 0.5rem;

//   @media (min-width: 768px) {
//     padding: 0;
//   }
// `;

// const BarsGrid = styled.div`
//   display: grid;
//   grid-template-columns: 1fr;
//   gap: 1rem;

//   @media (min-width: 640px) {
//     grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
//     gap: 1.5rem;
//   }

//   @media (min-width: 1024px) {
//     grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
//   }
// `;

// const BarCard = styled.div`
//   background: white;
//   border-radius: 0.5rem;
//   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
//   border: 1px solid #e5e7eb;
//   padding: 1.25rem;
//   transition: all 0.2s;
//   display: flex;
//   flex-direction: column;

//   &:hover {
//     transform: translateY(-2px);
//     box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
//     border-color: #3b82f6;
//   }

//   @media (min-width: 768px) {
//     padding: 1.5rem;
//   }
// `;

// const BarHeader = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 0.75rem;
//   margin-bottom: 1rem;

//   @media (min-width: 480px) {
//     flex-direction: row;
//     justify-content: space-between;
//     align-items: flex-start;
//   }
// `;

// const BarName = styled.h3`
//   font-size: 1.125rem;
//   font-weight: 600;
//   color: #1f2937;
//   margin: 0;
//   line-height: 1.4;
//   word-break: break-word;

//   @media (min-width: 768px) {
//     font-size: 1.25rem;
//   }
// `;

// const BarMeta = styled.div`
//   display: flex;
//   flex-wrap: wrap;
//   gap: 0.5rem;
// `;

// const BarType = styled.span`
//   background: #f3f4f6;
//   color: #374151;
//   padding: 0.375rem 0.75rem;
//   border-radius: 1rem;
//   font-size: 0.75rem;
//   font-weight: 500;
//   white-space: nowrap;
// `;

// const StatusBadge = styled.span<{ $status: string }>`
//   padding: 0.375rem 0.75rem;
//   border-radius: 1rem;
//   font-size: 0.75rem;
//   font-weight: 500;
//   white-space: nowrap;

//   ${({ $status }) => {
//     switch ($status) {
//       case "VERIFIED":
//         return "background: #dcfce7; color: #166534;";
//       case "CLAIMED":
//         return "background: #dbeafe; color: #1e40af;";
//       case "UNCLAIMED":
//         return "background: #f3f4f6; color: #6b7280;";
//       default:
//         return "background: #f3f4f6; color: #6b7280;";
//     }
//   }}
// `;

// const BarDetails = styled.div`
//   display: flex;
//   flex-direction: column;
//   gap: 0.5rem;
//   margin-bottom: 1rem;
//   flex: 1;
// `;

// const BarDetail = styled.div`
//   color: #6b7280;
//   font-size: 0.875rem;
//   display: flex;
//   align-items: center;
//   gap: 0.5rem;
//   line-height: 1.4;
// `;

// const BarActions = styled.div`
//   display: flex;
//   gap: 0.5rem;
//   margin-top: auto;
//   padding-top: 1rem;
//   flex-wrap: wrap;
// `;

// const ActionLink = styled(Link)`
//   padding: 0.5rem 1rem;
//   background: #3b82f6;
//   color: white;
//   border: none;
//   border-radius: 0.375rem;
//   font-size: 0.75rem;
//   font-weight: 500;
//   text-decoration: none;
//   cursor: pointer;
//   transition: all 0.2s;
//   display: inline-flex;
//   align-items: center;
//   gap: 0.25rem;
//   white-space: nowrap;
//   min-height: 36px;
//   flex: 1;
//   justify-content: center;

//   &:hover {
//     background: #2563eb;
//     transform: translateY(-1px);
//   }

//   &.secondary {
//     background: #6b7280;

//     &:hover {
//       background: #4b5563;
//     }
//   }

//   @media (min-width: 480px) {
//     flex: 0;
//     font-size: 0.875rem;
//   }
// `;

// const EmptyState = styled.div`
//   text-align: center;
//   padding: 3rem;
//   color: #6b7280;

//   h3 {
//     font-size: 1.25rem;
//     margin-bottom: 0.5rem;
//     color: #374151;
//   }

//   p {
//     margin-bottom: 1.5rem;
//     color: #6b7280;
//   }
// `;

// const LoadingState = styled.div`
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   padding: 3rem;
//   color: #6b7280;
//   text-align: center;
// `;

// const LoadingSpinner = styled.div`
//   width: 40px;
//   height: 40px;
//   border: 4px solid #f3f4f6;
//   border-top: 4px solid #3b82f6;
//   border-radius: 50%;
//   animation: spin 1s linear infinite;
//   margin-bottom: 1rem;

//   @keyframes spin {
//     0% {
//       transform: rotate(0deg);
//     }
//     100% {
//       transform: rotate(360deg);
//     }
//   }
// `;

// const ErrorState = styled.div`
//   background: #fef2f2;
//   border: 1px solid #fecaca;
//   color: #dc2626;
//   padding: 1.5rem;
//   border-radius: 0.5rem;
//   text-align: center;
//   margin: 2rem 0;
// `;

// // Types
// interface Bar {
//   id: string;
//   name: string;
//   type: string;
//   city: string;
//   district?: string;
//   status: string;
//   isVerified: boolean;
//   createdAt: string;
// }

// interface BarsStats {
//   totalBars: number;
//   activeBars: number;
//   verifiedBars: number;
//   unclaimedBars: number;
// }

// const BarsDatabase = () => {
//   const [bars, setBars] = useState<Bar[]>([]);
//   const [filteredBars, setFilteredBars] = useState<Bar[]>([]);
//   const [stats, setStats] = useState<BarsStats>({
//     totalBars: 0,
//     activeBars: 0,
//     verifiedBars: 0,
//     unclaimedBars: 0,
//   });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const router = useRouter();

//   // NEW: Search and filter states
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("");
//   const [cityFilter, setCityFilter] = useState("");

//   useEffect(() => {
//     fetchBars();
//   }, []);

//   // NEW: Filter bars when search or filters change
//   useEffect(() => {
//     filterBars();
//   }, [bars, searchTerm, statusFilter, cityFilter]);

//   const fetchBars = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const token =
//         localStorage.getItem("hoppr_token") ||
//         localStorage.getItem("admin_token") ||
//         localStorage.getItem("token");

//       if (!token) {
//         throw new Error("No authentication token found. Please log in.");
//       }

//       const response = await fetch("/api/auth/admin/bars", {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (response.status === 401) {
//         throw new Error("Your session has expired. Please log in again.");
//       }

//       if (!response.ok) {
//         throw new Error(`Failed to fetch bars: ${response.status}`);
//       }

//       const result = await response.json();
//       setBars(result.bars);
//       updateStats(result.bars);
//     } catch (error) {
//       console.error("❌ Error in fetchBars:", error);
//       setError(error instanceof Error ? error.message : "Failed to load bars");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // NEW: Filter bars based on search and filters
//   const filterBars = () => {
//     let filtered = bars;

//     // Apply search filter
//     if (searchTerm) {
//       filtered = filtered.filter(
//         (bar) =>
//           bar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           bar.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           bar.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//           bar.type.toLowerCase().includes(searchTerm.toLowerCase())
//       );
//     }

//     // Apply status filter
//     if (statusFilter) {
//       filtered = filtered.filter((bar) => {
//         if (statusFilter === "VERIFIED") {
//           return bar.isVerified;
//         }
//         return bar.status === statusFilter;
//       });
//     }

//     // Apply city filter
//     if (cityFilter) {
//       filtered = filtered.filter((bar) => bar.city === cityFilter);
//     }

//     setFilteredBars(filtered);
//   };

//   const updateStats = (barsData: Bar[]) => {
//     // Show VERIFIED status if bar is verified, otherwise show CLAIMED/UNCLAIMED
//     const verifiedBars = barsData.filter((b) => b.isVerified).length;

//     const unclaimedBars = barsData.filter(
//       (b) => b.status === "UNCLAIMED"
//     ).length;

//     setStats({
//       totalBars: barsData.length,
//       activeBars: barsData.filter((b) => b.status !== "SUSPENDED").length,
//       verifiedBars: verifiedBars,
//       unclaimedBars: unclaimedBars,
//     });
//   };

//   // NEW: Get unique cities for filter dropdown
//   const getUniqueCities = () => {
//     const cities = bars.map((bar) => bar.city);
//     return [...new Set(cities)].sort();
//   };

//   const handleAddBar = () => {
//     router.push("/admin/bars/create");
//   };

//   const handleRetry = () => {
//     setError(null);
//     fetchBars();
//   };

//   const handleLogin = () => {
//     router.push("/admin/login");
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//     });
//   };

//   // Show error state
//   if (error) {
//     return (
//       <Container>
//         <Header>
//           <Title>Bars Database</Title>
//           <ActionButtons>
//             <LinkButton href="/admin/bars/import" $variant="secondary">
//               📁 Import CSV
//             </LinkButton>
//             <Button $variant="primary" onClick={handleAddBar}>
//               ➕ Add Bar
//             </Button>
//           </ActionButtons>
//         </Header>
//         <ErrorState>
//           <h3>Authentication Required</h3>
//           <p>{error}</p>
//           <div
//             style={{
//               display: "flex",
//               gap: "1rem",
//               justifyContent: "center",
//               marginTop: "1rem",
//               flexWrap: "wrap",
//             }}
//           >
//             <Button $variant="primary" onClick={handleLogin}>
//               🔐 Go to Login
//             </Button>
//             <Button $variant="secondary" onClick={handleRetry}>
//               🔄 Try Again
//             </Button>
//           </div>
//         </ErrorState>
//       </Container>
//     );
//   }

//   // Show loading state
//   if (loading) {
//     return (
//       <Container>
//         <Header>
//           <Title>Bars Database</Title>
//           <ActionButtons>
//             <LinkButton href="/admin/bars/import" $variant="secondary">
//               📁 Import CSV
//             </LinkButton>
//             <Button $variant="primary" onClick={handleAddBar}>
//               ➕ Add Bar
//             </Button>
//           </ActionButtons>
//         </Header>
//         <LoadingState>
//           <LoadingSpinner />
//           <p>Loading bars...</p>
//         </LoadingState>
//       </Container>
//     );
//   }

//   // Main content
//   return (
//     <Container>
//       <Header>
//         <Title>Bars Database</Title>
//         <ActionButtons>
//           <LinkButton href="/admin/bars/import" $variant="secondary">
//             📁 Import CSV
//           </LinkButton>
//           <Button $variant="primary" onClick={handleAddBar}>
//             ➕ Add Bar
//           </Button>
//         </ActionButtons>
//       </Header>

//       {/* NEW: Search and Filters Section */}
//       <SearchSection>
//         <SearchInput
//           type="text"
//           placeholder="Search bars by name, city, or type..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//         />
//         <FilterSelect
//           value={statusFilter}
//           onChange={(e) => setStatusFilter(e.target.value)}
//         >
//           <option value="">All Status</option>
//           <option value="VERIFIED">Verified</option>
//           <option value="CLAIMED">Claimed</option>
//           <option value="UNCLAIMED">Unclaimed</option>
//         </FilterSelect>
//         <FilterSelect
//           value={cityFilter}
//           onChange={(e) => setCityFilter(e.target.value)}
//         >
//           <option value="">All Cities</option>
//           {getUniqueCities().map((city) => (
//             <option key={city} value={city}>
//               {city}
//             </option>
//           ))}
//         </FilterSelect>
//       </SearchSection>

//       <StatsGrid>
//         <StatCard>
//           <StatValue>{stats.totalBars}</StatValue>
//           <StatLabel>Total Bars</StatLabel>
//         </StatCard>
//         <StatCard>
//           <StatValue>{stats.activeBars}</StatValue>
//           <StatLabel>Active Bars</StatLabel>
//         </StatCard>
//         <StatCard>
//           <StatValue>{stats.verifiedBars}</StatValue>
//           <StatLabel>Verified</StatLabel>
//         </StatCard>
//         <StatCard>
//           <StatValue>{stats.unclaimedBars}</StatValue>
//           <StatLabel>Unclaimed</StatLabel>
//         </StatCard>
//       </StatsGrid>

//       {/* NEW: Results Count */}
//       <ResultsCount>
//         Showing {filteredBars.length} of {bars.length} bars
//         {(searchTerm || statusFilter || cityFilter) && " (filtered)"}
//       </ResultsCount>

//       {filteredBars.length === 0 ? (
//         <EmptyState>
//           <h3>No bars found</h3>
//           <p>
//             {bars.length === 0
//               ? "Get started by adding your first bar or importing from CSV."
//               : "Try adjusting your search or filters to find what you're looking for."}
//           </p>
//           {bars.length === 0 && (
//             <ActionButtons style={{ justifyContent: "center" }}>
//               <LinkButton href="/admin/bars/import" $variant="secondary">
//                 📁 Import CSV
//               </LinkButton>
//               <Button $variant="primary" onClick={handleAddBar}>
//                 ➕ Add Bar
//               </Button>
//             </ActionButtons>
//           )}
//         </EmptyState>
//       ) : (
//         <BarsGrid>
//           {filteredBars.map((bar) => (
//             <BarCard key={bar.id}>
//               <BarHeader>
//                 <BarName>{bar.name}</BarName>
//                 <BarMeta>
//                   <BarType>{bar.type.replace("_", " ")}</BarType>
//                   {/* Show VERIFIED status if bar is verified, otherwise show CLAIMED/UNCLAIMED */}
//                   <StatusBadge
//                     $status={bar.isVerified ? "VERIFIED" : bar.status}
//                   >
//                     {bar.isVerified ? "VERIFIED" : bar.status}
//                   </StatusBadge>
//                 </BarMeta>
//               </BarHeader>

//               <BarDetails>
//                 <BarDetail>
//                   📍 {bar.district ? `${bar.district}, ${bar.city}` : bar.city}
//                 </BarDetail>
//                 <BarDetail>📅 Added: {formatDate(bar.createdAt)}</BarDetail>
//               </BarDetails>

//               <BarActions>
//                 <ActionLink href={`/admin/bars/${bar.id}`}>
//                   View Details
//                 </ActionLink>
//                 <ActionLink
//                   href={`/admin/bars/${bar.id}/edit`}
//                   className="secondary"
//                 >
//                   Edit
//                 </ActionLink>
//               </BarActions>
//             </BarCard>
//           ))}
//         </BarsGrid>
//       )}
//     </Container>
//   );
// };

// export default BarsDatabase;
// src/components/admin/bars-database/BarsDatabase.tsx
// src/components/admin/bars-database/BarsDatabase.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import Link from "next/link";

// Styled Components
const Container = styled.div`
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  min-height: 100vh;
  background: #f8fafc;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" | "danger" }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  ${({ $variant }) => {
    switch ($variant) {
      case "primary":
        return `
          background: #3b82f6;
          color: white;
          &:hover { background: #2563eb; }
        `;
      case "danger":
        return `
          background: #ef4444;
          color: white;
          &:hover { background: #dc2626; }
        `;
      default:
        return `
          background: #10b981;
          color: white;
          &:hover { background: #059669; }
        `;
    }
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LinkButton = styled(Link)<{ $variant?: "primary" | "secondary" }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 40px;

  ${({ $variant }) =>
    $variant === "primary"
      ? `
        background: #3b82f6;
        color: white;
        &:hover { background: #2563eb; }
      `
      : `
        background: #10b981;
        color: white;
        &:hover { background: #059669; }
      `}
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  width: 250px;
  min-height: 40px;
`;

const FilterSelect = styled.select`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  min-height: 40px;
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
`;

const Table = styled.table`
  width: 100%;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-collapse: collapse;
  min-width: 800px;
`;

const Th = styled.th`
  text-align: left;
  padding: 1rem;
  background: #f8f9fa;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  color: #6b7280;
  vertical-align: middle;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 600;
  background: ${(props) =>
    props.$status === "VERIFIED"
      ? "#dcfce7"
      : props.$status === "CLAIMED"
        ? "#dbeafe"
        : props.$status === "SUSPENDED"
          ? "#fee2e2"
          : "#f3f4f6"};
  color: ${(props) =>
    props.$status === "VERIFIED"
      ? "#166534"
      : props.$status === "CLAIMED"
        ? "#1e40af"
        : props.$status === "SUSPENDED"
          ? "#dc2626"
          : "#6b7280"};
`;

const ActionButton = styled.button`
  background: #3b82f6;
  color: white;
  padding: 0.25rem 0.75rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;
  margin-right: 0.5rem;

  &:hover {
    background: #2563eb;
  }
`;

const DeleteButton = styled.button`
  background: #ef4444;
  color: white;
  padding: 0.25rem 0.75rem;
  border: none;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  cursor: pointer;

  &:hover {
    background: #dc2626;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const PageButton = styled.button<{ $active?: boolean; disabled?: boolean }>`
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: ${(props) => (props.$active ? "#3b82f6" : "white")};
  color: ${(props) => (props.$active ? "white" : "#374151")};
  border-radius: 0.375rem;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  margin: 0 0.25rem;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};

  &:hover {
    background: ${(props) =>
      !props.disabled && (props.$active ? "#2563eb" : "#f3f4f6")};
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;
`;

const ErrorState = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  text-align: center;
`;

const SuccessState = styled.div`
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  color: #166534;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  text-align: center;
`;

// Modal for CSV Upload
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
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 0.5rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
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
`;

const FileInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
`;

const UploadProgress = styled.div`
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin: 1rem 0;
`;

const ProgressBar = styled.div<{ $width: number }>`
  width: ${(props) => props.$width}%;
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
`;

interface Bar {
  id: string;
  name: string;
  city: string;
  district: string | null;
  type: string;
  status: string;
  isVerified: boolean;
  isActive: boolean;
  profileViews: number;
  staffCount: number;
  promotionCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const BarsDatabase = () => {
  const router = useRouter();
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  // CSV Upload states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const getToken = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("hoppr_token");
    }
    return null;
  };

  const fetchBars = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();

      if (!token) {
        router.push("/admin/login");
        return;
      }

      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());
      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (typeFilter) params.append("type", typeFilter);
      if (cityFilter) params.append("city", cityFilter);

      const response = await fetch(
        `/api/auth/admin/bars?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setBars(data.data || []);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 0,
        }));
      } else if (response.status === 401) {
        router.push("/admin/login");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch bars");
      }
    } catch (error) {
      console.error("Error fetching bars:", error);
      setError("Failed to load bars. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("csvFile", selectedFile);

    try {
      const token = getToken();

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percent = (event.loaded / event.total) * 100;
          setUploadProgress(percent);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200 || xhr.status === 201) {
          const response = JSON.parse(xhr.responseText);
          setSuccess(`Successfully imported ${response.imported || 0} bars!`);
          setShowUploadModal(false);
          setSelectedFile(null);
          fetchBars();
          setTimeout(() => setSuccess(null), 3000);
        } else {
          const error = JSON.parse(xhr.responseText);
          setError(error.error || "Failed to upload CSV");
        }
        setUploading(false);
      });

      xhr.addEventListener("error", () => {
        setError("Network error during upload");
        setUploading(false);
      });

      xhr.open("POST", "/api/auth/admin/bars/import");
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    } catch (error) {
      console.error("Error uploading CSV:", error);
      setError("Failed to upload CSV file");
      setUploading(false);
    }
  };

  const getUniqueCities = (): string[] => {
    if (!bars || bars.length === 0) return [];
    const cities = bars.map((bar) => bar.city).filter(Boolean);
    return [...new Set(cities)].sort();
  };

  const getUniqueTypes = (): string[] => {
    if (!bars || bars.length === 0) return [];
    const types = bars.map((bar) => bar.type).filter(Boolean);
    return [...new Set(types)].sort();
  };

  useEffect(() => {
    fetchBars();
  }, [pagination.page, search, statusFilter, typeFilter, cityFilter]);

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleViewBar = (barId: string) => {
    router.push(`/admin/bars/${barId}`);
  };

  const handleDeleteBar = async (barId: string, barName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${barName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`/api/auth/admin/bars/${barId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccess(`Successfully deleted "${barName}"`);
        fetchBars();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const error = await response.json();
        setError(error.error || "Failed to delete bar");
      }
    } catch (error) {
      console.error("Error deleting bar:", error);
      setError("Failed to delete bar");
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && bars.length === 0) {
    return (
      <Container>
        <LoadingState>Loading bars...</LoadingState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Bars Database</Title>
        <ActionButtons>
          <LinkButton href="/admin/bars/import" $variant="secondary">
            📁 Import CSV
          </LinkButton>
          <LinkButton href="/admin/bars/create" $variant="primary">
            ➕ Add Bar
          </LinkButton>
        </ActionButtons>
      </Header>

      {error && <ErrorState>{error}</ErrorState>}
      {success && <SuccessState>{success}</SuccessState>}

      <Controls>
        <SearchInput
          type="text"
          placeholder="Search by name, city, district..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FilterSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="VERIFIED">Verified</option>
          <option value="CLAIMED">Claimed</option>
          <option value="UNCLAIMED">Unclaimed</option>
          <option value="SUSPENDED">Suspended</option>
        </FilterSelect>
        <FilterSelect
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          {getUniqueTypes().map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, " ")}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          <option value="">All Cities</option>
          {getUniqueCities().map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </FilterSelect>
      </Controls>

      <TableWrapper>
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>City</Th>
              <Th>District</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Staff</Th>
              <Th>Promotions</Th>
              <Th>Views</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {bars.map((bar) => (
              <tr key={bar.id}>
                <Td>
                  <strong>{bar.name}</strong>
                </Td>
                <Td>{bar.city}</Td>
                <Td>{bar.district || "-"}</Td>
                <Td>{bar.type.replace(/_/g, " ")}</Td>
                <Td>
                  <StatusBadge $status={bar.status}>{bar.status}</StatusBadge>
                </Td>
                <Td>{bar.staffCount}</Td>
                <Td>{bar.promotionCount}</Td>
                <Td>{bar.profileViews.toLocaleString()}</Td>
                <Td>{formatDate(bar.createdAt)}</Td>
                <Td>
                  <ActionButton onClick={() => handleViewBar(bar.id)}>
                    View
                  </ActionButton>
                  <DeleteButton
                    onClick={() => handleDeleteBar(bar.id, bar.name)}
                  >
                    Delete
                  </DeleteButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableWrapper>

      {pagination.totalPages > 1 && (
        <Pagination>
          <div>
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} bars
          </div>
          <div>
            <PageButton
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </PageButton>
            {Array.from(
              { length: Math.min(5, pagination.totalPages) },
              (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <PageButton
                    key={pageNum}
                    $active={pagination.page === pageNum}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </PageButton>
                );
              },
            )}
            <PageButton
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Next
            </PageButton>
          </div>
        </Pagination>
      )}

      {/* CSV Upload Modal */}
      {showUploadModal && (
        <ModalOverlay onClick={() => !uploading && setShowUploadModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Import Bars from CSV</ModalTitle>
              <CloseButton
                onClick={() => !uploading && setShowUploadModal(false)}
              >
                ×
              </CloseButton>
            </ModalHeader>

            <FileInput
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              disabled={uploading}
            />

            {selectedFile && (
              <>
                <p>
                  <strong>Selected file:</strong> {selectedFile.name}
                </p>
                <p>
                  <strong>File size:</strong>{" "}
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </>
            )}

            {uploading && (
              <UploadProgress>
                <ProgressBar $width={uploadProgress} />
              </UploadProgress>
            )}

            <ModalButtons>
              <Button
                $variant="secondary"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                $variant="primary"
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
              >
                {uploading ? "Uploading..." : "Import CSV"}
              </Button>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default BarsDatabase;
