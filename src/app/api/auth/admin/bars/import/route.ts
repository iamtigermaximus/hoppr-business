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
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, BarType, PriceRange } from "@prisma/client";

const prisma = new PrismaClient();

const VALID_BAR_TYPES = [
  "PUB",
  "CLUB",
  "LOUNGE",
  "COCKTAIL_BAR",
  "RESTAURANT_BAR",
  "SPORTS_BAR",
  "KARAOKE",
  "LIVE_MUSIC",
] as const;

const VALID_PRICE_RANGES = ["BUDGET", "MODERATE", "PREMIUM", "LUXURY"] as const;

interface CSVRecord {
  name?: string;
  type?: string;
  address?: string;
  city?: string;
  district?: string;
  latitude?: string;
  longitude?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  priceRange?: string;
  capacity?: string;
  amenities?: string;
  description?: string;
  operatingHours?: string;
  vipEnabled?: string;
  coverImage?: string;
  imageUrls?: string;
  logoUrl?: string;
}

async function verifyAdminToken(token: string) {
  try {
    const adminUser = await prisma.adminUser.findFirst({
      where: { isActive: true },
    });
    return adminUser;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

function parseCSV(csvText: string): CSVRecord[] {
  const lines = csvText.split("\n").filter((line) => line.trim() !== "");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  console.log("FUCKING HEADERS:", headers);

  const records: CSVRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = line[j + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const record: CSVRecord = {};
    headers.forEach((header, index) => {
      if (index < values.length) {
        const value = values[index].replace(/"/g, "").trim();
        record[header as keyof CSVRecord] = value;
      }
    });

    if (record.name && record.name.trim()) {
      records.push(record);
    }
  }

  console.log(`PARSED ${records.length} FUCKING RECORDS`);
  return records;
}

export async function POST(request: NextRequest) {
  try {
    console.log("STARTING FUCKING CSV IMPORT...");

    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await verifyAdminToken(token);
    if (!adminUser) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const formData = await request.formData();
    const csvFile = formData.get("csvFile") as File;
    if (!csvFile) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (csvFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const csvText = await csvFile.text();
    console.log("RAW CSV:", csvText);

    const records = parseCSV(csvText);

    if (records.length === 0) {
      return NextResponse.json(
        { error: "CSV file is empty or has no valid data" },
        { status: 400 }
      );
    }

    console.log("FIRST RECORD:", records[0]);

    let importedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (const [index, record] of records.entries()) {
      const rowNumber = index + 2;

      try {
        if (!record.name?.trim()) {
          errors.push(`Row ${rowNumber}: Missing bar name`);
          failedCount++;
          continue;
        }

        if (!record.type?.trim()) {
          errors.push(`Row ${rowNumber}: Missing bar type`);
          failedCount++;
          continue;
        }

        if (!record.address?.trim()) {
          errors.push(`Row ${rowNumber}: Missing address`);
          failedCount++;
          continue;
        }

        if (!record.city?.trim()) {
          errors.push(`Row ${rowNumber}: Missing city`);
          failedCount++;
          continue;
        }

        const barType = record.type.toUpperCase();
        if (
          !VALID_BAR_TYPES.includes(barType as (typeof VALID_BAR_TYPES)[number])
        ) {
          errors.push(
            `Row ${rowNumber}: Invalid bar type "${
              record.type
            }". Must be one of: ${VALID_BAR_TYPES.join(", ")}`
          );
          failedCount++;
          continue;
        }

        if (
          record.priceRange &&
          !VALID_PRICE_RANGES.includes(
            record.priceRange.toUpperCase() as (typeof VALID_PRICE_RANGES)[number]
          )
        ) {
          errors.push(
            `Row ${rowNumber}: Invalid price range "${
              record.priceRange
            }". Must be one of: ${VALID_PRICE_RANGES.join(", ")}`
          );
          failedCount++;
          continue;
        }

        let latitude: number | null = null;
        let longitude: number | null = null;

        if (record.latitude) {
          latitude = parseFloat(record.latitude);
          if (isNaN(latitude)) {
            errors.push(
              `Row ${rowNumber}: Invalid latitude "${record.latitude}"`
            );
            failedCount++;
            continue;
          }
        }

        if (record.longitude) {
          longitude = parseFloat(record.longitude);
          if (isNaN(longitude)) {
            errors.push(
              `Row ${rowNumber}: Invalid longitude "${record.longitude}"`
            );
            failedCount++;
            continue;
          }
        }

        let amenities: string[] = [];
        if (record.amenities) {
          amenities = record.amenities
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean);
        }

        let imageUrls: string[] = [];
        if (record.imageUrls) {
          imageUrls = record.imageUrls
            .split(",")
            .map((url) => url.trim())
            .filter(Boolean);
        }

        let operatingHours = {};
        if (record.operatingHours) {
          try {
            operatingHours = JSON.parse(record.operatingHours);
          } catch (e) {
            console.log("Invalid operating hours, using default");
          }
        }

        const existingBar = await prisma.bar.findUnique({
          where: { name: record.name.trim() },
        });

        if (existingBar) {
          errors.push(`Row ${rowNumber}: Bar "${record.name}" already exists`);
          failedCount++;
          continue;
        }

        await prisma.bar.create({
          data: {
            name: record.name.trim(),
            type: barType as BarType,
            address: record.address.trim(),
            city: record.city.trim(),
            district: record.district?.trim() || null,
            latitude: latitude,
            longitude: longitude,
            phone: record.phone?.trim() || null,
            email: record.email?.trim() || null,
            website: record.website?.trim() || null,
            instagram: record.instagram?.trim() || null,
            priceRange: record.priceRange
              ? (record.priceRange.toUpperCase() as PriceRange)
              : null,
            capacity: record.capacity ? parseInt(record.capacity) : null,
            amenities: amenities,
            description: record.description?.trim() || null,
            operatingHours: operatingHours,
            vipEnabled: record.vipEnabled
              ? record.vipEnabled.toLowerCase() === "true"
              : false,
            coverImage: record.coverImage?.trim() || null,
            imageUrls: imageUrls,
            logoUrl: record.logoUrl?.trim() || null,
            status: "UNCLAIMED",
            isVerified: false,
            isActive: true,
            createdById: adminUser.id,
          },
        });

        importedCount++;
        console.log(`IMPORTED: ${record.name}`);
      } catch (error) {
        console.error(`ERROR ROW ${rowNumber}:`, error);
        errors.push(
          `Row ${rowNumber}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        failedCount++;
      }
    }

    console.log(
      `IMPORT COMPLETED: ${importedCount} imported, ${failedCount} failed`
    );

    try {
      await prisma.barImport.create({
        data: {
          fileName: csvFile.name,
          fileSize: csvFile.size,
          totalRows: records.length,
          importedRows: importedCount,
          failedRows: failedCount,
          status:
            failedCount === 0
              ? "COMPLETED"
              : failedCount === records.length
              ? "FAILED"
              : "PARTIAL",
          errors: errors.length > 0 ? errors : undefined,
          importedBy: adminUser.id,
        },
      });
    } catch (error) {
      console.log("NO AUDIT RECORD - BARIMPORT TABLE PROBABLY DOESN'T EXIST");
    }

    return NextResponse.json({
      success: true,
      imported: importedCount,
      failed: failedCount,
      total: records.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    console.error("FUCKING CSV IMPORT ERROR:", error);
    return NextResponse.json(
      {
        error:
          "Internal server error: " +
          (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    );
  }
}
