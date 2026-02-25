import { and, eq } from "drizzle-orm";
import { db } from "~~/server/infrastructure/db/connection";
import { users } from "~~/server/infrastructure/db/schema";

type UserRole = "admin" | "customer";

function getArg(name: string): string | null {
    const index = process.argv.indexOf(name);
    if (index === -1) {
        return null;
    }
    return process.argv[index + 1] ?? null;
}

function hasFlag(name: string): boolean {
    return process.argv.includes(name);
}

function printHelp(): void {
    console.log(`Usage:
  bun run admin:user:role -- --email user@example.com --role admin
  bun run admin:user:role -- --id <user-id> --customer

Options:
  --email <value>       Find user by email
  --id <value>          Find user by id
  --role <value>        admin | customer
  --admin               Shortcut for --role admin
  --customer            Shortcut for --role customer
  --dry-run             Show current/next role without update
  --help                Show this help
`);
}

if (hasFlag("--help")) {
    printHelp();
    process.exit(0);
}

const email = getArg("--email");
const id = getArg("--id");
const roleArg = getArg("--role");
const roleFromFlag: UserRole | null = hasFlag("--admin")
    ? "admin"
    : hasFlag("--customer")
      ? "customer"
      : null;
const targetRoleRaw = (roleFromFlag ?? roleArg ?? "admin").trim().toLowerCase();

if (!email && !id) {
    console.error("[admin:user:role] provide --email or --id");
    process.exit(1);
}

if (targetRoleRaw !== "admin" && targetRoleRaw !== "customer") {
    console.error(`[admin:user:role] invalid role "${targetRoleRaw}", expected admin|customer`);
    process.exit(1);
}

const targetRole = targetRoleRaw as UserRole;
const where = email && id ? and(eq(users.email, email), eq(users.id, id)) : email ? eq(users.email, email) : eq(users.id, id!);

const [existing] = await db
    .select({
        id: users.id,
        email: users.email,
        role: users.role,
        status: users.status,
    })
    .from(users)
    .where(where)
    .limit(1);

if (!existing) {
    console.error("[admin:user:role] user not found");
    process.exit(1);
}

if (hasFlag("--dry-run")) {
    console.log(
        `[admin:user:role] dry-run user=${existing.id} email=${existing.email ?? "-"} status=${existing.status} role: ${existing.role} -> ${targetRole}`,
    );
    process.exit(0);
}

await db
    .update(users)
    .set({
        role: targetRole,
        updatedAt: new Date(),
    })
    .where(eq(users.id, existing.id));

console.log(
    `[admin:user:role] updated user=${existing.id} email=${existing.email ?? "-"} role: ${existing.role} -> ${targetRole}`,
);
