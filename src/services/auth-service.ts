// src/services/auth-service.ts
import { prisma } from "@/lib/database";
import {
  verifyPassword,
  generateAdminToken,
  generateBarStaffToken,
  type AdminJWTPayload,
  type BarStaffJWTPayload,
} from "@/lib/auth";

export class AuthService {
  // Admin authentication
  async authenticateAdmin(email: string, password: string) {
    const admin = await prisma.adminUser.findFirst({
      where: {
        email: email.toLowerCase(),
        isActive: true,
      },
    });

    if (!admin || !admin.hashedPassword) {
      throw new Error("Invalid credentials");
    }

    const isValid = await verifyPassword(password, admin.hashedPassword);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    // Update last login
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    const token = generateAdminToken({
      id: admin.id,
      role: admin.role,
    });

    return {
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: "admin" as const,
        adminRole: admin.role,
      },
    };
  }

  // Bar staff authentication
  async authenticateBarStaff(email: string, password: string, barId?: string) {
    const staff = await prisma.barStaff.findFirst({
      where: {
        email: email.toLowerCase(),
        isActive: true,
        ...(barId && { barId }),
      },
      include: {
        bar: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!staff || !staff.hashedPassword) {
      throw new Error("Invalid credentials");
    }

    if (!staff.bar.isActive) {
      throw new Error("Bar account is inactive");
    }

    const isValid = await verifyPassword(password, staff.hashedPassword);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    // Update last login
    await prisma.barStaff.update({
      where: { id: staff.id },
      data: { lastLogin: new Date() },
    });

    const token = generateBarStaffToken({
      id: staff.id,
      barId: staff.barId,
      role: staff.role,
      permissions: staff.permissions,
    });

    return {
      token,
      user: {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        role: "bar_staff" as const,
        barId: staff.barId,
        barName: staff.bar.name,
        staffRole: staff.role,
        permissions: staff.permissions,
      },
    };
  }

  // Validate token and get user data
  async validateToken(token: string) {
    const { verifyToken, isAdminToken, isBarStaffToken } = await import(
      "@/lib/auth"
    );

    const payload = verifyToken(token);
    if (!payload) {
      throw new Error("Invalid token");
    }

    if (isAdminToken(payload)) {
      const admin = await prisma.adminUser.findUnique({
        where: { id: payload.userId },
      });

      if (!admin || !admin.isActive) {
        throw new Error("Admin user not found");
      }

      return {
        type: "admin" as const,
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: "admin" as const,
          adminRole: admin.role,
        },
      };
    }

    if (isBarStaffToken(payload)) {
      const staff = await prisma.barStaff.findUnique({
        where: { id: payload.userId },
        include: {
          bar: {
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
      });

      if (!staff || !staff.isActive || !staff.bar.isActive) {
        throw new Error("Staff user not found");
      }

      return {
        type: "bar_staff" as const,
        user: {
          id: staff.id,
          email: staff.email,
          name: staff.name,
          role: "bar_staff" as const,
          barId: staff.barId,
          barName: staff.bar.name,
          staffRole: staff.role,
          permissions: staff.permissions,
        },
      };
    }

    throw new Error("Invalid token type");
  }
}

export const authService = new AuthService();
