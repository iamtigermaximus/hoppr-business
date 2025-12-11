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

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;

  @media (min-width: 768px) {
    font-size: 2rem;
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

const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
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
        background: #10b981;
        color: white;
        &:hover { 
          background: #059669;
          transform: translateY(-1px);
        }
      `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (min-width: 768px) {
    font-size: 1rem;
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
        background: #10b981;
        color: white;
        &:hover { 
          background: #059669;
          transform: translateY(-1px);
        }
      `}

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

// Search and Filter Section
const SearchSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  min-width: 0;
  min-height: 44px;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const FilterSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: white;
  min-width: 140px;
  min-height: 44px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 1.5rem;
  }
`;

const StatCard = styled.div`
  background: white;
  padding: 1.25rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  text-align: center;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;

  @media (min-width: 768px) {
    font-size: 2rem;
  }
`;

const StatLabel = styled.div`
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }
`;

// Results Count
const ResultsCount = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  padding: 0 0.5rem;

  @media (min-width: 768px) {
    padding: 0;
  }
`;

const BarsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  }
`;

const BarCard = styled.div`
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  padding: 1.25rem;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
  }

  @media (min-width: 768px) {
    padding: 1.5rem;
  }
`;

const BarHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;

  @media (min-width: 480px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }
`;

const BarName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  line-height: 1.4;
  word-break: break-word;

  @media (min-width: 768px) {
    font-size: 1.25rem;
  }
`;

const BarMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const BarType = styled.span`
  background: #f3f4f6;
  color: #374151;
  padding: 0.375rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
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
      default:
        return "background: #f3f4f6; color: #6b7280;";
    }
  }}
`;

const BarDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex: 1;
`;

const BarDetail = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  line-height: 1.4;
`;

const BarActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 1rem;
  flex-wrap: wrap;
`;

const ActionLink = styled(Link)`
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
  min-height: 36px;
  flex: 1;
  justify-content: center;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
  }

  &.secondary {
    background: #6b7280;

    &:hover {
      background: #4b5563;
    }
  }

  @media (min-width: 480px) {
    flex: 0;
    font-size: 0.875rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #6b7280;

  h3 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
    color: #374151;
  }

  p {
    margin-bottom: 1.5rem;
    color: #6b7280;
  }
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

// NEW: Pagination Components
const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-top: 2rem;
  flex-wrap: wrap;
`;

const PageButton = styled.button<{ $active?: boolean }>`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${({ $active }) => ($active ? "#3b82f6" : "#d1d5db")};
  border-radius: 0.375rem;
  background: ${({ $active }) => ($active ? "#3b82f6" : "white")};
  color: ${({ $active }) => ($active ? "white" : "#374151")};
  font-size: 0.875rem;
  font-weight: ${({ $active }) => ($active ? "600" : "500")};
  cursor: pointer;
  transition: all 0.2s;
  min-width: 40px;
  min-height: 36px;

  &:hover:not(:disabled) {
    border-color: #3b82f6;
    background: ${({ $active }) => ($active ? "#2563eb" : "#f0f9ff")};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 0.5rem;
  white-space: nowrap;
`;

const PageSizeSelect = styled.select`
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  min-width: 80px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

// Types
interface Bar {
  id: string;
  name: string;
  type: string;
  city: string;
  district?: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
}

interface BarsStats {
  totalBars: number;
  activeBars: number;
  verifiedBars: number;
  unclaimedBars: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Interface for API response with stats
interface BarsApiResponse {
  bars: Bar[];
  pagination: PaginationInfo;
  stats?: {
    totalBars: number;
    activeBars: number;
    verifiedBars: number;
    unclaimedBars: number;
  };
}

const BarsDatabase = () => {
  const [bars, setBars] = useState<Bar[]>([]);
  const [stats, setStats] = useState<BarsStats>({
    totalBars: 0,
    activeBars: 0,
    verifiedBars: 0,
    unclaimedBars: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  // Pagination states
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  // Fetch bars with pagination
  const fetchBars = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      setError(null);

      const token =
        localStorage.getItem("hoppr_token") ||
        localStorage.getItem("admin_token") ||
        localStorage.getItem("token");

      if (!token) {
        throw new Error("No authentication token found. Please log in.");
      }

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add filters if provided
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter) params.append("status", statusFilter);
      if (cityFilter) params.append("city", cityFilter);

      const response = await fetch(
        `/api/auth/admin/bars?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        throw new Error("Your session has expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch bars: ${response.status}`);
      }

      const result: BarsApiResponse = await response.json();

      setBars(result.bars);

      // Update pagination info
      if (result.pagination) {
        setPagination(result.pagination);
      }

      // Update stats - use backend stats if provided, otherwise calculate from total
      if (result.stats) {
        // Backend provides accurate stats
        setStats(result.stats);
      } else {
        // Fallback: Use pagination total for total bars
        // Note: This won't give accurate verified/unclaimed counts
        setStats({
          totalBars: result.pagination?.total || result.bars.length,
          activeBars: result.pagination?.total || result.bars.length, // Approximate
          verifiedBars: 0, // We don't know without backend stats
          unclaimedBars: 0, // We don't know without backend stats
        });
      }
    } catch (error) {
      console.error("❌ Error in fetchBars:", error);
      setError(error instanceof Error ? error.message : "Failed to load bars");
    } finally {
      setLoading(false);
    }
  };

  // Fetch bars when component mounts
  useEffect(() => {
    fetchBars(1, pagination.limit);
  }, []);

  // Fetch bars when search/filters change
  useEffect(() => {
    // Reset to page 1 when filters change
    fetchBars(1, pagination.limit);
  }, [searchTerm, statusFilter, cityFilter]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.pages) return;
    fetchBars(page, pagination.limit);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle page size change
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLimit = parseInt(e.target.value);
    setPagination((prev) => ({ ...prev, limit: newLimit }));
    fetchBars(1, newLimit);
  };

  // Get unique cities for filter dropdown
  const getUniqueCities = () => {
    const cities = bars.map((bar) => bar.city);
    return [...new Set(cities)].sort();
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const { page, pages } = pagination;
    const pageNumbers = [];

    // Always show first page
    pageNumbers.push(1);

    // Calculate range around current page
    let start = Math.max(2, page - 2);
    let end = Math.min(pages - 1, page + 2);

    // Adjust if we're near the start
    if (page <= 3) {
      end = Math.min(pages - 1, 5);
    }

    // Adjust if we're near the end
    if (page >= pages - 2) {
      start = Math.max(2, pages - 4);
    }

    // Add ellipsis after first page if needed
    if (start > 2) {
      pageNumbers.push("...");
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }

    // Add ellipsis before last page if needed
    if (end < pages - 1) {
      pageNumbers.push("...");
    }

    // Always show last page if there is more than one page
    if (pages > 1) {
      pageNumbers.push(pages);
    }

    return pageNumbers;
  };

  const handleAddBar = () => {
    router.push("/admin/bars/create");
  };

  const handleRetry = () => {
    setError(null);
    fetchBars(pagination.page, pagination.limit);
  };

  const handleLogin = () => {
    router.push("/admin/login");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Show error state
  if (error) {
    return (
      <Container>
        <Header>
          <Title>Bars Database</Title>
          <ActionButtons>
            <LinkButton href="/admin/bars/import" $variant="secondary">
              📁 Import CSV
            </LinkButton>
            <Button $variant="primary" onClick={handleAddBar}>
              ➕ Add Bar
            </Button>
          </ActionButtons>
        </Header>
        <ErrorState>
          <h3>Authentication Required</h3>
          <p>{error}</p>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              marginTop: "1rem",
              flexWrap: "wrap",
            }}
          >
            <Button $variant="primary" onClick={handleLogin}>
              🔐 Go to Login
            </Button>
            <Button $variant="secondary" onClick={handleRetry}>
              🔄 Try Again
            </Button>
          </div>
        </ErrorState>
      </Container>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <Container>
        <Header>
          <Title>Bars Database</Title>
          <ActionButtons>
            <LinkButton href="/admin/bars/import" $variant="secondary">
              📁 Import CSV
            </LinkButton>
            <Button $variant="primary" onClick={handleAddBar}>
              ➕ Add Bar
            </Button>
          </ActionButtons>
        </Header>
        <LoadingState>
          <LoadingSpinner />
          <p>Loading bars...</p>
        </LoadingState>
      </Container>
    );
  }

  // Main content
  return (
    <Container>
      <Header>
        <Title>Bars Database</Title>
        <ActionButtons>
          <LinkButton href="/admin/bars/import" $variant="secondary">
            📁 Import CSV
          </LinkButton>
          <Button $variant="primary" onClick={handleAddBar}>
            ➕ Add Bar
          </Button>
        </ActionButtons>
      </Header>

      {/* Search and Filters Section */}
      <SearchSection>
        <SearchInput
          type="text"
          placeholder="Search bars by name, city, or type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FilterSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="VERIFIED">Verified</option>
          <option value="CLAIMED">Claimed</option>
          <option value="UNCLAIMED">Unclaimed</option>
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
      </SearchSection>

      <StatsGrid>
        <StatCard>
          <StatValue>{stats.totalBars}</StatValue>
          <StatLabel>Total Bars</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.activeBars}</StatValue>
          <StatLabel>Active Bars</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.verifiedBars}</StatValue>
          <StatLabel>Verified</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.unclaimedBars}</StatValue>
          <StatLabel>Unclaimed</StatLabel>
        </StatCard>
      </StatsGrid>

      {/* Results Count */}
      <ResultsCount>
        Showing {bars.length} of {stats.totalBars} bars
        {(searchTerm || statusFilter || cityFilter) && " (filtered)"}
        {pagination.pages > 1 &&
          ` • Page ${pagination.page} of ${pagination.pages}`}
      </ResultsCount>

      {bars.length === 0 ? (
        <EmptyState>
          <h3>No bars found</h3>
          <p>
            {stats.totalBars === 0
              ? "Get started by adding your first bar or importing from CSV."
              : "Try adjusting your search or filters to find what you're looking for."}
          </p>
          {stats.totalBars === 0 && (
            <ActionButtons style={{ justifyContent: "center" }}>
              <LinkButton href="/admin/bars/import" $variant="secondary">
                📁 Import CSV
              </LinkButton>
              <Button $variant="primary" onClick={handleAddBar}>
                ➕ Add Bar
              </Button>
            </ActionButtons>
          )}
        </EmptyState>
      ) : (
        <>
          <BarsGrid>
            {bars.map((bar) => (
              <BarCard key={bar.id}>
                <BarHeader>
                  <BarName>{bar.name}</BarName>
                  <BarMeta>
                    <BarType>{bar.type.replace("_", " ")}</BarType>
                    <StatusBadge
                      $status={bar.isVerified ? "VERIFIED" : bar.status}
                    >
                      {bar.isVerified ? "VERIFIED" : bar.status}
                    </StatusBadge>
                  </BarMeta>
                </BarHeader>

                <BarDetails>
                  <BarDetail>
                    📍{" "}
                    {bar.district ? `${bar.district}, ${bar.city}` : bar.city}
                  </BarDetail>
                  <BarDetail>📅 Added: {formatDate(bar.createdAt)}</BarDetail>
                </BarDetails>

                <BarActions>
                  <ActionLink href={`/admin/bars/${bar.id}`}>
                    View Details
                  </ActionLink>
                  <ActionLink
                    href={`/admin/bars/${bar.id}/edit`}
                    className="secondary"
                  >
                    Edit
                  </ActionLink>
                </BarActions>
              </BarCard>
            ))}
          </BarsGrid>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <PaginationContainer>
              <PageButton
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                ← Previous
              </PageButton>

              <PageInfo>
                Page {pagination.page} of {pagination.pages}
              </PageInfo>

              {getPageNumbers().map((pageNum, index) =>
                pageNum === "..." ? (
                  <span key={`ellipsis-${index}`}>...</span>
                ) : (
                  <PageButton
                    key={`page-${pageNum}`}
                    $active={pagination.page === pageNum}
                    onClick={() => handlePageChange(pageNum as number)}
                  >
                    {pageNum}
                  </PageButton>
                )
              )}

              <PageButton
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
              >
                Next →
              </PageButton>

              <PageSizeSelect
                value={pagination.limit}
                onChange={handlePageSizeChange}
              >
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </PageSizeSelect>
            </PaginationContainer>
          )}
        </>
      )}
    </Container>
  );
};

export default BarsDatabase;
