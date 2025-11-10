// src/app/api/auth/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database";
import { authService } from "@/services/auth-service";
import { hashPassword } from "@/lib/auth";

// GET - List all admin users
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const authResult = await authService.validateToken(token);

    if (
      authResult.type !== "admin" ||
      authResult.user.adminRole !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      );
    }

    const adminUsers = await prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users: adminUsers });
  } catch (error) {
    console.error("Get admin users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new admin user
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const authResult = await authService.validateToken(token);

    if (
      authResult.type !== "admin" ||
      authResult.user.adminRole !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      );
    }

    const { email, name, role, password } = await request.json();

    if (!email || !name || !role || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: "Admin user already exists" },
        { status: 409 }
      );
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);

    const admin = await prisma.adminUser.create({
      data: {
        email: email.toLowerCase(),
        name,
        role,
        hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update admin user
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const authResult = await authService.validateToken(token);

    if (
      authResult.type !== "admin" ||
      authResult.user.adminRole !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const { email, name, role, password, isActive } = await request.json();

    if (!email || !name || !role) {
      return NextResponse.json(
        { error: "Email, name, and role are required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { id: userId },
    });

    if (!existingAdmin) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 404 }
      );
    }

    // Check if email is already taken by another user
    const emailExists = await prisma.adminUser.findFirst({
      where: {
        email: email.toLowerCase(),
        id: { not: userId },
      },
    });

    if (emailExists) {
      return NextResponse.json(
        { error: "Email already taken by another user" },
        { status: 409 }
      );
    }

    // Prepare update data
    const updateData: any = {
      email: email.toLowerCase(),
      name,
      role,
      isActive: isActive !== undefined ? isActive : existingAdmin.isActive,
    };

    // Only update password if provided
    if (password) {
      updateData.hashedPassword = await hashPassword(password);
    }

    const updatedAdmin = await prisma.adminUser.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        name: updatedAdmin.name,
        role: updatedAdmin.role,
        isActive: updatedAdmin.isActive,
      },
    });
  } catch (error) {
    console.error("Update admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete admin user
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const authResult = await authService.validateToken(token);

    if (
      authResult.type !== "admin" ||
      authResult.user.adminRole !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Prevent users from deleting their own account
    if (userId === authResult.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { id: userId },
    });

    if (!existingAdmin) {
      return NextResponse.json(
        { error: "Admin user not found" },
        { status: 404 }
      );
    }

    // Delete the user
    await prisma.adminUser.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "Admin user deleted successfully",
    });
  } catch (error) {
    console.error("Delete admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
