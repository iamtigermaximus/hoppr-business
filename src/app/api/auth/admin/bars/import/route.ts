// // src/app/api/admin/bars/import/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient, BarType, PriceRange, AdminUser } from "@prisma/client";
// import csvParse from "csv-parse";

// const prisma = new PrismaClient();

// // Valid enums from your business schema
// const VALID_BAR_TYPES = [
//   "PUB",
//   "CLUB",
//   "LOUNGE",
//   "COCKTAIL_BAR",
//   "RESTAURANT_BAR",
//   "SPORTS_BAR",
//   "KARAOKE",
//   "LIVE_MUSIC",
// ] as const;

// const VALID_PRICE_RANGES = ["BUDGET", "MODERATE", "PREMIUM", "LUXURY"] as const;

// interface CSVRecord {
//   name?: string;
//   type?: string;
//   address?: string;
//   city?: string;
//   district?: string;
//   latitude?: string;
//   longitude?: string;
//   phone?: string;
//   email?: string;
//   website?: string;
//   instagram?: string;
//   priceRange?: string;
//   capacity?: string;
//   amenities?: string;
//   description?: string;
//   operatingHours?: string;
//   vipEnabled?: string;
//   coverImage?: string;
//   imageUrls?: string;
//   logoUrl?: string;
// }

// interface OperatingHours {
//   [key: string]: { open: string; close: string };
// }

// interface BarCreateData {
//   name: string;
//   type: BarType;
//   address: string;
//   city: string;
//   district: string | null;
//   latitude: number | null;
//   longitude: number | null;
//   phone: string | null;
//   email: string | null;
//   website: string | null;
//   instagram: string | null;
//   priceRange: PriceRange | null;
//   capacity: number | null;
//   amenities: string[];
//   description: string | null;
//   operatingHours: OperatingHours;
//   vipEnabled: boolean;
//   coverImage: string | null;
//   imageUrls: string[];
//   logoUrl: string | null;
//   status: "UNCLAIMED";
//   isVerified: boolean;
//   isActive: boolean;
//   createdById: string;
// }

// export async function POST(request: NextRequest) {
//   try {
//     const token = request.headers.get("authorization")?.replace("Bearer ", "");
//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // Verify admin user
//     const adminUser = await verifyAdminToken(token);
//     if (!adminUser) {
//       return NextResponse.json(
//         { error: "Invalid admin token" },
//         { status: 401 }
//       );
//     }

//     const formData = await request.formData();
//     const csvFile = formData.get("csvFile") as File;

//     if (!csvFile) {
//       return NextResponse.json({ error: "No file provided" }, { status: 400 });
//     }

//     // Check file size (max 10MB)
//     if (csvFile.size > 10 * 1024 * 1024) {
//       return NextResponse.json(
//         { error: "File too large. Maximum size is 10MB." },
//         { status: 400 }
//       );
//     }

//     const csvText = await csvFile.text();

//     // Parse CSV with proper typing
//     const records: CSVRecord[] = await new Promise((resolve, reject) => {
//       csvParse(
//         csvText,
//         {
//           columns: true,
//           skip_empty_lines: true,
//           trim: true,
//         },
//         (err: Error | undefined, output: CSVRecord[]) => {
//           if (err) reject(err);
//           else resolve(output);
//         }
//       );
//     });

//     if (records.length === 0) {
//       return NextResponse.json(
//         { error: "CSV file is empty or has no valid data" },
//         { status: 400 }
//       );
//     }

//     let importedCount = 0;
//     let failedCount = 0;
//     const errors: string[] = [];

//     // Process each row
//     for (const [index, record] of records.entries()) {
//       const rowNumber = index + 2; // +2 because header is row 1

//       try {
//         // Validate required fields
//         if (!record.name?.trim()) {
//           errors.push(`Row ${rowNumber}: Missing bar name`);
//           failedCount++;
//           continue;
//         }

//         if (!record.type?.trim()) {
//           errors.push(`Row ${rowNumber}: Missing bar type`);
//           failedCount++;
//           continue;
//         }

//         if (!record.address?.trim()) {
//           errors.push(`Row ${rowNumber}: Missing address`);
//           failedCount++;
//           continue;
//         }

//         if (!record.city?.trim()) {
//           errors.push(`Row ${rowNumber}: Missing city`);
//           failedCount++;
//           continue;
//         }

//         // Validate bar type
//         const barType = record.type.toUpperCase();
//         if (
//           !VALID_BAR_TYPES.includes(barType as (typeof VALID_BAR_TYPES)[number])
//         ) {
//           errors.push(
//             `Row ${rowNumber}: Invalid bar type "${
//               record.type
//             }". Must be one of: ${VALID_BAR_TYPES.join(", ")}`
//           );
//           failedCount++;
//           continue;
//         }

//         // Validate price range if provided
//         if (
//           record.priceRange &&
//           !VALID_PRICE_RANGES.includes(
//             record.priceRange.toUpperCase() as (typeof VALID_PRICE_RANGES)[number]
//           )
//         ) {
//           errors.push(
//             `Row ${rowNumber}: Invalid price range "${
//               record.priceRange
//             }". Must be one of: ${VALID_PRICE_RANGES.join(", ")}`
//           );
//           failedCount++;
//           continue;
//         }

//         // Validate latitude and longitude
//         let latitude: number | null = null;
//         let longitude: number | null = null;

//         if (record.latitude) {
//           latitude = parseFloat(record.latitude);
//           if (isNaN(latitude) || latitude < -90 || latitude > 90) {
//             errors.push(
//               `Row ${rowNumber}: Invalid latitude "${record.latitude}". Must be between -90 and 90.`
//             );
//             failedCount++;
//             continue;
//           }
//         }

//         if (record.longitude) {
//           longitude = parseFloat(record.longitude);
//           if (isNaN(longitude) || longitude < -180 || longitude > 180) {
//             errors.push(
//               `Row ${rowNumber}: Invalid longitude "${record.longitude}". Must be between -180 and 180.`
//             );
//             failedCount++;
//             continue;
//           }
//         }

//         // Both or neither coordinates should be provided
//         if ((latitude && !longitude) || (!latitude && longitude)) {
//           errors.push(
//             `Row ${rowNumber}: Both latitude and longitude must be provided together, or both omitted.`
//           );
//           failedCount++;
//           continue;
//         }

//         // Parse operating hours if provided
//         let operatingHours: OperatingHours = getDefaultOperatingHours();
//         if (record.operatingHours) {
//           try {
//             const parsedHours = JSON.parse(record.operatingHours);
//             if (typeof parsedHours === "object" && parsedHours !== null) {
//               operatingHours = parsedHours as OperatingHours;
//             } else {
//               throw new Error("Invalid format");
//             }
//           } catch (parseError) {
//             errors.push(
//               `Row ${rowNumber}: Invalid operatingHours format. Must be valid JSON.`
//             );
//             failedCount++;
//             continue;
//           }
//         }

//         // Parse image URLs array
//         let imageUrls: string[] = [];
//         if (record.imageUrls) {
//           imageUrls = record.imageUrls
//             .split(",")
//             .map((url: string) => url.trim())
//             .filter(Boolean);
//         }

//         // Parse amenities array
//         let amenities: string[] = [];
//         if (record.amenities) {
//           amenities = record.amenities
//             .split(",")
//             .map((amenity: string) => amenity.trim())
//             .filter(Boolean);
//         }

//         // Check for duplicate bar name
//         const existingBar = await prisma.bar.findUnique({
//           where: { name: record.name.trim() },
//         });

//         if (existingBar) {
//           errors.push(`Row ${rowNumber}: Bar "${record.name}" already exists`);
//           failedCount++;
//           continue;
//         }

//         // Prepare data for creation with proper types
//         const barData: BarCreateData = {
//           name: record.name.trim(),
//           type: barType as BarType,
//           address: record.address.trim(),
//           city: record.city.trim(),
//           district: record.district?.trim() || null,
//           latitude: latitude,
//           longitude: longitude,
//           phone: record.phone?.trim() || null,
//           email: record.email?.trim() || null,
//           website: record.website?.trim() || null,
//           instagram: record.instagram?.trim() || null,
//           priceRange: record.priceRange
//             ? (record.priceRange.toUpperCase() as PriceRange)
//             : null,
//           capacity: record.capacity ? parseInt(record.capacity) : null,
//           amenities: amenities,
//           description: record.description?.trim() || null,
//           operatingHours: operatingHours,
//           vipEnabled: record.vipEnabled
//             ? record.vipEnabled.toLowerCase() === "true"
//             : false,
//           coverImage: record.coverImage?.trim() || null,
//           imageUrls: imageUrls,
//           logoUrl: record.logoUrl?.trim() || null,
//           status: "UNCLAIMED",
//           isVerified: false,
//           isActive: true,
//           createdById: adminUser.id,
//         };

//         // Create the bar
//         await prisma.bar.create({
//           data: barData,
//         });

//         importedCount++;
//       } catch (error) {
//         console.error(`Error processing row ${rowNumber}:`, error);
//         errors.push(
//           `Row ${rowNumber}: ${
//             error instanceof Error ? error.message : "Unknown error"
//           }`
//         );
//         failedCount++;
//       }
//     }

//     // Create import record for audit
//     await prisma.barImport.create({
//       data: {
//         fileName: csvFile.name,
//         fileSize: csvFile.size,
//         totalRows: records.length,
//         importedRows: importedCount,
//         failedRows: failedCount,
//         status:
//           failedCount === 0
//             ? "COMPLETED"
//             : failedCount === records.length
//             ? "FAILED"
//             : "PARTIAL",
//         errors: errors.length > 0 ? errors : undefined,
//         importedBy: adminUser.id,
//       },
//     });

//     // Create audit log
//     await prisma.auditLog.create({
//       data: {
//         adminId: adminUser.id,
//         action: "BULK_IMPORT",
//         resource: "BAR",
//         details: {
//           fileName: csvFile.name,
//           importedCount,
//           failedCount,
//           totalCount: records.length,
//         },
//         ipAddress: request.headers.get("x-forwarded-for") || "unknown",
//         userAgent: request.headers.get("user-agent") || "unknown",
//       },
//     });

//     return NextResponse.json({
//       success: true,
//       imported: importedCount,
//       failed: failedCount,
//       total: records.length,
//       errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
//     });
//   } catch (error) {
//     console.error("CSV import error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// // Helper function to get default operating hours
// function getDefaultOperatingHours(): OperatingHours {
//   return {
//     monday: { open: "16:00", close: "02:00" },
//     tuesday: { open: "16:00", close: "02:00" },
//     wednesday: { open: "16:00", close: "02:00" },
//     thursday: { open: "16:00", close: "02:00" },
//     friday: { open: "16:00", close: "04:00" },
//     saturday: { open: "14:00", close: "04:00" },
//     sunday: { open: "14:00", close: "02:00" },
//   };
// }

// // Helper function to verify admin token
// async function verifyAdminToken(token: string): Promise<AdminUser | null> {
//   try {
//     const adminUser = await prisma.adminUser.findFirst({
//       where: {
//         id: token,
//         isActive: true,
//       },
//     });
//     return adminUser;
//   } catch (error) {
//     return null;
//   }
// }
// src/app/api/auth/admin/bars/import/route.ts
// src/app/api/admin/bars/import/route.ts
// src/app/api/admin/bars/import/route.ts
// src/app/api/auth/admin/bars/import/route.ts
// src/app/api/auth/admin/bars/import/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient, BarType, PriceRange, AdminUser } from "@prisma/client";
// import Papa from "papaparse";
// import { verifyToken, isAdminToken, AdminJWTPayload } from "@/lib/auth";

// const prisma = new PrismaClient();

// // Valid enums from your business schema
// const VALID_BAR_TYPES = [
//   "PUB",
//   "CLUB",
//   "LOUNGE",
//   "COCKTAIL_BAR",
//   "RESTAURANT_BAR",
//   "SPORTS_BAR",
//   "KARAOKE",
//   "LIVE_MUSIC",
// ] as const;

// const VALID_PRICE_RANGES = ["BUDGET", "MODERATE", "PREMIUM", "LUXURY"] as const;

// interface CSVRecord {
//   name?: string;
//   type?: string;
//   address?: string;
//   city?: string;
//   district?: string;
//   latitude?: string;
//   longitude?: string;
//   phone?: string;
//   email?: string;
//   website?: string;
//   instagram?: string;
//   priceRange?: string;
//   capacity?: string;
//   amenities?: string;
//   description?: string;
//   operatingHours?: string;
//   vipEnabled?: string;
//   coverImage?: string;
//   imageUrls?: string;
//   logoUrl?: string;
// }

// interface OperatingHours {
//   [key: string]: { open: string; close: string };
// }

// interface BarCreateData {
//   name: string;
//   type: BarType;
//   address: string;
//   city: string;
//   district: string | null;
//   latitude: number | null;
//   longitude: number | null;
//   phone: string | null;
//   email: string | null;
//   website: string | null;
//   instagram: string | null;
//   priceRange: PriceRange | null;
//   capacity: number | null;
//   amenities: string[];
//   description: string | null;
//   operatingHours: OperatingHours;
//   vipEnabled: boolean;
//   coverImage: string | null;
//   imageUrls: string[];
//   logoUrl: string | null;
//   status: "UNCLAIMED";
//   isVerified: boolean;
//   isActive: boolean;
//   createdById: string;
// }

// // Helper to safely extract user ID from token payload (SAME AS BARS API)
// function getUserIdFromPayload(payload: AdminJWTPayload): string | null {
//   // Check both possible field names safely
//   if ("userId" in payload && typeof payload.userId === "string") {
//     return payload.userId;
//   }

//   if ("id" in payload && typeof payload.id === "string") {
//     return payload.id;
//   }

//   return null;
// }

// // Helper function to verify admin token (SAME AS BARS API)
// async function verifyAdminToken(token: string) {
//   try {
//     const payload = verifyToken(token);

//     if (!payload || !isAdminToken(payload)) {
//       console.log("Invalid token or not an admin token");
//       return null;
//     }

//     const userId = getUserIdFromPayload(payload);

//     if (!userId) {
//       console.log("No user ID found in token payload");
//       return null;
//     }

//     const adminUser = await prisma.adminUser.findFirst({
//       where: {
//         id: userId,
//         isActive: true,
//       },
//     });

//     return adminUser;
//   } catch (error) {
//     console.error("Token verification error:", error);
//     return null;
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     console.log("🔐 IMPORT API - Starting CSV import...");

//     const token = request.headers.get("authorization")?.replace("Bearer ", "");

//     console.log("🔐 IMPORT API - Token verification:");
//     console.log("Token received:", token);

//     if (!token) {
//       console.log("❌ IMPORT API - No token provided");
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     // FIXED: Use the SAME authentication as your bars API
//     console.log("🔐 IMPORT API - Verifying token with auth library...");
//     const adminUser = await verifyAdminToken(token);

//     console.log("🔐 IMPORT API - Admin user found:", !!adminUser);
//     if (adminUser) {
//       console.log("🔐 IMPORT API - Admin user ID:", adminUser.id);
//       console.log("🔐 IMPORT API - Admin user email:", adminUser.email);
//     } else {
//       console.log("❌ IMPORT API - No admin user found with this token");
//       return NextResponse.json(
//         { error: "Invalid or expired token" },
//         { status: 401 }
//       );
//     }

//     console.log(
//       "✅ IMPORT API - Token verified successfully for user:",
//       adminUser.email
//     );

//     const formData = await request.formData();
//     const csvFile = formData.get("csvFile") as File;

//     if (!csvFile) {
//       return NextResponse.json({ error: "No file provided" }, { status: 400 });
//     }

//     console.log(
//       "📁 IMPORT API - File received:",
//       csvFile.name,
//       "Size:",
//       csvFile.size
//     );

//     // Check file size (max 10MB)
//     if (csvFile.size > 10 * 1024 * 1024) {
//       return NextResponse.json(
//         { error: "File too large. Maximum size is 10MB." },
//         { status: 400 }
//       );
//     }

//     const csvText = await csvFile.text();

//     console.log(
//       "📄 IMPORT API - CSV content preview:",
//       csvText.substring(0, 500)
//     );

//     // Parse CSV with PapaParse - FIXED CONFIGURATION
//     const parseResult = Papa.parse<CSVRecord>(csvText, {
//       header: true,
//       skipEmptyLines: true,
//       transformHeader: (header: string) => header.trim(),
//       // transform: (value: string) => value.trim(),
//       // delimiter: ",", // Force comma delimiter
//       // newline: "\n", // Force Unix line endings
//       // quoteChar: '"',
//       // escapeChar: '"',
//     });
//     console.log("🔍 Parse errors:", parseResult.errors);
//     console.log("🔍 Column headers:", parseResult.meta?.fields);
//     console.log("🔍 First row data:", parseResult.data[0]);
//     // Check if parseResult is valid and has data
//     if (parseResult.errors && parseResult.errors.length > 0) {
//       console.log("❌ IMPORT API - CSV parsing errors:", parseResult.errors);

//       // Try alternative parsing with different delimiter
//       console.log(
//         "🔄 IMPORT API - Trying alternative parsing with semicolon delimiter..."
//       );
//       const alternativeResult = Papa.parse<CSVRecord>(csvText, {
//         header: true,
//         skipEmptyLines: true,
//         delimiter: ";", // Try semicolon
//       });

//       if (alternativeResult.errors && alternativeResult.errors.length > 0) {
//         console.log(
//           "❌ IMPORT API - Semicolon parsing also failed:",
//           alternativeResult.errors
//         );

//         // Try tab delimiter
//         console.log(
//           "🔄 IMPORT API - Trying alternative parsing with tab delimiter..."
//         );
//         const tabResult = Papa.parse<CSVRecord>(csvText, {
//           header: true,
//           skipEmptyLines: true,
//           delimiter: "\t", // Try tab
//         });

//         if (tabResult.errors && tabResult.errors.length > 0) {
//           console.log(
//             "❌ IMPORT API - Tab parsing also failed:",
//             tabResult.errors
//           );
//           return NextResponse.json(
//             {
//               error: `CSV parsing error: ${parseResult.errors[0].message}. Please ensure your CSV file uses comma (,) as delimiter.`,
//             },
//             { status: 400 }
//           );
//         } else {
//           console.log("✅ IMPORT API - Tab delimiter parsing succeeded");
//           parseResult.data = tabResult.data;
//           parseResult.errors = [];
//         }
//       } else {
//         console.log("✅ IMPORT API - Semicolon delimiter parsing succeeded");
//         parseResult.data = alternativeResult.data;
//         parseResult.errors = [];
//       }
//     }

//     if (!parseResult.data || parseResult.data.length === 0) {
//       console.log("❌ IMPORT API - CSV file is empty or has no valid data");
//       return NextResponse.json(
//         {
//           error:
//             "CSV file is empty or has no valid data. Please check the file format.",
//         },
//         { status: 400 }
//       );
//     }

//     console.log(
//       `📊 IMPORT API - Successfully parsed ${parseResult.data.length} rows`
//     );
//     console.log("Sample parsed data:", parseResult.data.slice(0, 2));

//     // Filter out empty rows
//     const records: CSVRecord[] = parseResult.data.filter(
//       (record: CSVRecord) => {
//         return Object.values(record).some(
//           (value) =>
//             value !== undefined &&
//             value !== null &&
//             value.toString().trim() !== ""
//         );
//       }
//     );

//     if (records.length === 0) {
//       console.log("❌ IMPORT API - No valid records after filtering");
//       return NextResponse.json(
//         { error: "CSV file is empty or has no valid data" },
//         { status: 400 }
//       );
//     }

//     console.log(`📊 IMPORT API - Processing ${records.length} records`);

//     let importedCount = 0;
//     let failedCount = 0;
//     const errors: string[] = [];

//     // Process each row
//     for (const [index, record] of records.entries()) {
//       const rowNumber = index + 2; // +2 because header is row 1

//       try {
//         // Validate required fields
//         if (!record.name?.trim()) {
//           errors.push(`Row ${rowNumber}: Missing bar name`);
//           failedCount++;
//           continue;
//         }

//         if (!record.type?.trim()) {
//           errors.push(`Row ${rowNumber}: Missing bar type`);
//           failedCount++;
//           continue;
//         }

//         if (!record.address?.trim()) {
//           errors.push(`Row ${rowNumber}: Missing address`);
//           failedCount++;
//           continue;
//         }

//         if (!record.city?.trim()) {
//           errors.push(`Row ${rowNumber}: Missing city`);
//           failedCount++;
//           continue;
//         }

//         // Validate bar type
//         const barType = record.type.toUpperCase();
//         if (
//           !VALID_BAR_TYPES.includes(barType as (typeof VALID_BAR_TYPES)[number])
//         ) {
//           errors.push(
//             `Row ${rowNumber}: Invalid bar type "${
//               record.type
//             }". Must be one of: ${VALID_BAR_TYPES.join(", ")}`
//           );
//           failedCount++;
//           continue;
//         }

//         // Validate price range if provided
//         if (
//           record.priceRange &&
//           !VALID_PRICE_RANGES.includes(
//             record.priceRange.toUpperCase() as (typeof VALID_PRICE_RANGES)[number]
//           )
//         ) {
//           errors.push(
//             `Row ${rowNumber}: Invalid price range "${
//               record.priceRange
//             }". Must be one of: ${VALID_PRICE_RANGES.join(", ")}`
//           );
//           failedCount++;
//           continue;
//         }

//         // Validate latitude and longitude
//         let latitude: number | null = null;
//         let longitude: number | null = null;

//         if (record.latitude) {
//           latitude = parseFloat(record.latitude);
//           if (isNaN(latitude) || latitude < -90 || latitude > 90) {
//             errors.push(
//               `Row ${rowNumber}: Invalid latitude "${record.latitude}". Must be between -90 and 90.`
//             );
//             failedCount++;
//             continue;
//           }
//         }

//         if (record.longitude) {
//           longitude = parseFloat(record.longitude);
//           if (isNaN(longitude) || longitude < -180 || longitude > 180) {
//             errors.push(
//               `Row ${rowNumber}: Invalid longitude "${record.longitude}". Must be between -180 and 180.`
//             );
//             failedCount++;
//             continue;
//           }
//         }

//         // Both or neither coordinates should be provided
//         if ((latitude && !longitude) || (!latitude && longitude)) {
//           errors.push(
//             `Row ${rowNumber}: Both latitude and longitude must be provided together, or both omitted.`
//           );
//           failedCount++;
//           continue;
//         }

//         // Parse operating hours if provided
//         let operatingHours: OperatingHours = getDefaultOperatingHours();
//         if (record.operatingHours) {
//           try {
//             const parsedHours = JSON.parse(record.operatingHours);
//             if (typeof parsedHours === "object" && parsedHours !== null) {
//               operatingHours = parsedHours as OperatingHours;
//             } else {
//               throw new Error("Invalid format");
//             }
//           } catch (parseError) {
//             errors.push(
//               `Row ${rowNumber}: Invalid operatingHours format. Must be valid JSON.`
//             );
//             failedCount++;
//             continue;
//           }
//         }

//         // Parse image URLs array
//         let imageUrls: string[] = [];
//         if (record.imageUrls) {
//           imageUrls = record.imageUrls
//             .split(",")
//             .map((url: string) => url.trim())
//             .filter(Boolean);
//         }

//         // Parse amenities array
//         let amenities: string[] = [];
//         if (record.amenities) {
//           amenities = record.amenities
//             .split(",")
//             .map((amenity: string) => amenity.trim())
//             .filter(Boolean);
//         }

//         // Check for duplicate bar name
//         const existingBar = await prisma.bar.findUnique({
//           where: { name: record.name.trim() },
//         });

//         if (existingBar) {
//           errors.push(`Row ${rowNumber}: Bar "${record.name}" already exists`);
//           failedCount++;
//           continue;
//         }

//         // Prepare data for creation with proper types
//         const barData: BarCreateData = {
//           name: record.name.trim(),
//           type: barType as BarType,
//           address: record.address.trim(),
//           city: record.city.trim(),
//           district: record.district?.trim() || null,
//           latitude: latitude,
//           longitude: longitude,
//           phone: record.phone?.trim() || null,
//           email: record.email?.trim() || null,
//           website: record.website?.trim() || null,
//           instagram: record.instagram?.trim() || null,
//           priceRange: record.priceRange
//             ? (record.priceRange.toUpperCase() as PriceRange)
//             : null,
//           capacity: record.capacity ? parseInt(record.capacity) : null,
//           amenities: amenities,
//           description: record.description?.trim() || null,
//           operatingHours: operatingHours,
//           vipEnabled: record.vipEnabled
//             ? record.vipEnabled.toLowerCase() === "true"
//             : false,
//           coverImage: record.coverImage?.trim() || null,
//           imageUrls: imageUrls,
//           logoUrl: record.logoUrl?.trim() || null,
//           status: "UNCLAIMED",
//           isVerified: false,
//           isActive: true,
//           createdById: adminUser.id,
//         };

//         // Create the bar
//         await prisma.bar.create({
//           data: barData,
//         });

//         importedCount++;
//       } catch (error) {
//         console.error(`Error processing row ${rowNumber}:`, error);
//         errors.push(
//           `Row ${rowNumber}: ${
//             error instanceof Error ? error.message : "Unknown error"
//           }`
//         );
//         failedCount++;
//       }
//     }

//     console.log(
//       `✅ IMPORT API - Import completed: ${importedCount} imported, ${failedCount} failed`
//     );

//     // Create import record for audit
//     try {
//       await prisma.barImport.create({
//         data: {
//           fileName: csvFile.name,
//           fileSize: csvFile.size,
//           totalRows: records.length,
//           importedRows: importedCount,
//           failedRows: failedCount,
//           status:
//             failedCount === 0
//               ? "COMPLETED"
//               : failedCount === records.length
//               ? "FAILED"
//               : "PARTIAL",
//           errors: errors.length > 0 ? errors : undefined,
//           importedBy: adminUser.id,
//         },
//       });
//       console.log("📝 IMPORT API - Audit record created");
//     } catch (error) {
//       console.log(
//         "⚠️ IMPORT API - BarImport model not available, skipping audit..."
//       );
//     }

//     // Create audit log
//     try {
//       await prisma.auditLog.create({
//         data: {
//           adminId: adminUser.id,
//           action: "BULK_IMPORT",
//           resource: "BAR",
//           details: {
//             fileName: csvFile.name,
//             importedCount,
//             failedCount,
//             totalCount: records.length,
//           },
//           ipAddress: request.headers.get("x-forwarded-for") || "unknown",
//           userAgent: request.headers.get("user-agent") || "unknown",
//         },
//       });
//       console.log("📝 IMPORT API - Audit log created");
//     } catch (error) {
//       console.log(
//         "⚠️ IMPORT API - AuditLog model not available, skipping audit..."
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       imported: importedCount,
//       failed: failedCount,
//       total: records.length,
//       errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
//     });
//   } catch (error) {
//     console.error("❌ IMPORT API - CSV import error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 }
//     );
//   }
// }

// // Helper function to get default operating hours
// function getDefaultOperatingHours(): OperatingHours {
//   return {
//     monday: { open: "16:00", close: "02:00" },
//     tuesday: { open: "16:00", close: "02:00" },
//     wednesday: { open: "16:00", close: "02:00" },
//     thursday: { open: "16:00", close: "02:00" },
//     friday: { open: "16:00", close: "04:00" },
//     saturday: { open: "14:00", close: "04:00" },
//     sunday: { open: "14:00", close: "02:00" },
//   };
// }
// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient, BarType, PriceRange } from "@prisma/client";

// const prisma = new PrismaClient();

// const VALID_BAR_TYPES = [
//   "PUB",
//   "CLUB",
//   "LOUNGE",
//   "COCKTAIL_BAR",
//   "RESTAURANT_BAR",
//   "SPORTS_BAR",
//   "KARAOKE",
//   "LIVE_MUSIC",
// ] as const;

// const VALID_PRICE_RANGES = ["BUDGET", "MODERATE", "PREMIUM", "LUXURY"] as const;

// interface CSVRecord {
//   name?: string;
//   type?: string;
//   address?: string;
//   city?: string;
//   district?: string;
//   latitude?: string;
//   longitude?: string;
//   phone?: string;
//   email?: string;
//   website?: string;
//   instagram?: string;
//   priceRange?: string;
//   capacity?: string;
//   amenities?: string;
//   description?: string;
//   operatingHours?: string;
//   vipEnabled?: string;
//   coverImage?: string;
//   imageUrls?: string;
//   logoUrl?: string;
// }

// async function verifyAdminToken(token: string) {
//   try {
//     const adminUser = await prisma.adminUser.findFirst({
//       where: { isActive: true },
//     });
//     return adminUser;
//   } catch (error) {
//     console.error("Token verification error:", error);
//     return null;
//   }
// }

// function parseCSV(csvText: string): CSVRecord[] {
//   const lines = csvText.split("\n").filter((line) => line.trim() !== "");
//   if (lines.length < 2) return [];

//   const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
//   console.log("FUCKING HEADERS:", headers);

//   const records: CSVRecord[] = [];
//   for (let i = 1; i < lines.length; i++) {
//     const line = lines[i];
//     if (!line.trim()) continue;

//     const values: string[] = [];
//     let current = "";
//     let inQuotes = false;

//     for (let j = 0; j < line.length; j++) {
//       const char = line[j];
//       const nextChar = line[j + 1];

//       if (char === '"') {
//         if (inQuotes && nextChar === '"') {
//           current += '"';
//           j++;
//         } else {
//           inQuotes = !inQuotes;
//         }
//       } else if (char === "," && !inQuotes) {
//         values.push(current.trim());
//         current = "";
//       } else {
//         current += char;
//       }
//     }
//     values.push(current.trim());

//     const record: CSVRecord = {};
//     headers.forEach((header, index) => {
//       if (index < values.length) {
//         const value = values[index].replace(/"/g, "").trim();
//         record[header as keyof CSVRecord] = value;
//       }
//     });

//     if (record.name && record.name.trim()) {
//       records.push(record);
//     }
//   }

//   console.log(`PARSED ${records.length} FUCKING RECORDS`);
//   return records;
// }

// export async function POST(request: NextRequest) {
//   try {
//     console.log("STARTING FUCKING CSV IMPORT...");

//     const token = request.headers.get("authorization")?.replace("Bearer ", "");
//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const adminUser = await verifyAdminToken(token);
//     if (!adminUser) {
//       return NextResponse.json({ error: "Invalid token" }, { status: 401 });
//     }

//     const formData = await request.formData();
//     const csvFile = formData.get("csvFile") as File;
//     if (!csvFile) {
//       return NextResponse.json({ error: "No file provided" }, { status: 400 });
//     }

//     if (csvFile.size > 10 * 1024 * 1024) {
//       return NextResponse.json(
//         { error: "File too large. Maximum size is 10MB." },
//         { status: 400 }
//       );
//     }

//     const csvText = await csvFile.text();
//     console.log("RAW CSV:", csvText);

//     const records = parseCSV(csvText);

//     if (records.length === 0) {
//       return NextResponse.json(
//         { error: "CSV file is empty or has no valid data" },
//         { status: 400 }
//       );
//     }

//     console.log("FIRST RECORD:", records[0]);

//     let importedCount = 0;
//     let failedCount = 0;
//     const errors: string[] = [];

//     for (const [index, record] of records.entries()) {
//       const rowNumber = index + 2;

//       try {
//         if (!record.name?.trim()) {
//           errors.push(`Row ${rowNumber}: Missing bar name`);
//           failedCount++;
//           continue;
//         }

//         if (!record.type?.trim()) {
//           errors.push(`Row ${rowNumber}: Missing bar type`);
//           failedCount++;
//           continue;
//         }

//         if (!record.address?.trim()) {
//           errors.push(`Row ${rowNumber}: Missing address`);
//           failedCount++;
//           continue;
//         }

//         if (!record.city?.trim()) {
//           errors.push(`Row ${rowNumber}: Missing city`);
//           failedCount++;
//           continue;
//         }

//         const barType = record.type.toUpperCase();
//         if (
//           !VALID_BAR_TYPES.includes(barType as (typeof VALID_BAR_TYPES)[number])
//         ) {
//           errors.push(
//             `Row ${rowNumber}: Invalid bar type "${
//               record.type
//             }". Must be one of: ${VALID_BAR_TYPES.join(", ")}`
//           );
//           failedCount++;
//           continue;
//         }

//         if (
//           record.priceRange &&
//           !VALID_PRICE_RANGES.includes(
//             record.priceRange.toUpperCase() as (typeof VALID_PRICE_RANGES)[number]
//           )
//         ) {
//           errors.push(
//             `Row ${rowNumber}: Invalid price range "${
//               record.priceRange
//             }". Must be one of: ${VALID_PRICE_RANGES.join(", ")}`
//           );
//           failedCount++;
//           continue;
//         }

//         let latitude: number | null = null;
//         let longitude: number | null = null;

//         if (record.latitude) {
//           latitude = parseFloat(record.latitude);
//           if (isNaN(latitude)) {
//             errors.push(
//               `Row ${rowNumber}: Invalid latitude "${record.latitude}"`
//             );
//             failedCount++;
//             continue;
//           }
//         }

//         if (record.longitude) {
//           longitude = parseFloat(record.longitude);
//           if (isNaN(longitude)) {
//             errors.push(
//               `Row ${rowNumber}: Invalid longitude "${record.longitude}"`
//             );
//             failedCount++;
//             continue;
//           }
//         }

//         let amenities: string[] = [];
//         if (record.amenities) {
//           amenities = record.amenities
//             .split(",")
//             .map((a) => a.trim())
//             .filter(Boolean);
//         }

//         let imageUrls: string[] = [];
//         if (record.imageUrls) {
//           imageUrls = record.imageUrls
//             .split(",")
//             .map((url) => url.trim())
//             .filter(Boolean);
//         }

//         let operatingHours = {};
//         if (record.operatingHours) {
//           try {
//             operatingHours = JSON.parse(record.operatingHours);
//           } catch (e) {
//             console.log("Invalid operating hours, using default");
//           }
//         }

//         const existingBar = await prisma.bar.findUnique({
//           where: { name: record.name.trim() },
//         });

//         if (existingBar) {
//           errors.push(`Row ${rowNumber}: Bar "${record.name}" already exists`);
//           failedCount++;
//           continue;
//         }

//         await prisma.bar.create({
//           data: {
//             name: record.name.trim(),
//             type: barType as BarType,
//             address: record.address.trim(),
//             city: record.city.trim(),
//             district: record.district?.trim() || null,
//             latitude: latitude,
//             longitude: longitude,
//             phone: record.phone?.trim() || null,
//             email: record.email?.trim() || null,
//             website: record.website?.trim() || null,
//             instagram: record.instagram?.trim() || null,
//             priceRange: record.priceRange
//               ? (record.priceRange.toUpperCase() as PriceRange)
//               : null,
//             capacity: record.capacity ? parseInt(record.capacity) : null,
//             amenities: amenities,
//             description: record.description?.trim() || null,
//             operatingHours: operatingHours,
//             vipEnabled: record.vipEnabled
//               ? record.vipEnabled.toLowerCase() === "true"
//               : false,
//             coverImage: record.coverImage?.trim() || null,
//             imageUrls: imageUrls,
//             logoUrl: record.logoUrl?.trim() || null,
//             status: "UNCLAIMED",
//             isVerified: false,
//             isActive: true,
//             createdById: adminUser.id,
//           },
//         });

//         importedCount++;
//         console.log(`IMPORTED: ${record.name}`);
//       } catch (error) {
//         console.error(`ERROR ROW ${rowNumber}:`, error);
//         errors.push(
//           `Row ${rowNumber}: ${
//             error instanceof Error ? error.message : "Unknown error"
//           }`
//         );
//         failedCount++;
//       }
//     }

//     console.log(
//       `IMPORT COMPLETED: ${importedCount} imported, ${failedCount} failed`
//     );

//     try {
//       await prisma.barImport.create({
//         data: {
//           fileName: csvFile.name,
//           fileSize: csvFile.size,
//           totalRows: records.length,
//           importedRows: importedCount,
//           failedRows: failedCount,
//           status:
//             failedCount === 0
//               ? "COMPLETED"
//               : failedCount === records.length
//               ? "FAILED"
//               : "PARTIAL",
//           errors: errors.length > 0 ? errors : undefined,
//           importedBy: adminUser.id,
//         },
//       });
//     } catch (error) {
//       console.log("NO AUDIT RECORD - BARIMPORT TABLE PROBABLY DOESN'T EXIST");
//     }

//     return NextResponse.json({
//       success: true,
//       imported: importedCount,
//       failed: failedCount,
//       total: records.length,
//       errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
//     });
//   } catch (error) {
//     console.error("FUCKING CSV IMPORT ERROR:", error);
//     return NextResponse.json(
//       {
//         error:
//           "Internal server error: " +
//           (error instanceof Error ? error.message : "Unknown error"),
//       },
//       { status: 500 }
//     );
//   }
// }

// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient, BarType, PriceRange } from "@prisma/client";

// const prisma = new PrismaClient();

// const VALID_BAR_TYPES = [
//   "PUB",
//   "CLUB",
//   "LOUNGE",
//   "COCKTAIL_BAR",
//   "RESTAURANT_BAR",
//   "SPORTS_BAR",
//   "KARAOKE",
//   "LIVE_MUSIC",
// ] as const;

// const VALID_PRICE_RANGES = ["BUDGET", "MODERATE", "PREMIUM", "LUXURY"] as const;

// type ValidBarType = (typeof VALID_BAR_TYPES)[number];
// type ValidPriceRange = (typeof VALID_PRICE_RANGES)[number];

// interface CSVRecord {
//   name?: string;
//   type?: string;
//   address?: string;
//   city?: string;
//   district?: string;
//   latitude?: string;
//   longitude?: string;
//   phone?: string;
//   email?: string;
//   website?: string;
//   instagram?: string;
//   priceRange?: string;
//   capacity?: string;
//   amenities?: string;
//   description?: string;
//   operatingHours?: string;
//   vipEnabled?: string;
//   coverImage?: string;
//   imageUrls?: string;
//   logoUrl?: string;
// }

// interface DuplicateInfo {
//   row: number;
//   name: string;
//   reason: "within_file" | "already_in_database";
// }

// interface ImportResult {
//   imported: number;
//   skipped: number;
//   duplicates: DuplicateInfo[];
//   errors: string[];
// }

// async function verifyAdminToken(token: string) {
//   try {
//     const adminUser = await prisma.adminUser.findFirst({
//       where: { isActive: true },
//     });
//     return adminUser;
//   } catch (error) {
//     console.error("Token verification error:", error);
//     return null;
//   }
// }

// function parseCSV(csvText: string): CSVRecord[] {
//   const lines = csvText.split("\n").filter((line) => line.trim() !== "");
//   if (lines.length < 2) return [];

//   const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
//   console.log("HEADERS:", headers);

//   const records: CSVRecord[] = [];
//   for (let i = 1; i < lines.length; i++) {
//     const line = lines[i];
//     if (!line.trim()) continue;

//     const values: string[] = [];
//     let current = "";
//     let inQuotes = false;

//     for (let j = 0; j < line.length; j++) {
//       const char = line[j];
//       const nextChar = line[j + 1];

//       if (char === '"') {
//         if (inQuotes && nextChar === '"') {
//           current += '"';
//           j++;
//         } else {
//           inQuotes = !inQuotes;
//         }
//       } else if (char === "," && !inQuotes) {
//         values.push(current.trim());
//         current = "";
//       } else {
//         current += char;
//       }
//     }
//     values.push(current.trim());

//     const record: CSVRecord = {};
//     headers.forEach((header, index) => {
//       if (index < values.length) {
//         const value = values[index].replace(/"/g, "").trim();
//         record[header as keyof CSVRecord] = value;
//       }
//     });

//     if (record.name && record.name.trim()) {
//       records.push(record);
//     }
//   }

//   console.log(`PARSED ${records.length} RECORDS`);
//   return records;
// }

// function parseAmenities(amenitiesStr: string): string[] {
//   if (!amenitiesStr) return [];
//   const trimmedStr = amenitiesStr.trim();

//   try {
//     const parsed = JSON.parse(trimmedStr);
//     if (Array.isArray(parsed)) {
//       return parsed.filter((item): item is string => typeof item === "string");
//     }
//   } catch {
//     // Not JSON, try other formats
//   }

//   if (trimmedStr.includes("'") && trimmedStr.startsWith("[")) {
//     return trimmedStr
//       .replace(/^\[|\]$/g, "")
//       .split(",")
//       .map((item) => item.trim().replace(/^'|'$/g, ""))
//       .filter(Boolean);
//   }

//   if (trimmedStr.includes(",")) {
//     return trimmedStr
//       .split(",")
//       .map((item) => item.trim())
//       .filter(Boolean);
//   }

//   if (trimmedStr) return [trimmedStr];
//   return [];
// }

// function isValidBarType(value: string): value is ValidBarType {
//   return VALID_BAR_TYPES.includes(value as ValidBarType);
// }

// function isValidPriceRange(value: string): value is ValidPriceRange {
//   return VALID_PRICE_RANGES.includes(value as ValidPriceRange);
// }

// export async function POST(request: NextRequest) {
//   try {
//     console.log("STARTING CSV IMPORT...");

//     const token = request.headers.get("authorization")?.replace("Bearer ", "");
//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const adminUser = await verifyAdminToken(token);
//     if (!adminUser) {
//       return NextResponse.json({ error: "Invalid token" }, { status: 401 });
//     }

//     const formData = await request.formData();
//     const csvFile = formData.get("csvFile") as File;
//     if (!csvFile) {
//       return NextResponse.json({ error: "No file provided" }, { status: 400 });
//     }

//     if (csvFile.size > 10 * 1024 * 1024) {
//       return NextResponse.json(
//         { error: "File too large. Maximum size is 10MB." },
//         { status: 400 },
//       );
//     }

//     const csvText = await csvFile.text();
//     const records = parseCSV(csvText);

//     if (records.length === 0) {
//       return NextResponse.json(
//         { error: "CSV file is empty or has no valid data" },
//         { status: 400 },
//       );
//     }

//     console.log(`Processing ${records.length} records...`);

//     const result: ImportResult = {
//       imported: 0,
//       skipped: 0,
//       duplicates: [],
//       errors: [],
//     };

//     const processedNamesInFile = new Set<string>();
//     const barsToImport: { record: CSVRecord; rowNumber: number }[] = [];

//     for (const [index, record] of records.entries()) {
//       const rowNumber = index + 2;

//       if (!record.name?.trim()) {
//         result.errors.push(`Row ${rowNumber}: Missing bar name`);
//         result.skipped++;
//         continue;
//       }

//       const barName = record.name.trim();

//       if (processedNamesInFile.has(barName)) {
//         result.duplicates.push({
//           row: rowNumber,
//           name: barName,
//           reason: "within_file",
//         });
//         result.skipped++;
//         continue;
//       }

//       const existingBar = await prisma.bar.findUnique({
//         where: { name: barName },
//       });

//       if (existingBar) {
//         result.duplicates.push({
//           row: rowNumber,
//           name: barName,
//           reason: "already_in_database",
//         });
//         result.skipped++;
//         continue;
//       }

//       processedNamesInFile.add(barName);
//       barsToImport.push({ record, rowNumber });
//     }

//     console.log(`Found ${barsToImport.length} unique bars to import`);
//     console.log(`Skipping ${result.skipped} duplicates`);

//     for (const { record, rowNumber } of barsToImport) {
//       try {
//         const barName = record.name!.trim();

//         let barType: BarType = "PUB";
//         if (record.type) {
//           const upperType = record.type.toUpperCase();
//           if (isValidBarType(upperType)) {
//             barType = upperType;
//           }
//         }

//         let priceRange: PriceRange | null = null;
//         if (record.priceRange) {
//           const upperRange = record.priceRange.toUpperCase();
//           if (isValidPriceRange(upperRange)) {
//             priceRange = upperRange;
//           }
//         }

//         let latitude: number | null = null;
//         let longitude: number | null = null;
//         if (record.latitude) {
//           const lat = parseFloat(record.latitude);
//           if (!isNaN(lat)) latitude = lat;
//         }
//         if (record.longitude) {
//           const lng = parseFloat(record.longitude);
//           if (!isNaN(lng)) longitude = lng;
//         }

//         const amenities: string[] = record.amenities
//           ? parseAmenities(record.amenities)
//           : [];

//         let imageUrls: string[] = [];
//         if (record.imageUrls) {
//           imageUrls = record.imageUrls
//             .split(",")
//             .map((url) => url.trim())
//             .filter(Boolean);
//         }

//         let operatingHours = {};
//         if (record.operatingHours && record.operatingHours !== "{}") {
//           try {
//             operatingHours = JSON.parse(record.operatingHours);
//           } catch (e) {
//             console.log(
//               `Row ${rowNumber}: Invalid operating hours, using default`,
//             );
//           }
//         }

//         let vipEnabled = false;
//         if (record.vipEnabled) {
//           vipEnabled = record.vipEnabled.toLowerCase() === "true";
//         }

//         let capacity: number | null = null;
//         if (record.capacity) {
//           const cap = parseInt(record.capacity);
//           if (!isNaN(cap)) capacity = cap;
//         }

//         await prisma.bar.create({
//           data: {
//             name: barName,
//             type: barType,
//             address: record.address?.trim() || "Address not provided",
//             city: record.city?.trim() || "Helsinki",
//             district: record.district?.trim() || null,
//             latitude: latitude,
//             longitude: longitude,
//             phone: record.phone?.trim() || null,
//             email: record.email?.trim() || null,
//             website: record.website?.trim() || null,
//             instagram: record.instagram?.trim() || null,
//             priceRange: priceRange,
//             capacity: capacity,
//             amenities: amenities,
//             description: record.description?.trim() || null,
//             operatingHours: operatingHours,
//             vipEnabled: vipEnabled,
//             coverImage: record.coverImage?.trim() || null,
//             imageUrls: imageUrls,
//             logoUrl: record.logoUrl?.trim() || null,
//             status: "UNCLAIMED",
//             isVerified: false,
//             isActive: true,
//             createdById: adminUser.id,
//           },
//         });

//         result.imported++;
//         console.log(`✅ IMPORTED: ${barName}`);
//       } catch (error) {
//         console.error(`ERROR Row ${rowNumber}:`, error);
//         result.errors.push(
//           `Row ${rowNumber}: ${error instanceof Error ? error.message : "Unknown error"}`,
//         );
//         result.skipped++;
//       }
//     }

//     console.log("\n=== IMPORT SUMMARY ===");
//     console.log(`📊 Total records in file: ${records.length}`);
//     console.log(`✅ Imported: ${result.imported}`);
//     console.log(`⏭️ Skipped: ${result.skipped}`);

//     if (result.duplicates.length > 0) {
//       console.log(`\n🔄 Duplicates found (${result.duplicates.length}):`);
//       for (const dup of result.duplicates) {
//         console.log(
//           `   Row ${dup.row}: "${dup.name}" - ${dup.reason === "within_file" ? "duplicate within same file" : "already exists in database"}`,
//         );
//       }
//     }

//     try {
//       await prisma.barImport.create({
//         data: {
//           fileName: csvFile.name,
//           fileSize: csvFile.size,
//           totalRows: records.length,
//           importedRows: result.imported,
//           failedRows: result.skipped,
//           status:
//             result.imported === 0
//               ? "FAILED"
//               : result.skipped === 0
//                 ? "COMPLETED"
//                 : "PARTIAL",
//           errors:
//             result.errors.length > 0
//               ? result.errors
//               : result.duplicates.map(
//                   (d) =>
//                     `Row ${d.row}: Duplicate bar "${d.name}" (${d.reason === "within_file" ? "duplicate in file" : "already in database"})`,
//                 ),
//           importedBy: adminUser.id,
//         },
//       });
//     } catch (error) {
//       console.log("Note: barImport table doesn't exist, skipping audit log");
//     }

//     return NextResponse.json({
//       success: true,
//       imported: result.imported,
//       skipped: result.skipped,
//       total: records.length,
//       duplicates: result.duplicates,
//       errors: result.errors,
//       message: `✅ Imported ${result.imported} new bars. ⏭️ Skipped ${result.skipped} duplicates.`,
//     });
//   } catch (error) {
//     console.error("CSV IMPORT ERROR:", error);
//     return NextResponse.json(
//       {
//         error:
//           "Internal server error: " +
//           (error instanceof Error ? error.message : "Unknown error"),
//       },
//       { status: 500 },
//     );
//   }
// }
// Route: POST /api/auth/admin/bars/import
// Description: Import bars from CSV file

// import { NextRequest, NextResponse } from "next/server";
// import { PrismaClient, BarType, PriceRange } from "@prisma/client";
// import { verify } from "jsonwebtoken";

// const prisma = new PrismaClient();
// const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// interface JwtPayload {
//   id: string;
//   email: string;
// }

// // FIXED: Verify admin by email, not by role
// async function verifyAdminToken(token: string): Promise<{ id: string } | null> {
//   try {
//     const decoded = verify(token, JWT_SECRET) as JwtPayload;

//     const adminUser = await prisma.adminUser.findFirst({
//       where: {
//         email: decoded.email,
//         isActive: true,
//       },
//       select: { id: true },
//     });

//     return adminUser;
//   } catch (error) {
//     console.error("Token verification error:", error);
//     return null;
//   }
// }

// function parseOperatingHours(hoursStr: string) {
//   const defaultHours = { open: "Closed", close: "Closed" };
//   const operatingHours = {
//     Monday: { ...defaultHours },
//     Tuesday: { ...defaultHours },
//     Wednesday: { ...defaultHours },
//     Thursday: { ...defaultHours },
//     Friday: { ...defaultHours },
//     Saturday: { ...defaultHours },
//     Sunday: { ...defaultHours },
//   };

//   if (!hoursStr || hoursStr.trim() === "") {
//     return operatingHours;
//   }

//   const parts = hoursStr.split(",");
//   for (const part of parts) {
//     const match = part.match(
//       /(\w+):\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/i,
//     );
//     if (match) {
//       const day = match[1] as keyof typeof operatingHours;
//       let openTime = match[2];
//       let closeTime = match[3];

//       if (!openTime.includes(":")) openTime = `${openTime}:00`;
//       if (!closeTime.includes(":")) closeTime = `${closeTime}:00`;

//       if (operatingHours[day]) {
//         operatingHours[day] = { open: openTime, close: closeTime };
//       }
//     }
//   }

//   return operatingHours;
// }

// function parseAmenities(amenitiesStr: string): string[] {
//   if (!amenitiesStr || amenitiesStr.trim() === "") {
//     return [];
//   }
//   return amenitiesStr
//     .split(",")
//     .map((a) => a.trim())
//     .filter((a) => a.length > 0);
// }

// function parseImageUrls(urlsStr: string): string[] {
//   if (!urlsStr || urlsStr.trim() === "") {
//     return [];
//   }
//   return urlsStr
//     .split(",")
//     .map((u) => u.trim())
//     .filter((u) => u.length > 0);
// }

// function parsePriceRange(priceStr: string) {
//   const priceMap: Record<string, any> = {
//     budget: "BUDGET",
//     moderate: "MODERATE",
//     premium: "PREMIUM",
//     luxury: "LUXURY",
//     $: "BUDGET",
//     $$: "MODERATE",
//     $$$: "PREMIUM",
//     $$$$: "LUXURY",
//   };

//   const normalized = priceStr?.toLowerCase().trim() || "";
//   const mapped = priceMap[normalized];
//   if (mapped && Object.values(PriceRange).includes(mapped)) {
//     return mapped;
//   }
//   return undefined;
// }

// function parseBarType(typeStr: string) {
//   const typeMap: Record<string, any> = {
//     pub: "PUB",
//     club: "CLUB",
//     lounge: "LOUNGE",
//     cocktail: "COCKTAIL_BAR",
//     "cocktail bar": "COCKTAIL_BAR",
//     restaurant: "RESTAURANT_BAR",
//     "restaurant bar": "RESTAURANT_BAR",
//     sports: "SPORTS_BAR",
//     "sports bar": "SPORTS_BAR",
//     karaoke: "KARAOKE",
//     "live music": "LIVE_MUSIC",
//     music: "LIVE_MUSIC",
//   };

//   const normalized = typeStr?.toLowerCase().trim() || "";
//   const mapped = typeMap[normalized];
//   if (mapped && Object.values(BarType).includes(mapped)) {
//     return mapped;
//   }
//   return undefined;
// }

// export async function POST(request: NextRequest): Promise<NextResponse> {
//   try {
//     const token = request.headers.get("authorization")?.replace("Bearer ", "");

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const adminUser = await verifyAdminToken(token);
//     if (!adminUser) {
//       return NextResponse.json({ error: "Invalid token" }, { status: 401 });
//     }

//     const formData = await request.formData();
//     // FIXED: Accept both "file" and "csvFile" field names
//     const file = (formData.get("file") ||
//       formData.get("csvFile")) as File | null;

//     if (!file) {
//       return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
//     }

//     const fileContent = await file.text();
//     const lines = fileContent.split("\n");
//     const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

//     const requiredHeaders = ["name", "address", "city", "type"];
//     const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

//     if (missingHeaders.length > 0) {
//       return NextResponse.json(
//         {
//           error: `Missing required headers: ${missingHeaders.join(", ")}`,
//         },
//         { status: 400 },
//       );
//     }

//     const results = {
//       total: 0,
//       imported: 0,
//       failed: 0,
//       errors: [] as string[],
//     };

//     const nameIndex = headers.indexOf("name");
//     const descriptionIndex = headers.indexOf("description");
//     const addressIndex = headers.indexOf("address");
//     const cityIndex = headers.indexOf("city");
//     const districtIndex = headers.indexOf("district");
//     const typeIndex = headers.indexOf("type");
//     const latitudeIndex = headers.indexOf("latitude");
//     const longitudeIndex = headers.indexOf("longitude");
//     const phoneIndex = headers.indexOf("phone");
//     const emailIndex = headers.indexOf("email");
//     const websiteIndex = headers.indexOf("website");
//     const instagramIndex = headers.indexOf("instagram");
//     const operatingHoursIndex = headers.indexOf("operatinghours");
//     const priceRangeIndex = headers.indexOf("pricerange");
//     const capacityIndex = headers.indexOf("capacity");
//     const amenitiesIndex = headers.indexOf("amenities");
//     const coverImageIndex = headers.indexOf("coverimage");
//     const imageUrlsIndex = headers.indexOf("imageurls");
//     const logoUrlIndex = headers.indexOf("logourl");
//     const vipEnabledIndex = headers.indexOf("vipenabled");

//     for (let i = 1; i < lines.length; i++) {
//       const line = lines[i].trim();
//       if (!line) continue;

//       results.total++;

//       try {
//         const values = line.split(",").map((v) => v.trim());

//         const name = values[nameIndex];
//         if (!name) {
//           throw new Error("Name is required");
//         }

//         const address = values[addressIndex];
//         if (!address) {
//           throw new Error("Address is required");
//         }

//         const cityName = values[cityIndex];
//         if (!cityName) {
//           throw new Error("City is required");
//         }

//         const typeStr = values[typeIndex];
//         const barType = parseBarType(typeStr);
//         if (!barType) {
//           throw new Error(`Invalid bar type: ${typeStr}`);
//         }

//         const latitude = values[latitudeIndex]
//           ? parseFloat(values[latitudeIndex])
//           : null;
//         const longitude = values[longitudeIndex]
//           ? parseFloat(values[longitudeIndex])
//           : null;

//         const operatingHours = parseOperatingHours(
//           values[operatingHoursIndex] || "",
//         );
//         const amenities = parseAmenities(values[amenitiesIndex] || "");
//         const imageUrls = parseImageUrls(values[imageUrlsIndex] || "");
//         const priceRange = parsePriceRange(values[priceRangeIndex] || "");

//         // Check if bar already exists
//         const existingBar = await prisma.bar.findUnique({
//           where: { name },
//           select: { id: true },
//         });

//         if (existingBar) {
//           throw new Error(`Bar "${name}" already exists`);
//         }

//         // FIXED: Find or create city to link the relation
//         let city = await prisma.city.findFirst({
//           where: { name: { equals: cityName, mode: "insensitive" } },
//         });

//         if (!city) {
//           city = await prisma.city.create({
//             data: {
//               name: cityName,
//               country: "Finland",
//               isActive: true,
//             },
//           });
//           console.log(`✅ Created new city: ${cityName}`);
//         }

//         // FIXED: Use cityName and cityId fields
//         const bar = await prisma.bar.create({
//           data: {
//             name: name,
//             description: values[descriptionIndex] || null,
//             address: address,
//             cityName: cityName,
//             cityId: city.id,
//             district: values[districtIndex] || null,
//             type: barType,
//             latitude: latitude,
//             longitude: longitude,
//             phone: values[phoneIndex] || null,
//             email: values[emailIndex] || null,
//             website: values[websiteIndex] || null,
//             instagram: values[instagramIndex] || null,
//             operatingHours: operatingHours,
//             priceRange: priceRange,
//             capacity: values[capacityIndex]
//               ? parseInt(values[capacityIndex])
//               : null,
//             amenities: amenities,
//             coverImage: values[coverImageIndex] || null,
//             imageUrls: imageUrls,
//             logoUrl: values[logoUrlIndex] || null,
//             status: "UNCLAIMED",
//             isVerified: false,
//             isActive: true,
//             vipEnabled: values[vipEnabledIndex]?.toLowerCase() === "true",
//             createdById: adminUser.id,
//           },
//         });

//         results.imported++;

//         // Create audit log
//         await prisma.auditLog.create({
//           data: {
//             adminId: adminUser.id,
//             barId: bar.id,
//             action: "IMPORT",
//             resource: "BAR",
//             details: { barName: bar.name, source: "CSV_IMPORT" },
//             createdAt: new Date(),
//           },
//         });
//       } catch (error) {
//         results.failed++;
//         const errorMsg =
//           error instanceof Error ? error.message : "Unknown error";
//         results.errors.push(`Row ${i}: ${errorMsg}`);
//         console.error(`Error importing row ${i}:`, error);
//       }
//     }

//     // Create import history record
//     try {
//       await prisma.barImport.create({
//         data: {
//           fileName: file.name,
//           fileSize: file.size,
//           totalRows: results.total,
//           importedRows: results.imported,
//           failedRows: results.failed,
//           status:
//             results.failed === 0
//               ? "COMPLETED"
//               : results.imported > 0
//                 ? "PARTIAL"
//                 : "FAILED",
//           errors: results.errors.length > 0 ? results.errors : undefined,
//           importedBy: adminUser.id,
//         },
//       });
//     } catch (error) {
//       console.log("Note: barImport table audit skipped");
//     }

//     return NextResponse.json({
//       success: true,
//       imported: results.imported,
//       failed: results.failed,
//       total: results.total,
//       errors: results.errors.slice(0, 10),
//       message: `✅ Imported ${results.imported} bars, ❌ ${results.failed} failed`,
//     });
//   } catch (error) {
//     console.error("Import error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }
// import { NextRequest, NextResponse } from "next/server";
// import {
//   PrismaClient,
//   BarType,
//   PriceRange,
//   ImportStatus,
// } from "@prisma/client";
// import { verify } from "jsonwebtoken";

// const prisma = new PrismaClient();
// const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// interface JwtPayload {
//   id: string;
//   email: string;
// }

// async function verifyAdminToken(token: string): Promise<{ id: string } | null> {
//   try {
//     const decoded = verify(token, JWT_SECRET) as JwtPayload;

//     const adminUser = await prisma.adminUser.findFirst({
//       where: {
//         email: decoded.email,
//         isActive: true,
//       },
//       select: { id: true },
//     });

//     return adminUser;
//   } catch (error) {
//     console.error("Token verification error:", error);
//     return null;
//   }
// }

// function parseOperatingHours(hoursStr: string) {
//   const defaultHours = { open: "Closed", close: "Closed" };
//   const operatingHours = {
//     Monday: { ...defaultHours },
//     Tuesday: { ...defaultHours },
//     Wednesday: { ...defaultHours },
//     Thursday: { ...defaultHours },
//     Friday: { ...defaultHours },
//     Saturday: { ...defaultHours },
//     Sunday: { ...defaultHours },
//   };

//   if (!hoursStr || hoursStr.trim() === "" || hoursStr === "{}") {
//     return operatingHours;
//   }

//   try {
//     // Try to parse as JSON first
//     const parsed = JSON.parse(hoursStr);
//     if (typeof parsed === "object" && parsed !== null) {
//       return parsed;
//     }
//   } catch (e) {
//     // Not JSON, try to parse as string format
//     const parts = hoursStr.split(",");
//     for (const part of parts) {
//       const match = part.match(
//         /(\w+):\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/i,
//       );
//       if (match) {
//         const day = match[1] as keyof typeof operatingHours;
//         let openTime = match[2];
//         let closeTime = match[3];

//         if (!openTime.includes(":")) openTime = `${openTime}:00`;
//         if (!closeTime.includes(":")) closeTime = `${closeTime}:00`;

//         if (operatingHours[day]) {
//           operatingHours[day] = { open: openTime, close: closeTime };
//         }
//       }
//     }
//   }

//   return operatingHours;
// }

// function parseAmenities(amenitiesStr: string): string[] {
//   if (!amenitiesStr || amenitiesStr.trim() === "" || amenitiesStr === "[]") {
//     return [];
//   }

//   try {
//     // Try to parse as JSON array
//     const parsed = JSON.parse(amenitiesStr);
//     if (Array.isArray(parsed)) {
//       return parsed;
//     }
//   } catch (e) {
//     // Not JSON, split by comma
//     return amenitiesStr
//       .split(",")
//       .map((a) => a.trim().replace(/['\[\]]/g, ""))
//       .filter((a) => a.length > 0);
//   }

//   return [];
// }

// function parseImageUrls(urlsStr: string): string[] {
//   if (!urlsStr || urlsStr.trim() === "" || urlsStr === "[]") {
//     return [];
//   }

//   try {
//     const parsed = JSON.parse(urlsStr);
//     if (Array.isArray(parsed)) {
//       return parsed;
//     }
//   } catch (e) {
//     return urlsStr
//       .split(",")
//       .map((u) => u.trim())
//       .filter((u) => u.length > 0);
//   }

//   return [];
// }

// function parsePriceRange(priceStr: string): PriceRange | undefined {
//   const priceMap: Record<string, PriceRange> = {
//     budget: "BUDGET",
//     moderate: "MODERATE",
//     premium: "PREMIUM",
//     luxury: "LUXURY",
//     $: "BUDGET",
//     $$: "MODERATE",
//     $$$: "PREMIUM",
//     $$$$: "LUXURY",
//   };

//   const normalized = priceStr?.toLowerCase().trim() || "";
//   const mapped = priceMap[normalized];
//   if (mapped && Object.values(PriceRange).includes(mapped)) {
//     return mapped;
//   }
//   return undefined;
// }

// function parseBarType(typeStr: string): BarType | undefined {
//   if (!typeStr) return undefined;

//   let normalized = typeStr.toLowerCase().trim();
//   normalized = normalized.replace(/ /g, "_");

//   const typeMap: Record<string, BarType> = {
//     pub: "PUB",
//     club: "CLUB",
//     lounge: "LOUNGE",
//     cocktail_bar: "COCKTAIL_BAR",
//     restaurant_bar: "RESTAURANT_BAR",
//     sports_bar: "SPORTS_BAR",
//     karaoke: "KARAOKE",
//     live_music: "LIVE_MUSIC",
//   };

//   if (typeMap[normalized]) {
//     return typeMap[normalized];
//   }

//   const upperNormalized = normalized.toUpperCase();
//   const validBarTypes: BarType[] = [
//     "PUB",
//     "CLUB",
//     "LOUNGE",
//     "COCKTAIL_BAR",
//     "RESTAURANT_BAR",
//     "SPORTS_BAR",
//     "KARAOKE",
//     "LIVE_MUSIC",
//   ];

//   if (validBarTypes.includes(upperNormalized as BarType)) {
//     return upperNormalized as BarType;
//   }

//   console.log(`⚠️ Unknown bar type: "${typeStr}"`);
//   return undefined;
// }

// export async function POST(request: NextRequest): Promise<NextResponse> {
//   try {
//     const token = request.headers.get("authorization")?.replace("Bearer ", "");

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const adminUser = await verifyAdminToken(token);
//     if (!adminUser) {
//       return NextResponse.json({ error: "Invalid token" }, { status: 401 });
//     }

//     const formData = await request.formData();
//     const file = (formData.get("file") ||
//       formData.get("csvFile")) as File | null;

//     if (!file) {
//       return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
//     }

//     const fileContent = await file.text();
//     const lines = fileContent.split("\n");

//     // Get headers from first line
//     const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
//     console.log("📋 CSV Headers:", headers);

//     // Define column indexes based on your CSV headers
//     const nameIndex = headers.indexOf("name");
//     const typeIndex = headers.indexOf("type");
//     const addressIndex = headers.indexOf("address");
//     const cityIndex = headers.indexOf("city");
//     const districtIndex = headers.indexOf("district");
//     const latitudeIndex = headers.indexOf("latitude");
//     const longitudeIndex = headers.indexOf("longitude");
//     const phoneIndex = headers.indexOf("phone");
//     const emailIndex = headers.indexOf("email");
//     const websiteIndex = headers.indexOf("website");
//     const instagramIndex = headers.indexOf("instagram");
//     const priceRangeIndex = headers.indexOf("pricerange");
//     const capacityIndex = headers.indexOf("capacity");
//     const amenitiesIndex = headers.indexOf("amenities");
//     const descriptionIndex = headers.indexOf("description");
//     const operatingHoursIndex = headers.indexOf("operatinghours");
//     const vipEnabledIndex = headers.indexOf("vipenabled");
//     const coverImageIndex = headers.indexOf("coverimage");
//     const imageUrlsIndex = headers.indexOf("imageurls");
//     const logoUrlIndex = headers.indexOf("logourl");
//     const statusIndex = headers.indexOf("status");
//     const isVerifiedIndex = headers.indexOf("isverified");
//     const isActiveIndex = headers.indexOf("isactive");

//     console.log("📋 Column Indexes:", {
//       name: nameIndex,
//       type: typeIndex,
//       address: addressIndex,
//       city: cityIndex,
//       district: districtIndex,
//       latitude: latitudeIndex,
//       longitude: longitudeIndex,
//       phone: phoneIndex,
//       email: emailIndex,
//       website: websiteIndex,
//       instagram: instagramIndex,
//     });

//     const results = {
//       total: 0,
//       imported: 0,
//       skipped: 0,
//       errors: [] as string[],
//       duplicates: [] as { row: number; name: string; reason: string }[],
//     };

//     const processedNames = new Set<string>();

//     for (let i = 1; i < lines.length; i++) {
//       const line = lines[i].trim();
//       if (!line) continue;

//       results.total++;

//       try {
//         // Parse CSV line properly (handling quoted values)
//         const values: string[] = [];
//         let current = "";
//         let inQuotes = false;

//         for (let j = 0; j < line.length; j++) {
//           const char = line[j];
//           if (char === '"') {
//             inQuotes = !inQuotes;
//           } else if (char === "," && !inQuotes) {
//             values.push(current.trim());
//             current = "";
//           } else {
//             current += char;
//           }
//         }
//         values.push(current.trim());

//         // Clean values (remove quotes)
//         const cleanValues = values.map((v) => v.replace(/^"|"$/g, "").trim());

//         const name = cleanValues[nameIndex];
//         if (!name) {
//           throw new Error("Name is required");
//         }

//         const typeStr = cleanValues[typeIndex];
//         const barType = parseBarType(typeStr);
//         if (!barType) {
//           throw new Error(`Invalid bar type: ${typeStr}`);
//         }

//         const address = cleanValues[addressIndex];
//         if (!address) {
//           throw new Error("Address is required");
//         }

//         const cityName = cleanValues[cityIndex];
//         if (!cityName) {
//           throw new Error("City is required");
//         }

//         // Check for duplicate within the same file
//         if (processedNames.has(name.toLowerCase())) {
//           results.duplicates.push({
//             row: i + 1,
//             name: name,
//             reason: "within_file",
//           });
//           results.skipped++;
//           continue;
//         }

//         // Check if bar already exists in database
//         const existingBar = await prisma.bar.findFirst({
//           where: { name: { equals: name, mode: "insensitive" } },
//           select: { id: true, name: true },
//         });

//         if (existingBar) {
//           results.duplicates.push({
//             row: i + 1,
//             name: name,
//             reason: "already_in_database",
//           });
//           results.skipped++;
//           continue;
//         }

//         processedNames.add(name.toLowerCase());

//         // Parse values correctly
//         const latitude = cleanValues[latitudeIndex]
//           ? parseFloat(cleanValues[latitudeIndex])
//           : null;
//         const longitude = cleanValues[longitudeIndex]
//           ? parseFloat(cleanValues[longitudeIndex])
//           : null;
//         const phone = cleanValues[phoneIndex] || null;
//         const email = cleanValues[emailIndex] || null;
//         const website = cleanValues[websiteIndex] || null;
//         const instagram = cleanValues[instagramIndex] || null;
//         const priceRange = parsePriceRange(cleanValues[priceRangeIndex]);
//         const capacity = cleanValues[capacityIndex]
//           ? parseInt(cleanValues[capacityIndex])
//           : null;
//         const amenities = parseAmenities(cleanValues[amenitiesIndex]);
//         const description = cleanValues[descriptionIndex] || null;
//         const operatingHours = parseOperatingHours(
//           cleanValues[operatingHoursIndex] || "{}",
//         );
//         const vipEnabled =
//           cleanValues[vipEnabledIndex]?.toLowerCase() === "true";
//         const coverImage = cleanValues[coverImageIndex] || null;
//         const imageUrls = parseImageUrls(cleanValues[imageUrlsIndex]);
//         const logoUrl = cleanValues[logoUrlIndex] || null;
//         const status = cleanValues[statusIndex] || "UNCLAIMED";
//         const isVerified =
//           cleanValues[isVerifiedIndex]?.toLowerCase() === "true";
//         const isActive = cleanValues[isActiveIndex]?.toLowerCase() !== "false";

//         // Find or create city
//         let city = await prisma.city.findFirst({
//           where: { name: { equals: cityName, mode: "insensitive" } },
//         });

//         if (!city) {
//           city = await prisma.city.create({
//             data: {
//               name: cityName,
//               country: "Finland",
//               isActive: true,
//             },
//           });
//         }

//         const bar = await prisma.bar.create({
//           data: {
//             name: name,
//             description: description,
//             address: address,
//             cityName: cityName,
//             cityId: city.id,
//             district: cleanValues[districtIndex] || null,
//             type: barType,
//             latitude: latitude,
//             longitude: longitude,
//             phone: phone,
//             email: email,
//             website: website,
//             instagram: instagram,
//             operatingHours: operatingHours,
//             priceRange: priceRange,
//             capacity: capacity,
//             amenities: amenities,
//             coverImage: coverImage,
//             imageUrls: imageUrls,
//             logoUrl: logoUrl,
//             status: status,
//             isVerified: isVerified,
//             isActive: isActive,
//             vipEnabled: vipEnabled,
//             createdById: adminUser.id,
//           },
//         });

//         results.imported++;

//         // Create audit log
//         await prisma.auditLog.create({
//           data: {
//             adminId: adminUser.id,
//             barId: bar.id,
//             action: "IMPORT",
//             resource: "BAR",
//             details: { barName: bar.name, source: "CSV_IMPORT" },
//             createdAt: new Date(),
//           },
//         });
//       } catch (error) {
//         results.skipped++;
//         const errorMsg =
//           error instanceof Error ? error.message : "Unknown error";
//         results.errors.push(`Row ${i + 1}: ${errorMsg}`);
//         console.error(`Error importing row ${i + 1}:`, error);
//       }
//     }

//     let importStatus: ImportStatus = "COMPLETED";
//     if (results.imported === 0 && results.skipped > 0) {
//       importStatus = "FAILED";
//     } else if (results.skipped > 0 && results.imported > 0) {
//       importStatus = "PARTIAL";
//     }

//     try {
//       await prisma.barImport.create({
//         data: {
//           fileName: file.name,
//           fileSize: file.size,
//           totalRows: results.total,
//           importedRows: results.imported,
//           failedRows: results.skipped,
//           status: importStatus,
//           errors: results.errors.length > 0 ? results.errors : undefined,
//           importedBy: adminUser.id,
//         },
//       });
//     } catch (error) {
//       console.log("Note: barImport table audit skipped");
//     }

//     return NextResponse.json({
//       success: true,
//       imported: results.imported,
//       skipped: results.skipped,
//       total: results.total,
//       duplicates: results.duplicates,
//       errors: results.errors.slice(0, 10),
//       status: importStatus,
//       message:
//         importStatus === "COMPLETED"
//           ? `✅ Successfully imported all ${results.imported} bars!`
//           : importStatus === "PARTIAL"
//             ? `⚠️ Imported ${results.imported} bars, skipped ${results.skipped} duplicates`
//             : `❌ Failed to import ${results.skipped} bars`,
//     });
//   } catch (error) {
//     console.error("Import error:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }

// export async function GET(request: NextRequest): Promise<NextResponse> {
//   try {
//     const token = request.headers.get("authorization")?.replace("Bearer ", "");

//     if (!token) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const adminUser = await verifyAdminToken(token);
//     if (!adminUser) {
//       return NextResponse.json({ error: "Invalid token" }, { status: 401 });
//     }

//     const imports = await prisma.barImport.findMany({
//       orderBy: { createdAt: "desc" },
//       take: 50,
//     });

//     return NextResponse.json({ imports });
//   } catch (error) {
//     console.error("Error fetching import history:", error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500 },
//     );
//   }
// }
import { NextRequest, NextResponse } from "next/server";
import {
  PrismaClient,
  BarType,
  PriceRange,
  ImportStatus,
  BarStatus,
} from "@prisma/client";
import { verify } from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface JwtPayload {
  id: string;
  email: string;
}

async function verifyAdminToken(token: string): Promise<{ id: string } | null> {
  try {
    const decoded = verify(token, JWT_SECRET) as JwtPayload;

    const adminUser = await prisma.adminUser.findFirst({
      where: {
        email: decoded.email,
        isActive: true,
      },
      select: { id: true },
    });

    return adminUser;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

function parseOperatingHours(hoursStr: string) {
  const defaultHours = { open: "Closed", close: "Closed" };
  const operatingHours = {
    Monday: { ...defaultHours },
    Tuesday: { ...defaultHours },
    Wednesday: { ...defaultHours },
    Thursday: { ...defaultHours },
    Friday: { ...defaultHours },
    Saturday: { ...defaultHours },
    Sunday: { ...defaultHours },
  };

  if (!hoursStr || hoursStr.trim() === "" || hoursStr === "{}") {
    return operatingHours;
  }

  try {
    const parsed = JSON.parse(hoursStr);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed;
    }
  } catch (e) {
    const parts = hoursStr.split(",");
    for (const part of parts) {
      const match = part.match(
        /(\w+):\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/i,
      );
      if (match) {
        const day = match[1] as keyof typeof operatingHours;
        let openTime = match[2];
        let closeTime = match[3];

        if (!openTime.includes(":")) openTime = `${openTime}:00`;
        if (!closeTime.includes(":")) closeTime = `${closeTime}:00`;

        if (operatingHours[day]) {
          operatingHours[day] = { open: openTime, close: closeTime };
        }
      }
    }
  }

  return operatingHours;
}

function parseAmenities(amenitiesStr: string): string[] {
  if (!amenitiesStr || amenitiesStr.trim() === "" || amenitiesStr === "[]") {
    return [];
  }

  try {
    const parsed = JSON.parse(amenitiesStr);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    return amenitiesStr
      .split(",")
      .map((a) => a.trim().replace(/['\[\]]/g, ""))
      .filter((a) => a.length > 0);
  }

  return [];
}

function parseImageUrls(urlsStr: string): string[] {
  if (!urlsStr || urlsStr.trim() === "" || urlsStr === "[]") {
    return [];
  }

  try {
    const parsed = JSON.parse(urlsStr);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (e) {
    return urlsStr
      .split(",")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
  }

  return [];
}

function parsePriceRange(priceStr: string): PriceRange | undefined {
  const priceMap: Record<string, PriceRange> = {
    budget: "BUDGET",
    moderate: "MODERATE",
    premium: "PREMIUM",
    luxury: "LUXURY",
    $: "BUDGET",
    $$: "MODERATE",
    $$$: "PREMIUM",
    $$$$: "LUXURY",
  };

  const normalized = priceStr?.toLowerCase().trim() || "";
  const mapped = priceMap[normalized];
  if (mapped && Object.values(PriceRange).includes(mapped)) {
    return mapped;
  }
  return undefined;
}

function parseBarType(typeStr: string): BarType | undefined {
  if (!typeStr) return undefined;

  let normalized = typeStr.toLowerCase().trim();
  normalized = normalized.replace(/ /g, "_");

  const typeMap: Record<string, BarType> = {
    pub: "PUB",
    club: "CLUB",
    lounge: "LOUNGE",
    cocktail_bar: "COCKTAIL_BAR",
    restaurant_bar: "RESTAURANT_BAR",
    sports_bar: "SPORTS_BAR",
    karaoke: "KARAOKE",
    live_music: "LIVE_MUSIC",
  };

  if (typeMap[normalized]) {
    return typeMap[normalized];
  }

  const upperNormalized = normalized.toUpperCase();
  const validBarTypes: BarType[] = [
    "PUB",
    "CLUB",
    "LOUNGE",
    "COCKTAIL_BAR",
    "RESTAURANT_BAR",
    "SPORTS_BAR",
    "KARAOKE",
    "LIVE_MUSIC",
  ];

  if (validBarTypes.includes(upperNormalized as BarType)) {
    return upperNormalized as BarType;
  }

  console.log(`⚠️ Unknown bar type: "${typeStr}"`);
  return undefined;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await verifyAdminToken(token);
    if (!adminUser) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = (formData.get("file") ||
      formData.get("csvFile")) as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileContent = await file.text();
    const lines = fileContent.split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

    const nameIndex = headers.indexOf("name");
    const typeIndex = headers.indexOf("type");
    const addressIndex = headers.indexOf("address");
    const cityIndex = headers.indexOf("city");
    const districtIndex = headers.indexOf("district");
    const latitudeIndex = headers.indexOf("latitude");
    const longitudeIndex = headers.indexOf("longitude");
    const phoneIndex = headers.indexOf("phone");
    const emailIndex = headers.indexOf("email");
    const websiteIndex = headers.indexOf("website");
    const instagramIndex = headers.indexOf("instagram");
    const priceRangeIndex = headers.indexOf("pricerange");
    const capacityIndex = headers.indexOf("capacity");
    const amenitiesIndex = headers.indexOf("amenities");
    const descriptionIndex = headers.indexOf("description");
    const operatingHoursIndex = headers.indexOf("operatinghours");
    const vipEnabledIndex = headers.indexOf("vipenabled");
    const coverImageIndex = headers.indexOf("coverimage");
    const imageUrlsIndex = headers.indexOf("imageurls");
    const logoUrlIndex = headers.indexOf("logourl");
    const statusIndex = headers.indexOf("status");
    const isVerifiedIndex = headers.indexOf("isverified");
    const isActiveIndex = headers.indexOf("isactive");

    const results = {
      total: 0,
      imported: 0,
      skipped: 0,
      errors: [] as string[],
      duplicates: [] as { row: number; name: string; reason: string }[],
    };

    const processedNames = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      results.total++;

      try {
        const values: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const cleanValues = values.map((v) => v.replace(/^"|"$/g, "").trim());

        const name = cleanValues[nameIndex];
        if (!name) {
          throw new Error("Name is required");
        }

        const typeStr = cleanValues[typeIndex];
        const barType = parseBarType(typeStr);
        if (!barType) {
          throw new Error(`Invalid bar type: ${typeStr}`);
        }

        const address = cleanValues[addressIndex];
        if (!address) {
          throw new Error("Address is required");
        }

        const cityName = cleanValues[cityIndex];
        if (!cityName) {
          throw new Error("City is required");
        }

        if (processedNames.has(name.toLowerCase())) {
          results.duplicates.push({
            row: i + 1,
            name: name,
            reason: "within_file",
          });
          results.skipped++;
          continue;
        }

        const existingBar = await prisma.bar.findFirst({
          where: { name: { equals: name, mode: "insensitive" } },
          select: { id: true, name: true },
        });

        if (existingBar) {
          results.duplicates.push({
            row: i + 1,
            name: name,
            reason: "already_in_database",
          });
          results.skipped++;
          continue;
        }

        processedNames.add(name.toLowerCase());

        const latitude = cleanValues[latitudeIndex]
          ? parseFloat(cleanValues[latitudeIndex])
          : null;
        const longitude = cleanValues[longitudeIndex]
          ? parseFloat(cleanValues[longitudeIndex])
          : null;
        const phone = cleanValues[phoneIndex] || null;
        const email = cleanValues[emailIndex] || null;
        const website = cleanValues[websiteIndex] || null;
        const instagram = cleanValues[instagramIndex] || null;
        const priceRange = parsePriceRange(cleanValues[priceRangeIndex]);
        const capacity = cleanValues[capacityIndex]
          ? parseInt(cleanValues[capacityIndex])
          : null;
        const amenities = parseAmenities(cleanValues[amenitiesIndex]);
        const description = cleanValues[descriptionIndex] || null;
        const operatingHours = parseOperatingHours(
          cleanValues[operatingHoursIndex] || "{}",
        );
        const vipEnabled =
          cleanValues[vipEnabledIndex]?.toLowerCase() === "true";
        const coverImage = cleanValues[coverImageIndex] || null;
        const imageUrls = parseImageUrls(cleanValues[imageUrlsIndex]);
        const logoUrl = cleanValues[logoUrlIndex] || null;

        // ✅ FIXED: Properly type the status as BarStatus enum
        let status: BarStatus = "UNCLAIMED";
        const statusValue = cleanValues[statusIndex];
        if (
          statusValue &&
          Object.values(BarStatus).includes(statusValue as BarStatus)
        ) {
          status = statusValue as BarStatus;
        }

        const isVerified =
          cleanValues[isVerifiedIndex]?.toLowerCase() === "true";
        const isActive = cleanValues[isActiveIndex]?.toLowerCase() !== "false";

        let city = await prisma.city.findFirst({
          where: { name: { equals: cityName, mode: "insensitive" } },
        });

        if (!city) {
          city = await prisma.city.create({
            data: {
              name: cityName,
              country: "Finland",
              isActive: true,
            },
          });
        }

        const bar = await prisma.bar.create({
          data: {
            name: name,
            description: description,
            address: address,
            cityName: cityName,
            cityId: city.id,
            district: cleanValues[districtIndex] || null,
            type: barType,
            latitude: latitude,
            longitude: longitude,
            phone: phone,
            email: email,
            website: website,
            instagram: instagram,
            operatingHours: operatingHours,
            priceRange: priceRange,
            capacity: capacity,
            amenities: amenities,
            coverImage: coverImage,
            imageUrls: imageUrls,
            logoUrl: logoUrl,
            status: status,
            isVerified: isVerified,
            isActive: isActive,
            vipEnabled: vipEnabled,
            createdById: adminUser.id,
          },
        });

        results.imported++;

        await prisma.auditLog.create({
          data: {
            adminId: adminUser.id,
            barId: bar.id,
            action: "IMPORT",
            resource: "BAR",
            details: { barName: bar.name, source: "CSV_IMPORT" },
            createdAt: new Date(),
          },
        });
      } catch (error) {
        results.skipped++;
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`Row ${i + 1}: ${errorMsg}`);
        console.error(`Error importing row ${i + 1}:`, error);
      }
    }

    let importStatus: ImportStatus = "COMPLETED";
    if (results.imported === 0 && results.skipped > 0) {
      importStatus = "FAILED";
    } else if (results.skipped > 0 && results.imported > 0) {
      importStatus = "PARTIAL";
    }

    try {
      await prisma.barImport.create({
        data: {
          fileName: file.name,
          fileSize: file.size,
          totalRows: results.total,
          importedRows: results.imported,
          failedRows: results.skipped,
          status: importStatus,
          errors: results.errors.length > 0 ? results.errors : undefined,
          importedBy: adminUser.id,
        },
      });
    } catch (error) {
      console.log("Note: barImport table audit skipped");
    }

    return NextResponse.json({
      success: true,
      imported: results.imported,
      skipped: results.skipped,
      total: results.total,
      duplicates: results.duplicates,
      errors: results.errors.slice(0, 10),
      status: importStatus,
      message:
        importStatus === "COMPLETED"
          ? `✅ Successfully imported all ${results.imported} bars!`
          : importStatus === "PARTIAL"
            ? `⚠️ Imported ${results.imported} bars, skipped ${results.skipped} duplicates`
            : `❌ Failed to import ${results.skipped} bars`,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await verifyAdminToken(token);
    if (!adminUser) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const imports = await prisma.barImport.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ imports });
  } catch (error) {
    console.error("Error fetching import history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
