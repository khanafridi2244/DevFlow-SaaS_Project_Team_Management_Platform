const { ApiError } = require("../utils/apiError");
const { prisma } = require("../config/prisma");
const { asyncHandler } = require("../utils/asyncHandler");

// Higher number = more privilege. Used to support "at least this role" checks.
const ROLE_RANK = {
  VIEWER: 1,
  DEVELOPER: 2,
  MANAGER: 3,
  ADMIN: 4,
  OWNER: 5,
};

/**
 * Resolves the organizationId for the current request.
 * Checks route params first (e.g. /organizations/:organizationId/...),
 * then falls back to the request body (e.g. POST /projects { organizationId }).
 */
function resolveOrganizationId(req) {
  return req.params.organizationId || req.body.organizationId;
}

/**
 * Middleware factory: requireRole('ADMIN') means "ADMIN or higher".
 * Must run AFTER verifyJWT, since it needs req.user.
 */
function requireRole(minimumRole) {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized("Authentication required");
    }

    const organizationId = resolveOrganizationId(req);
    if (!organizationId) {
      throw ApiError.badRequest("organizationId is required for this action");
    }

    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: req.user.id,
        },
      },
    });

    if (!membership) {
      throw ApiError.forbidden("You are not a member of this organization");
    }

    if (ROLE_RANK[membership.role] < ROLE_RANK[minimumRole]) {
      throw ApiError.forbidden(
        `This action requires the ${minimumRole} role or higher`
      );
    }

    req.membership = membership; // downstream handlers can read req.membership.role
    next();
  });
}

module.exports = { requireRole, ROLE_RANK };