// src/app/api/auth/bar/[barId]/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { authService } from "@/services/auth-service";
import { hashPassword } from "@/lib/auth";

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
      console.log(
        `Admin ${authResult.user.email} creating staff for bar ${barId}`
      );
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

    // Hash password and create staff
    const hashedPassword = await hashPassword(password);

    const staff = await prisma.barStaff.create({
      data: {
        barId: barId,
        email: email.toLowerCase(),
        name,
        role,
        permissions: getPermissionsForRole(role),
        hashedPassword,
        isActive: true,
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

    console.log(`✅ Staff account created for ${email} at bar ${barId}`);

    return NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        role: staff.role,
        permissions: staff.permissions,
        isActive: staff.isActive,
        lastLogin: staff.lastLogin,
        createdAt: staff.createdAt,
      },
    });
  } catch (error) {
    console.error("Create bar staff error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
      console.log(
        `Admin ${authResult.user.email} accessing staff for bar ${barId}`
      );
    } else if (authResult.type === "bar_staff") {
      // Bar staff must belong to the same bar
      if (authResult.user.barId !== barId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const staff = await prisma.barStaff.findMany({
      where: { barId: barId },
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ staff });
  } catch (error) {
    console.error("Fetch bar staff error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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

    const { staffId, name, role, isActive } = await request.json();

    if (!staffId) {
      return NextResponse.json(
        { error: "Staff ID is required" },
        { status: 400 }
      );
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
    console.error("Update bar staff error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
    console.error("Delete bar staff error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
