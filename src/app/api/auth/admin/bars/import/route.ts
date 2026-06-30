// POST /api/auth/admin/bars/import — CSV batch import of bars
// GET  /api/auth/admin/bars/import — list recent imports
//
// Admin-only. Accepts a multipart CSV file upload with columns:
// name, type, address, city, district, latitude, longitude, phone, email,
// website, instagram, priceRange, capacity, amenities, description,
// operatingHours, vipEnabled, coverImage, imageUrls, logoUrl,
// status, isVerified, isActive

import { NextRequest, NextResponse } from "next/server";
import {
  PrismaClient,
  BarType,
  PriceRange,
  ImportStatus,
  BarStatus,
} from "@prisma/client";
import { verifyAuthHeader, isAdminToken } from "@/lib/auth";
import { handleApiError, AppError } from "@/lib/api-error";

const prisma = new PrismaClient();

// ---- CSV Parsing Helpers ----

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
  } catch {
    // Fallback: parse "Day: HH:MM - HH:MM" format
    const parts = hoursStr.split(",");
    for (const part of parts) {
      const match = part.match(
        /(\\w+):\\s*(\\d{1,2}(?::\\d{2})?\\s*(?:AM|PM)?)\\s*-\\s*(\\d{1,2}(?::\\d{2})?\\s*(?:AM|PM)?)/i,
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
  } catch {
    return amenitiesStr
      .split(",")
      .map((a) => a.trim().replace(/['\\[\\]]/g, ""))
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
  } catch {
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

  console.log(`Unknown bar type: "${typeStr}"`);
  return undefined;
}

// ---- Route Handlers ----

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isAdminToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = (formData.get("file") ||
      formData.get("csvFile")) as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileContent = await file.text();
    const lines = fileContent.split("\\n");
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

        const bar = await prisma.bar.create({
          data: {
            name: name,
            description: description,
            address: address,
            cityName: cityName,
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
          },
        });

        results.imported++;

        await prisma.auditLog.create({
          data: {
            userId: payload.userId,
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
    if (results.imported === 0 && results.errors.length > 0) {
      importStatus = "FAILED";
    } else if (results.skipped > 0 && results.imported > 0) {
      importStatus = "PARTIAL";
    }

    // Log the import batch
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
        },
      });
    } catch (logError) {
      console.error(
        "Failed to create barImport record — table may not exist. Run: npx prisma db push",
      );
      console.error("Error details:", logError);
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
          ? `Successfully imported all ${results.imported} bars!`
          : importStatus === "PARTIAL"
            ? `Imported ${results.imported} bars, skipped ${results.skipped} duplicates`
            : `Failed to import ${results.skipped} bars`,
    });
  } catch (error) {
    return handleApiError(error, "Bar import");
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = verifyAuthHeader(request);
    if (!payload || !isAdminToken(payload)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const imports = await prisma.barImport.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ imports });
  } catch (error) {
    console.error(
      "Failed to query barImport — table may not exist. Run: npx prisma db push",
    );
    console.error("Error details:", error);
    return NextResponse.json(
      { imports: [], error: "bar_imports table not found — run prisma db push" },
      { status: 200 },
    );
  }
}
