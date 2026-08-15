const { prisma } = require("../../config/prisma");
const { ApiError } = require("../../utils/apiError");
const { slugify } = require("./organization.validation");

async function generateUniqueSlug(name) {
  const base = slugify(name);
  let slug = base;
  let counter = 1;

  // Keep appending -2, -3, etc. until we find a slug that's free
  while (await prisma.organization.findUnique({ where: { slug } })) {
    counter += 1;
    slug = `${base}-${counter}`;
  }

  return slug;
}

async function createOrganization(userId, { name }) {
  const slug = await generateUniqueSlug(name);

  // Creating an org + adding the creator as OWNER must succeed or fail together
  const organization = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name, slug },
    });

    await tx.organizationMember.create({
      data: {
        organizationId: org.id,
        userId,
        role: "OWNER",
      },
    });

    await tx.subscription.create({
      data: { organizationId: org.id, plan: "FREE", seats: 5 },
    });

    return org;
  });

  return organization;
}

async function getUserOrganizations(userId) {
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        include: {
          _count: { select: { members: true, projects: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return memberships.map((m) => ({
    ...m.organization,
    myRole: m.role,
    memberCount: m.organization._count.members,
    projectCount: m.organization._count.projects,
  }));
}

async function getOrganizationById(organizationId) {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
          },
        },
      },
      subscription: true,
    },
  });

  if (!organization) {
    throw ApiError.notFound("Organization not found");
  }

  return organization;
}

async function updateOrganization(organizationId, { name, logoUrl }) {
  const data = {};
  if (name !== undefined) data.name = name;
  if (logoUrl !== undefined) data.logoUrl = logoUrl;

  return prisma.organization.update({
    where: { id: organizationId },
    data,
  });
}

async function deleteOrganization(organizationId) {
  await prisma.organization.delete({ where: { id: organizationId } });
}

async function inviteMember(organizationId, { email, role }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Phase 1: user must already have a DevFlow account.
    // Phase 5: send an email invite that lets them register + auto-join.
    throw ApiError.notFound(
      "No DevFlow account found for this email. They need to register first."
    );
  }

  const existingMembership = await prisma.organizationMember.findUnique({
    where: { organizationId_userId: { organizationId, userId: user.id } },
  });

  if (existingMembership) {
    throw ApiError.conflict("This user is already a member of the organization");
  }

  const membership = await prisma.organizationMember.create({
    data: { organizationId, userId: user.id, role },
    include: {
      user: {
        select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
      },
    },
  });

  return membership;
}

async function updateMemberRole(organizationId, memberId, newRole, actingUserId) {
  const targetMembership = await prisma.organizationMember.findUnique({
    where: { id: memberId },
  });

  if (!targetMembership || targetMembership.organizationId !== organizationId) {
    throw ApiError.notFound("Membership not found");
  }

  if (targetMembership.userId === actingUserId && targetMembership.role === "OWNER") {
    throw ApiError.badRequest(
      "The owner cannot change their own role. Transfer ownership first."
    );
  }

  if (newRole === "OWNER") {
    throw ApiError.badRequest("Use the dedicated transfer-ownership action to assign OWNER");
  }

  return prisma.organizationMember.update({
    where: { id: memberId },
    data: { role: newRole },
  });
}

async function removeMember(organizationId, memberId) {
  const membership = await prisma.organizationMember.findUnique({ where: { id: memberId } });

  if (!membership || membership.organizationId !== organizationId) {
    throw ApiError.notFound("Membership not found");
  }

  if (membership.role === "OWNER") {
    throw ApiError.badRequest("Cannot remove the organization owner. Transfer ownership first.");
  }

  await prisma.organizationMember.delete({ where: { id: memberId } });
}

module.exports = {
  createOrganization,
  getUserOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  inviteMember,
  updateMemberRole,
  removeMember,
};