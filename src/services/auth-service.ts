// src/services/auth-service.ts
import { prisma } from "@/lib/database";
import {
  verifyPassword,
  generateAdminToken,
  generateBarStaffToken,
} from "@/lib/auth";

export class AuthService {
  // Admin authentication — uses dedicated AdminUser model
  async authenticateAdmin(email: string, password: string) {
    const adminUser = await prisma.adminUser.findFirst({
      where: {
        email: email.toLowerCase(),
        isActive: true,
      },
    });

    if (!adminUser || !adminUser.hashedPassword) {
      throw new Error("Invalid credentials");
    }

    const isValid = await verifyPassword(password, adminUser.hashedPassword);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    // Update last login
    await prisma.adminUser.update({
      where: { id: adminUser.id },
      data: { lastLogin: new Date() },
    });

    const token = generateAdminToken({
      id: adminUser.id,
      role: adminUser.role,
    });

    return {
      token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: "admin" as const,
        adminRole: adminUser.role,
      },
    };
  }

  // Bar staff authentication — auth via User record, bar context via BarStaff
  async authenticateBarStaff(email: string, password: string, barId?: string) {
    // Step 1: Authenticate via User record
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.hashedPassword) {
      throw new Error("Invalid credentials");
    }

    const isValid = await verifyPassword(password, user.hashedPassword);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    // Step 2: Find BarStaff record for bar context
    const staff = await prisma.barStaff.findFirst({
      where: {
        userId: user.id,
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

    if (!staff) {
      throw new Error("No bar association found for this account");
    }

    if (!staff.bar.isActive) {
      throw new Error("Bar account is inactive");
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
      const adminUser = await prisma.adminUser.findFirst({
        where: { id: payload.userId, isActive: true },
      });

      if (!adminUser) {
        throw new Error("Admin user not found or inactive");
      }

      return {
        type: "admin" as const,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: "admin" as const,
          adminRole: adminUser.role,
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
