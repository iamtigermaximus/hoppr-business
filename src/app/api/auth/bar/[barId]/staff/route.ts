// src/app/api/auth/bar/[barId]/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { authService } from "@/services/auth-service";
import { hashPassword } from "@/lib/auth";
import { checkRateLimit, RateLimits } from "@/lib/rate-limiter";
import { checkPlanLimit } from "@/lib/plan-limits";
import { handleApiError } from "@/lib/api-error";

export type BarStaffRole =
  | "OWNER"
  | "MANAGER"
  | "PROMOTIONS_MANAGER"
  | "STAFF"
  | "VIEWER";

// Types for this route
interface CreateStaffRequest {
  email: string;
  name: string;
  role: BarStaffRole;
  password: string;
}

interface AuthResult {
  type: "admin" | "bar_staff";
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    barId?: string;
    staffRole?: BarStaffRole;
    adminRole?: string;
    permissions?: string[];
  };
}

// POST - Create new bar staff directly
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> } // ✅ FIX: params is now Promise
): Promise<NextResponse> {
  try {
    const { barId } = await params; // ✅ FIX: await the params
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const authResult: AuthResult = await authService.validateToken(token);

    // Verify bar access and permissions - handle both admin and bar_staff
    if (authResult.type === "admin") {
      // Admin users have full access to all bars
    } else if (authResult.type === "bar_staff") {
      // Bar staff must belong to the same bar and have proper role
      if (authResult.user.barId !== barId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // Only OWNER and MANAGER can create staff
      if (!["OWNER", "MANAGER"].includes(authResult.user.staffRole || "")) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Rate limit: 15 staff operations per minute per bar
    const rateCheck = checkRateLimit(`staff:${barId}`, RateLimits.STAFF);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Rate limit reached. Retry in ${rateCheck.retryAfter}s.` },
        { status: 429 },
      );
    }

    // Plan limit check: ensure bar hasn't exceeded max staff
    const barPlan = await prisma.bar.findUnique({
      where: { id: barId },
      select: { plan: true, _count: { select: { staff: true } } },
    });
    if (barPlan) {
      const limitCheck = checkPlanLimit(barPlan.plan, "staff", barPlan._count.staff);
      if (!limitCheck.allowed) {
        return NextResponse.json({ error: limitCheck.reason }, { status: 402 });
      }
    }

    const { email, name, role, password }: CreateStaffRequest =
      await request.json();

    if (!email || !name || !role || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if staff already exists for this bar
    const existingStaff = await prisma.barStaff.findFirst({
      where: {
        barId: barId,
        email: email.toLowerCase(),
      },
    });

    if (existingStaff) {
      return NextResponse.json(
        { error: "Staff member already exists for this bar" },
        { status: 409 }
      );
    }

    // Create user account, then link to bar as staff
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.upsert({
      where: { email: email.toLowerCase() },
      update: { hashedPassword, name, role: "BAR_STAFF" },
      create: {
        email: email.toLowerCase(),
        name,
        hashedPassword,
        role: "BAR_STAFF",
      },
    });

    const staff = await prisma.barStaff.create({
      data: {
        barId: barId,
        userId: user.id,
        email: email.toLowerCase(),
        name,
        role,
        permissions: getPermissionsForRole(role),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        role: staff.role,
        roleLabel: ROLE_META[staff.role]?.label,
        roleDescription: ROLE_META[staff.role]?.description,
        permissions: staff.permissions,
        isActive: staff.isActive,
        lastLogin: staff.lastLogin,
        createdAt: staff.createdAt,
      },
    });
  } catch (error) {
    return handleApiError(error, "Create bar staff error");
  }
}

// GET - Fetch bar staff
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> } // ✅ FIX: params is now Promise
): Promise<NextResponse> {
  try {
    const { barId } = await params; // ✅ FIX: await the params
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const authResult: AuthResult = await authService.validateToken(token);

    // Verify bar access - handle both admin and bar_staff
    if (authResult.type === "admin") {
      // Admin can access any bar
    } else if (authResult.type === "bar_staff") {
      // Bar staff must belong to the same bar
      if (authResult.user.barId !== barId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Rate limit: 15 staff operations per minute per bar
    const rateCheck = checkRateLimit(`staff:${barId}`, RateLimits.STAFF);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Rate limit reached. Retry in ${rateCheck.retryAfter}s.` },
        { status: 429 },
      );
    }

    // Parse query params for search, filter, sort, and pagination
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const roleFilter = searchParams.get("role") as BarStaffRole | undefined;
    const sortBy = (searchParams.get("sortBy") || "createdAt") as
      | "name"
      | "email"
      | "role"
      | "createdAt"
      | "lastLogin";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "25")),
    );
    const skip = (page - 1) * limit;

    // Build where clause — barId is always required, search + role are optional
    const where: Record<string, unknown> = { barId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (
      roleFilter &&
      ["OWNER", "MANAGER", "PROMOTIONS_MANAGER", "STAFF", "VIEWER"].includes(
        roleFilter,
      )
    ) {
      where.role = roleFilter;
    }

    // Build orderBy — only allow sortable columns to avoid injection
    const validSortColumns = ["name", "email", "role", "createdAt", "lastLogin"];
    const orderColumn = validSortColumns.includes(sortBy) ? sortBy : "createdAt";
    const orderDirection = sortOrder === "asc" ? "asc" : "desc";

    const [staff, total] = await Promise.all([
      prisma.barStaff.findMany({
        where: where as any,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          permissions: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { [orderColumn]: orderDirection },
        skip,
        take: limit,
      }),
      prisma.barStaff.count({ where: where as any }),
    ]);

    return NextResponse.json({
      staff,
      roles: ROLE_META,
      permissionDescriptions: PERMISSION_DESCRIPTIONS,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error, "Fetch bar staff error");
  }
}

// PUT - Update bar staff
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> } // ✅ FIX: params is now Promise
): Promise<NextResponse> {
  try {
    const { barId } = await params; // ✅ FIX: await the params
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const authResult: AuthResult = await authService.validateToken(token);

    // Verify permissions
    if (authResult.type === "bar_staff" && authResult.user.barId !== barId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Rate limit: 15 staff operations per minute per bar
    const rateCheck = checkRateLimit(`staff:${barId}`, RateLimits.STAFF);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Rate limit reached. Retry in ${rateCheck.retryAfter}s.` },
        { status: 429 },
      );
    }

    const { staffId, name, role, isActive, password } = await request.json();

    if (!staffId) {
      return NextResponse.json(
        { error: "Staff ID is required" },
        { status: 400 }
      );
    }

    // If a new password is provided, hash it and update the user record
    if (password && typeof password === "string" && password.length >= 6) {
      const barStaff = await prisma.barStaff.findUnique({
        where: { id: staffId, barId },
        select: { userId: true },
      });

      if (barStaff?.userId) {
        const hashedPassword = await hashPassword(password);
        await prisma.user.update({
          where: { id: barStaff.userId },
          data: { hashedPassword },
        });
      }
    }

    const staff = await prisma.barStaff.update({
      where: {
        id: staffId,
        barId: barId, // Ensure staff belongs to this bar
      },
      data: {
        ...(name && { name }),
        ...(role && { role, permissions: getPermissionsForRole(role) }),
        ...(typeof isActive === "boolean" && { isActive }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      staff,
    });
  } catch (error) {
    return handleApiError(error, "Update bar staff error");
  }
}

// DELETE - Remove bar staff
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ barId: string }> } // ✅ FIX: params is now Promise
): Promise<NextResponse> {
  try {
    const { barId } = await params; // ✅ FIX: await the params
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const authResult: AuthResult = await authService.validateToken(token);

    // Only OWNER and MANAGER can delete staff
    if (authResult.type === "bar_staff") {
      if (authResult.user.barId !== barId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
      if (!["OWNER", "MANAGER"].includes(authResult.user.staffRole || "")) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }
    }

    // Rate limit: 15 staff operations per minute per bar
    const rateCheck = checkRateLimit(`staff:${barId}`, RateLimits.STAFF);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Rate limit reached. Retry in ${rateCheck.retryAfter}s.` },
        { status: 429 },
      );
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");

    if (!staffId) {
      return NextResponse.json(
        { error: "Staff ID is required" },
        { status: 400 }
      );
    }

    // Don't allow users to delete themselves
    if (authResult.type === "bar_staff" && staffId === authResult.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    await prisma.barStaff.delete({
      where: {
        id: staffId,
        barId: barId, // Ensure staff belongs to this bar
      },
    });

    return NextResponse.json({
      success: true,
      message: "Staff member deleted successfully",
    });
  } catch (error) {
    return handleApiError(error, "Delete bar staff error");
  }
}

// Human-readable role metadata — returned in GET responses so the frontend
// can display descriptions and capability lists instead of raw permission strings.
const ROLE_META: Record<
  BarStaffRole,
  { label: string; description: string; capabilities: string[] }
> = {
  OWNER: {
    label: "Owner",
    description:
      "Full control over the bar. Can manage staff, promotions, view analytics, scan passes, and delete the bar.",
    capabilities: [
      "Manage staff members (add, edit, remove)",
      "Create, edit, and schedule promotions",
      "View all analytics and performance reports",
      "Scan and redeem customer passes",
      "Delete the bar",
    ],
  },
  MANAGER: {
    label: "Manager",
    description:
      "Day-to-day operations lead. Can manage staff, create promotions, view analytics, and scan passes.",
    capabilities: [
      "Manage staff members",
      "Create and edit promotions",
      "View analytics and reports",
      "Scan and redeem customer passes",
    ],
  },
  PROMOTIONS_MANAGER: {
    label: "Promotions Manager",
    description:
      "Focused on marketing and promotions. Can create and manage promotions and view analytics, but cannot manage staff or scan passes.",
    capabilities: [
      "Create, edit, and schedule promotions",
      "View promotion performance analytics",
    ],
  },
  STAFF: {
    label: "Staff",
    description:
      "Front-line staff. Can scan and redeem customer passes at the bar. Cannot manage promotions, staff, or view analytics.",
    capabilities: ["Scan and redeem customer passes"],
  },
  VIEWER: {
    label: "Viewer",
    description:
      "Read-only access to analytics. Can view reports and performance data but cannot make changes or scan passes.",
    capabilities: ["View analytics and performance reports"],
  },
};

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  "*": "Full access to all features",
  manage_staff: "Add, edit, and remove staff members",
  manage_promotions: "Create, edit, and schedule promotions",
  view_analytics: "View bar performance analytics and reports",
  scan_passes: "Scan and redeem customer drink passes",
};

// Helper function to set permissions based on role
function getPermissionsForRole(role: BarStaffRole): string[] {
  const permissions: Record<BarStaffRole, string[]> = {
    OWNER: ["*"],
    MANAGER: [
      "manage_staff",
      "manage_promotions",
      "view_analytics",
      "scan_passes",
    ],
    PROMOTIONS_MANAGER: ["manage_promotions", "view_analytics"],
    STAFF: ["scan_passes"],
    VIEWER: ["view_analytics"],
  };

  return permissions[role] || [];
}
